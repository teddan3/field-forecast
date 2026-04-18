<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HeadToHeadRecord extends Model
{
    protected $fillable = [
        'team_home_id',
        'team_away_id',
        'match_id',
        'home_wins',
        'away_wins',
        'draws',
        'home_goals',
        'away_goals',
        'total_matches',
        'last_meeting',
    ];

    protected $casts = [
        'last_meeting' => 'datetime',
    ];

    public function teamHome(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'team_home_id');
    }

    public function teamAway(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'team_away_id');
    }

    public function match(): BelongsTo
    {
        return $this->belongsTo(Match::class);
    }

    public function getWinDistributionAttribute(): array
    {
        return [
            'home' => $this->home_wins,
            'draw' => $this->draws,
            'away' => $this->away_wins,
        ];
    }

    public function getAverageScoreAttribute(): string
    {
        if ($this->total_matches === 0) {
            return '0 - 0';
        }
        $homeAvg = round($this->home_goals / $this->total_matches, 1);
        $awayAvg = round($this->away_goals / $this->total_matches, 1);
        return "{$homeAvg} - {$awayAvg}";
    }
}