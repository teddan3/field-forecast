<?php

namespace App\Services;

use App\Models\Match;
use App\Models\Team;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class MatchValidationService
{
    const VALID_STATUSES = ['NS', 'TBD', 'SCHEDULED', 'POSTPONED', 'SUSPENDED', 'IN_PLAY'];
    const INVALID_STATUSES = ['FT', 'FINISHED', 'CANCELLED', 'ABAN', 'AWD', 'WO'];
    const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'penalty', 'extratime'];

    public function isValidUpcomingMatch(Match $match): bool
    {
        if (!$this->hasValidStatus($match)) {
            Log::debug("Match {$match->id}: Invalid status - {$match->status}");
            return false;
        }

        if (!$this->isUpcoming($match)) {
            Log::debug("Match {$match->id}: Not upcoming - {$match->match_date}");
            return false;
        }

        if (!$this->hasValidTeams($match)) {
            Log::debug("Match {$match->id}: Invalid teams");
            return false;
        }

        return true;
    }

    public function hasValidStatus(Match $match): bool
    {
        $status = $match->status;
        
        if (in_array($status, self::INVALID_STATUSES)) {
            return false;
        }

        return true;
    }

    public function isUpcoming(Match $match): bool
    {
        $matchTime = $this->parseMatchTime($match->match_date);
        $now = now()->utc();
        
        return $matchTime->isFuture() || $matchTime->diffInMinutes($now) <= 15;
    }

    public function isLive(Match $match): bool
    {
        return in_array($match->status, self::LIVE_STATUSES);
    }

    public function hasValidTeams(Match $match): bool
    {
        if (!$match->home_team_id || !$match->away_team_id) {
            return false;
        }

        $homeTeam = Team::find($match->home_team_id);
        $awayTeam = Team::find($match->away_team_id);

        if (!$homeTeam || !$awayTeam) {
            return false;
        }

        if (!$homeTeam->api_id || !$awayTeam->api_id) {
            return false;
        }

        return true;
    }

    public function getMatchStatus(Match $match): string
    {
        if ($this->isLive($match)) {
            return 'live';
        }

        if ($this->isUpcoming($match)) {
            return 'upcoming';
        }

        if (in_array($match->status, self::INVALID_STATUSES)) {
            return 'invalid';
        }

        return 'finished';
    }

    public function isValidForPrediction(Match $match): bool
    {
        return $this->isValidUpcomingMatch($match) && 
               $this->isUpcoming($match) && 
               !$this->isLive($match);
    }

    public function parseMatchTime($date): Carbon
    {
        if ($date instanceof Carbon) {
            return $date;
        }

        if (is_string($date)) {
            return Carbon::parse($date)->utc();
        }

        return Carbon::now()->utc();
    }

    public function validateAndCleanMatches(): array
    {
        $stats = [
            'invalidated' => 0,
            'archived' => 0,
            'valid' => 0,
        ];

        $matches = Match::all();

        foreach ($matches as $match) {
            if (!$this->isValidUpcomingMatch($match)) {
                $match->update(['is_valid' => false]);
                $stats['invalidated']++;
            } else {
                $match->update(['is_valid' => true]);
                $stats['valid']++;
            }
        }

        return $stats;
    }

    public function getUpcomingMatches(int $limit = 50): \Illuminate\Database\Eloquent\Collection
    {
        return Match::where('is_valid', true)
            ->where('match_date', '>', now()->utc()->addMinutes(-15))
            ->whereIn('status', self::VALID_STATUSES)
            ->with(['homeTeam', 'awayTeam'])
            ->orderBy('match_date')
            ->limit($limit)
            ->get();
    }

    public function getLiveMatches(): \Illuminate\Database\Eloquent\Collection
    {
        return Match::where('is_live', true)
            ->where('is_valid', true)
            ->with(['homeTeam', 'awayTeam'])
            ->orderBy('match_date')
            ->get();
    }

    public function getMatchCountSummary(): array
    {
        return [
            'upcoming' => $this->getUpcomingMatches()->count(),
            'live' => $this->getLiveMatches()->count(),
            'finished' => Match::whereIn('status', self::INVALID_STATUSES)->count(),
            'total' => Match::count(),
        ];
    }
}