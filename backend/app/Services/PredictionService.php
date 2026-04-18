<?php

namespace App\Services;

use App\Models\Match;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PredictionService
{
    private const CACHE_TTL_LIVE = 60;
    private const CACHE_TTL_FIXTURES = 900;

    public function __construct(
        private MatchValidationService $validation
    ) {}

    public function getUpcomingPredictions(?int $userId = null, int $limit = 50): array
    {
        $cacheKey = "predictions_upcoming_" . ($userId ?? 'all');
        
        return Cache::remember($cacheKey, self::CACHE_TTL_FIXTURES, function () use ($limit) {
            $matches = Match::valid()
                ->upcoming()
                ->where('match_date', '<', now()->addDays(7))
                ->with(['homeTeam', 'awayTeam'])
                ->orderBy('match_date')
                ->limit($limit)
                ->get();

            return $this->formatMatches($matches);
        });
    }

    public function getLivePredictions(int $limit = 20): array
    {
        $cacheKey = "predictions_live";
        
        return Cache::remember($cacheKey, self::CACHE_TTL_LIVE, function () use ($limit) {
            $matches = Match::valid()
                ->live()
                ->with(['homeTeam', 'awayTeam'])
                ->orderBy('match_date')
                ->limit($limit)
                ->get();

            return $this->formatMatches($matches);
        });
    }

    public function getPremiumPredictions(int $userId, int $limit = 50): array
    {
        $premiumLeagueIds = Team::getPremiumLeagueIds();
        
        $cacheKey = "predictions_premium_user_{$userId}";
        
        return Cache::remember($cacheKey, self::CACHE_TTL_FIXTURES, function () use ($premiumLeagueIds, $limit) {
            $matches = Match::valid()
                ->upcoming()
                ->whereIn('competition_id', $premiumLeagueIds)
                ->where('match_date', '<', now()->addDays(7))
                ->with(['homeTeam', 'awayTeam'])
                ->orderBy('match_date')
                ->limit($limit)
                ->get();

            return $this->formatMatches($matches);
        });
    }

    public function getFreePredictions(int $limit = 50): array
    {
        $freeLeagueIds = [
            253, 242, 218, 207, 200, 197, 195, 189, 188, 187,
            179, 169, 165, 162, 154, 153, 149, 144, 143, 135,
            131, 127, 125, 122, 118, 108, 107, 106, 104, 103,
            102, 98, 96, 95, 94, 87, 85, 84, 83, 75, 74, 73,
            72, 71, 67, 65, 64, 63, 62, 61, 60, 58, 57, 55,
            54, 53, 48, 47, 45, 42, 41, 40, 38, 37, 36, 35,
            32, 30, 29, 28, 27, 26, 25, 23, 22, 21, 20, 19,
            17, 15, 13, 12, 11, 10, 5, 4, 3, 2, 1,
        ];

        $cacheKey = "predictions_free";
        
        return Cache::remember($cacheKey, self::CACHE_TTL_FIXTURES, function () use ($freeLeagueIds, $limit) {
            $matches = Match::valid()
                ->upcoming()
                ->whereIn('competition_id', $freeLeagueIds)
                ->where('match_date', '<', now()->addDays(7))
                ->with(['homeTeam', 'awayTeam'])
                ->orderBy('match_date')
                ->limit($limit)
                ->get();

            return $this->formatMatches($matches);
        });
    }

    public function getPredictionsByLeague(int $leagueId, int $limit = 50): array
    {
        $cacheKey = "predictions_league_{$leagueId}";
        
        return Cache::remember($cacheKey, self::CACHE_TTL_FIXTURES, function () use ($leagueId, $limit) {
            $matches = Match::valid()
                ->upcoming()
                ->where('competition_id', $leagueId)
                ->where('match_date', '<', now()->addDays(7))
                ->with(['homeTeam', 'awayTeam'])
                ->orderBy('match_date')
                ->limit($limit)
                ->get();

            return $this->formatMatches($matches);
        });
    }

    public function isMatchValidForPrediction(Match $match): bool
    {
        if (!$this->validation->isValidUpcomingMatch($match)) {
            Log::debug("Match {$match->id}: Not valid for prediction");
            return false;
        }

        if (!$match->is_upcoming) {
            Log::debug("Match {$match->id}: Not upcoming");
            return false;
        }

        if ($match->is_live) {
            Log::debug("Match {$match->id}: Already live");
            return false;
        }

        return true;
    }

    public function invalidatePredictionCache(): void
    {
        Cache::forget('predictions_upcoming_all');
        Cache::forget('predictions_premium_user_');
        Cache::forget('predictions_free');
        Cache::forget('predictions_live');
        
        foreach (Team::pluck('id') as $leagueId) {
            Cache::forget("predictions_league_{$leagueId}");
        }

        Log::info("Prediction cache invalidated");
    }

    private function formatMatches($matches): array
    {
        return $matches->map(function ($match) {
            return [
                'id' => $match->id,
                'api_id' => $match->api_id,
                'match_date' => $match->match_date?->toIso8601String(),
                'status' => $match->status,
                'status_long' => $match->status_long,
                'is_live' => $match->is_live,
                'is_valid' => $match->is_valid,
                'is_upcoming' => $match->is_upcoming,
                'is_premium' => $match->is_premium,
                'competition' => [
                    'id' => $match->competition_id,
                    'name' => $match->competition,
                ],
                'home_team' => [
                    'id' => $match->homeTeam?->id,
                    'api_id' => $match->homeTeam?->api_id,
                    'name' => $match->homeTeam?->name,
                    'logo' => $match->homeTeam?->logo,
                ],
                'away_team' => [
                    'id' => $match->awayTeam?->id,
                    'api_id' => $match->awayTeam?->api_id,
                    'name' => $match->awayTeam?->name,
                    'logo' => $match->awayTeam?->logo,
                ],
                'score' => [
                    'home' => $match->home_score,
                    'away' => $match->away_score,
                ],
                'time' => [
                    'elapsed' => $match->elapsed,
                    'minute' => $match->elapsed,
                ],
            ];
        })->toArray();
    }

    public function getMatchSummary(): array
    {
        return [
            'total' => Match::count(),
            'valid' => Match::where('is_valid', true)->count(),
            'invalid' => Match::where('is_valid', false)->count(),
            'upcoming' => Match::valid()->upcoming()->count(),
            'live' => Match::valid()->live()->count(),
            'premium_upcoming' => Match::valid()->upcoming()->premium()->count(),
            'free_upcoming' => Match::valid()->upcoming()->where('is_premium', false)->count(),
        ];
    }
}