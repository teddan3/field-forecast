<?php

namespace App\Console\Commands;

use App\Services\SportsApiService;
use App\Services\MatchValidationService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncFixtures extends Command
{
    protected $signature = 'fixtures:sync {--date= : Specific date to sync (Y-m-d)} {--hours= : Hours ahead to sync}';
    protected $description = 'Sync fixtures from API-Football and validate matches';

    public function __construct(
        private SportsApiService $sportsApi,
        private MatchValidationService $validation
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $date = $this->option('date');
        $hours = $this->option('hours') ?? 24;
        
        $startDate = $date ? Carbon::parse($date) : now();
        $endDate = $startDate->copy()->addHours((int)$hours);
        
        $this->info("Syncing fixtures from {$startDate->toDateString()} for next {$hours} hours...");
        
        $synced = 0;
        $currentDate = $startDate->copy();
        
        while ($currentDate->lte($endDate)) {
            $synced += $this->syncDate($currentDate->toDateString());
            $currentDate->addDay();
        }
        
        $this->validateMatches();
        
        $this->info("Synced {$synced} fixtures total");
        
        Log::info("Fixture sync completed", [
            'synced' => $synced,
            'date' => $startDate->toDateString(),
        ]);

        return Command::SUCCESS;
    }

    private function syncDate(string $date): int
    {
        $this->info("Syncing fixtures for {$date}...");
        
        $fixtures = $this->sportsApi->fetchFixturesByDate($date);
        
        if (empty($fixtures)) {
            $this->warn("No fixtures found for {$date}");
            return 0;
        }

        $synced = 0;
        
        foreach ($fixtures as $fixture) {
            $apiId = $fixture['fixture']['id'] ?? null;
            
            if (!$apiId) {
                continue;
            }

            $result = $this->syncSingleMatch($fixture);
            $synced += $result;
        }
        
        $this->info("Synced {$synced} fixtures for {$date}");
        
        return $synced;
    }

    private function syncSingleMatch(array $fixture): int
    {
        try {
            $apiId = $fixture['fixture']['id'];
            $league = $fixture['league'] ?? [];
            $teams = $fixture['teams'] ?? [];
            $goals = $fixture['goals'] ?? [];
            $score = $fixture['score'] ?? [];
            
            $status = $fixture['fixture']['status']['short'] ?? 'NS';
            $isLive = in_array($status, ['1H', '2H', 'HT', 'ET', 'BT', 'P']);
            
            $matchTime = $fixture['fixture']['date'] ?? null;
            $parsedTime = $matchTime ? Carbon::parse($matchTime)->utc() : now()->utc();
            $isValid = !$this->isInvalidStatus($status) && 
                      ($parsedTime->isFuture() || $parsedTime->diffInMinutes(now()->utc()) <= 15);

            $homeTeam = \App\Models\Team::where('api_id', $teams['home']['id'] ?? null)->first();
            $awayTeam = \App\Models\Team::where('api_id', $teams['away']['id'] ?? null)->first();

            if (!$homeTeam || !$awayTeam) {
                return 0;
            }

            \App\Models\Match::updateOrCreate(
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
                    'is_premium' => in_array($league['id'] ?? null, \App\Models\Team::getPremiumLeagueIds()),
                    'is_valid' => $isValid,
                ]
            );

            return 1;
        } catch (\Exception $e) {
            Log::error("Failed to sync match: " . ($fixture['fixture']['id'] ?? 'unknown'), [
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    private function validateMatches(): void
    {
        $this->info("Validating matches...");
        
        $matches = \App\Models\Match::all();
        $validated = 0;
        $invalidated = 0;
        
        foreach ($matches as $match) {
            $isValid = $this->validation->isValidUpcomingMatch($match);
            
            if ($isValid !== (bool)$match->is_valid) {
                $match->update(['is_valid' => $isValid]);
                
                if ($isValid) {
                    $validated++;
                } else {
                    $invalidated++;
                }
            }
        }
        
        $this->info("Validated: {$validated}, Invalidated: {$invalidated}");
    }

    private function isInvalidStatus(string $status): bool
    {
        return in_array($status, ['FT', 'FINISHED', 'CANCELLED', 'ABAN', 'AWD', 'WO']);
    }
}