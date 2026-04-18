<?php

namespace App\Services;

use App\Models\Team;
use App\Models\Match;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SportsApiService
{
    private string $apiKey;
    private string $baseUrl;
    private int $cacheLiveScoreTtl;
    private int $cacheTeamStatsTtl;
    private int $cacheH2hTtl;
    private int $cacheFixturesTtl;
    private array $premiumLeagueIds;

    const TTL_LIVE = 60;
    const TTL_FIXTURES = 900;
    const TTL_ODDS = 120;

    public function __construct()
    {
        $this->apiKey = config('services.api_football.key');
        $this->baseUrl = config('services.api_football.base_url');
        $this->cacheLiveScoreTtl = config('cache.livescore_ttl', self::TTL_LIVE);
        $this->cacheTeamStatsTtl = config('cache.team_stats_ttl', 86400);
        $this->cacheH2hTtl = config('cache.h2h_ttl', 43200);
        $this->cacheFixturesTtl = config('cache.fixtures_ttl', self::TTL_FIXTURES);
        $this->premiumLeagueIds = Team::getPremiumLeagueIds();
    }

    public function fetchLiveFixtures(): array
    {
        $cacheKey = 'live_fixtures_' . now()->format('H:i');

        return Cache::remember($cacheKey, $this->cacheLiveScoreTtl, function () {
            return $this->callApi('/fixtures?live=all&timezone=UTC');
        });
    }

    public function fetchFixturesByDate(string $date): array
    {
        $cacheKey = "fixtures_{$date}";

        return Cache::remember($cacheKey, $this->cacheFixturesTtl, function () use ($date) {
            return $this->callApi("/fixtures?date={$date}&timezone=UTC");
        });
    }

    public function fetchUpcomingFixtures(int $days = 7): array
    {
        $cacheKey = "fixtures_upcoming_{$days}days";

        return Cache::remember($cacheKey, $this->cacheFixturesTtl, function () use ($days) {
            $fixtures = [];
            
            for ($i = 0; $i < $days; $i++) {
                $date = now()->addDays($i)->format('Y-m-d');
                $dayFixtures = $this->callApi("/fixtures?date={$date}&timezone=UTC");
                $fixtures = array_merge($fixtures, $dayFixtures);
            }
            
            return $fixtures;
        });
    }

    public function fetchOdds(int $fixtureId): ?array
    {
        $cacheKey = "odds_{$fixtureId}";

        return Cache::remember($cacheKey, self::TTL_ODDS, function () use ($fixtureId) {
            return $this->callApi("/odds?fixture={$fixtureId}&timezone=UTC");
        });
    }

    public function fetchH2H(int $team1Id, int $team2Id): array
    {
        $cacheKey = "h2h_{$team1Id}_{$team2Id}";

        return Cache::remember($cacheKey, $this->cacheH2hTtl, function () use ($team1Id, $team2Id) {
            return $this->callApi("/fixtures?h2h={$team1Id}-{$team2Id}&timezone=UTC");
        });
    }

    public function syncTeamsFromApi(): int
    {
        $fixtures = $this->fetchFixturesByDate(now()->format('Y-m-d'));
        $synced = 0;

        foreach ($fixtures as $fixture) {
            $league = $fixture['league'] ?? [];
            $teams = $fixture['teams'] ?? [];

            foreach ([$teams['home'] ?? [], $teams['away'] ?? [] as $teamData) {
                if ($teamData) {
                    Team::updateOrCreate(
                        ['api_id' => $teamData['id']],
                        [
                            'name' => $teamData['name'],
                            'logo' => $teamData['logo'] ?? null,
                            'league_id' => $league['id'] ?? null,
                            'league_name' => $league['name'] ?? null,
                            'is_premium' => in_array($league['id'] ?? null, $this->premiumLeagueIds),
                        ]
                    );
                    $synced++;
                }
            }
        }

        Log::info("Team sync completed", ['count' => $synced]);

        return $synced;
    }

    public function syncMatchesFromApi(): int
    {
        $synced = 0;
        $today = now()->format('Y-m-d');
        
        for ($i = 0; $i < 3; $i++) {
            $date = now()->addDays($i)->format('Y-m-d');
            $fixtures = $this->fetchFixturesByDate($date);
            
            $synced += $this->processFixtures($fixtures);
        }

        Log::info("Match sync completed", ['synced' => $synced, 'date' => $today]);

        return $synced;
    }

    private function processFixtures(array $fixtures): int
    {
        $synced = 0;

        foreach ($fixtures as $fixture) {
            $apiId = $fixture['fixture']['id'] ?? null;
            
            if (!$apiId) {
                continue;
            }

            $result = $this->syncSingleFixture($fixture);
            $synced += $result;
        }

        return $synced;
    }

    private function syncSingleFixture(array $fixture): int
    {
        try {
            $apiId = $fixture['fixture']['id'];
            $league = $fixture['league'] ?? [];
            $teams = $fixture['teams'] ?? [];
            $goals = $fixture['goals'] ?? [];
            $score = $fixture['score'] ?? [];

            $status = $fixture['fixture']['status']['short'] ?? 'NS';
            $statusLong = $fixture['fixture']['status']['long'] ?? null;
            $isLive = in_array($status, ['1H', '2H', 'HT', 'ET', 'BT', 'P']);

            $matchTime = $fixture['fixture']['date'] ?? null;
            $parsedTime = $matchTime ? Carbon::parse($matchTime)->utc() : now()->utc();
            
            $isValid = !$this->isInvalidStatus($status) && 
                      ($parsedTime->isFuture() || $parsedTime->diffInMinutes(now()->utc()) <= 30);

            $homeTeam = Team::where('api_id', $teams['home']['id'] ?? null)->first();
            $awayTeam = Team::where('api_id', $teams['away']['id'] ?? null)->first();

            if (!$homeTeam || !$awayTeam) {
                return 0;
            }

            Match::updateOrCreate(
                ['api_id' => $apiId],
                [
                    'home_team_id' => $homeTeam->id,
                    'away_team_id' => $awayTeam->id,
                    'competition' => $league['name'] ?? null,
                    'competition_id' => $league['id'] ?? null,
                    'round' => $league['round'] ?? null,
                    'season' => $league['season'] ?? null,
                    'match_date' => $parsedTime,
                    'status' => $status,
                    'status_long' => $statusLong,
                    'elapsed' => $fixture['fixture']['status']['elapsed'] ?? null,
                    'home_score' => $goals['home'] ?? null,
                    'away_score' => $goals['away'] ?? null,
                    'home_half_time' => $score['halftime']['home'] ?? null,
                    'away_half_time' => $score['halftime']['away'] ?? null,
                    'venue' => $fixture['fixture']['venue']['name'] ?? null,
                    'city' => $fixture['fixture']['venue']['city'] ?? null,
                    'referee' => $fixture['fixture']['referee'] ?? null,
                    'is_live' => $isLive,
                    'is_premium' => in_array($league['id'] ?? null, $this->premiumLeagueIds),
                    'is_valid' => $isValid,
                ]
            );

            return 1;
        } catch (\Exception $e) {
            Log::error("Failed to sync fixture", [
                'api_id' => $fixture['fixture']['id'] ?? 'unknown',
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    public function syncH2HRecord(int $team1Id, int $team2Id): ?\App\Models\HeadToHeadRecord
    {
        $team1 = Team::findOrFail($team1Id);
        $team2 = Team::findOrFail($team2Id);

        $fixtures = $this->fetchH2H(
            $team1->api_id,
            $team2->api_id
        );

        $homeWins = 0;
        $awayWins = 0;
        $draws = 0;
        $homeGoals = 0;
        $awayGoals = 0;
        $totalMatches = count($fixtures);

        foreach ($fixtures as $fixture) {
            $homeScore = $fixture['goals']['home'] ?? 0;
            $awayScore = $fixture['goals']['away'] ?? 0;

            $homeGoals += $homeScore;
            $awayGoals += $awayScore;

            if ($homeScore > $awayScore) {
                $homeWins++;
            } elseif ($awayScore > $homeScore) {
                $awayWins++;
            } else {
                $draws++;
            }
        }

        $lastMatch = collect($fixtures)->first();

        return \App\Models\HeadToHeadRecord::updateOrCreate(
            [
                'team_home_id' => $team1->id,
                'team_away_id' => $team2->id,
            ],
            [
                'home_wins' => $homeWins,
                'away_wins' => $awayWins,
                'draws' => $draws,
                'home_goals' => $homeGoals,
                'away_goals' => $awayGoals,
                'total_matches' => $totalMatches,
                'last_meeting' => $lastMatch['fixture']['date'] ?? null,
            ]
        );
    }

    public function clearMatchCache(): void
    {
        Cache::flush();
        
        Log::info("All match-related cache cleared");
    }

    private function isInvalidStatus(string $status): bool
    {
        return in_array($status, ['FT', 'FINISHED', 'CANCELLED', 'ABAN', 'AWD', 'WO', 'POSTPONED', 'SUSPENDED']);
    }

    protected function callApi(string $endpoint): array
    {
        $url = $this->baseUrl . $endpoint;

        try {
            $response = Http::withHeaders([
                'x-apisports-key' => $this->apiKey,
            ])->timeout(30)->get($url);

            if (!$response->successful()) {
                Log::error("API-Football error: {$response->status()} - {$response->body()}");
                return [];
            }

            $data = $response->json();

            if (isset($data['errors']) && !empty($data['errors'])) {
                Log::warning("API-Football errors: ", $data['errors']);
            }

            return $data['response'] ?? [];
        } catch (\Exception $e) {
            Log::error("API-Football exception: " . $e->getMessage());
            return [];
        }
    }

    protected function getPremiumLeagueIds(): array
    {
        return [39, 140, 78, 135, 61, 2, 3];
    }
}