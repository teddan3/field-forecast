<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Match extends Model
{
    protected $fillable = [
        'api_id',
        'home_team_id',
        'away_team_id',
        'competition',
        'competition_id',
        'round',
        'season',
        'match_date',
        'status',
        'status_long',
        'elapsed',
        'home_score',
        'away_score',
        'home_half_time',
        'away_half_time',
        'venue',
        'city',
        'referee',
        'is_live',
        'is_premium',
    ];

    protected $casts = [
        'match_date' => 'datetime',
        'is_live' => 'boolean',
        'is_premium' => 'boolean',
    ];

    public function homeTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'home_team_id');
    }

    public function awayTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'away_team_id');
    }

    public function teamStats(): HasMany
    {
        return $this->hasMany(TeamStat::class);
    }

    public function getIsPremiumAttribute(): bool
    {
        return in_array($this->competition_id, Team::getPremiumLeagueIds());
    }

    public function getScoreAttribute(): string
    {
        if ($this->home_score === null) {
            return 'vs';
        }
        return "{$this->home_score} - {$this->away_score}";
    }

    public function getStatusBadgeAttribute(): string
    {
        return match ($this->status) {
            '1H', '2H', 'HT' => 'LIVE',
            'FT' => 'FT',
            'NS' => 'Scheduled',
            default => $this->status_long ?? $this->status,
        };
    }

    public function scopeLive($query)
    {
        return $query->where('is_live', true);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('match_date', now()->toDateString());
    }

    public function scopeByLeague($query, int $leagueId)
    {
        return $query->where('competition_id', $leagueId);
    }
}