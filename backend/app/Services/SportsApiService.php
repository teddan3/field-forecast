<?php

namespace App\Services;

use App\Models\Team;
use App\Models\Match;
use App\Models\TeamStat;
use App\Models\HeadToHeadRecord;
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
    private array $premiumLeagueIds;

    public function __construct()
    {
        $this->apiKey = config('services.api_football.key');
        $this->baseUrl = config('services.api_football.base_url');
        $this->cacheLiveScoreTtl = config('cache.livescore_ttl', 60);
        $this->cacheTeamStatsTtl = config('cache.team_stats_ttl', 86400);
        $this->cacheH2hTtl = config('cache.h2h_ttl', 43200);
        $this->premiumLeagueIds = Team::getPremiumLeagueIds();
    }

    public function fetchLiveFixtures(): array
    {
        $cacheKey = 'live_fixtures';

        return Cache::remember($cacheKey, $this->cacheLiveScoreTtl, function () {
            return $this->callApi('/fixtures?live=all&timezone=America/New_York');
        });
    }

    public function fetchFixturesByDate(string $date): array
    {
        $cacheKey = "fixtures_{$date}";

        return Cache::remember($cacheKey, $this->cacheLiveScoreTtl, function () use ($date) {
            return $this->callApi("/fixtures?date={$date}&timezone=America/New_York");
        });
    }

    public function fetchOdds(int $fixtureId): ?array
    {
        $cacheKey = "odds_{$fixtureId}";

        return Cache::remember($cacheKey, $this->cacheLiveScoreTtl, function () use ($fixtureId) {
            return $this->callApi("/odds?fixture={$fixtureId}&timezone=America/New_York");
        });
    }

    public function fetchH2H(int $team1Id, int $team2Id): array
    {
        $cacheKey = "h2h_{$team1Id}_{$team2Id}";

        return Cache::remember($cacheKey, $this->cacheH2hTtl, function () use ($team1Id, $team2Id) {
            return $this->callApi("/fixtures?h2h={$team1Id}-{$team2Id}&timezone=America/New_York");
        });
    }

    public function syncTeamsFromApi(): int
    {
        $fixtures = $this->fetchFixturesByDate(now()->toDateString());
        $synced = 0;

        foreach ($fixtures as $fixture) {
            $league = $fixture['league'] ?? [];
            $teams = $fixture['teams'] ?? [];

            foreach ([$teams['home'] ?? [], $teams['away'] ?? [] as $teamData) {
                $synced += Team::updateOrCreate(
                    ['api_id' => $teamData['id']],
                    [
                        'name' => $teamData['name'],
                        'logo' => $teamData['logo'],
                        'league_id' => $league['id'] ?? null,
                        'league_name' => $league['name'] ?? null,
                        'is_premium' => in_array($league['id'] ?? null, $this->premiumLeagueIds),
                    ]
                ) ? 1 : 0;
            }
        }

        return $synced;
    }

    public function syncMatchesFromApi(): int
    {
        $fixtures = $this->fetchFixturesByDate(now()->toDateString());
        $synced = 0;

        foreach ($fixtures as $fixture) {
            $apiId = $fixture['fixture']['id'];
            $league = $fixture['league'] ?? [];
            $teams = $fixture['teams'] ?? [];
            $goals = $fixture['goals'] ?? [];
            $score = $fixture['score'] ?? [];

            $homeTeam = Team::where('api_id', $teams['home']['id'] ?? null)->first();
            $awayTeam = Team::where('api_id', $teams['away']['id'] ?? null)->first();

            if (!$homeTeam || !$awayTeam) {
                continue;
            }

            $status = $fixture['fixture']['status']['short'] ?? 'NS';
            $isLive = in_array($status, ['1H', '2H', 'HT', 'ET', 'BT', 'P']);

            $synced += Match::updateOrCreate(
                ['api_id' => $apiId],
                [
                    'home_team_id' => $homeTeam->id,
                    'away_team_id' => $awayTeam->id,
                    'competition' => $league['name'] ?? null,
                    'competition_id' => $league['id'] ?? null,
                    'round' => $league['round'] ?? null,
                    'season' => $league['season'] ?? null,
                    'match_date' => $fixture['fixture']['date'] ?? now(),
                    'status' => $status,
                    'status_long' => $fixture['fixture']['status']['long'] ?? null,
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
                ]
            ) ? 1 : 0;
        }

        return $synced;
    }

    public function syncH2HRecord(int $team1Id, int $team2Id): ?HeadToHeadRecord
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

        return HeadToHeadRecord::updateOrCreate(
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