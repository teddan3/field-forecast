<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

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
        'is_valid',
    ];

    protected $casts = [
        'match_date' => 'datetime',
        'is_live' => 'boolean',
        'is_premium' => 'boolean',
        'is_valid' => 'boolean',
    ];

    const STATUS_LIVE = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'penalty', 'extratime'];
    const STATUS_UPCOMING = ['NS', 'TBD', 'SCHEDULED'];
    const STATUS_INVALID = ['FT', 'FINISHED', 'CANCELLED', 'ABAN', 'AWD', 'WO', 'POSTPONED', 'SUSPENDED'];

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
            '1H', '2H' => 'LIVE',
            'HT' => 'HT',
            'FT' => 'FT',
            'NS' => 'Scheduled',
            'TBD' => 'TBD',
            default => $this->status_long ?? $this->status,
        };
    }

    public function getIsUpcomingAttribute(): bool
    {
        if (!$this->match_date) {
            return false;
        }

        $matchTime = \Carbon\Carbon::parse($this->match_date)->utc();
        $now = \Carbon\Carbon::now()->utc();

        return $matchTime->isFuture() || $matchTime->diffInMinutes($now) <= 15;
    }

    public function getIsLiveAttribute(): bool
    {
        return in_array($this->status, self::STATUS_LIVE);
    }

    public function getIsValidAttribute(): bool
    {
        if (in_array($this->status, self::STATUS_INVALID)) {
            return false;
        }

        if ($this->is_live === false && !$this->is_upcoming) {
            return false;
        }

        return !is_null($this->home_team_id) && !is_null($this->away_team_id);
    }

    public function scopeValid(Builder $query): Builder
    {
        return $query->where('is_valid', true)
            ->whereNotIn('status', self::STATUS_INVALID);
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->valid()
            ->where('match_date', '>', now()->utc()->subMinutes(15))
            ->whereIn('status', self::STATUS_UPCOMING);
    }

    public function scopeLive(Builder $query): Builder
    {
        return $query->valid()
            ->where('is_live', true);
    }

    public function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('match_date', now()->utc()->toDateString());
    }

    public function scopePremium(Builder $query): Builder
    {
        return $query->where('is_premium', true);
    }

    public function scopeByLeague(Builder $query, int $leagueId): Builder
    {
        return $query->where('competition_id', $leagueId);
    }

    public function scopeNotExpired(Builder $query, int $hours = 48): Builder
    {
        return $query->where('match_date', '>', now()->subHours($hours));
    }

    public function scopeUpcomingWithTeams(Builder $query): Builder
    {
        return $query->upcoming()
            ->with(['homeTeam', 'awayTeam']);
    }

    public function scopeUpcomingWithTeamsByLeague(Builder $query, array $leagueIds): Builder
    {
        return $query->upcoming()
            ->whereIn('competition_id', $leagueIds)
            ->with(['homeTeam', 'awayTeam']);
    }

    public static function getValidStatuses(): array
    {
        return array_merge(self::STATUS_UPCOMING, self::STATUS_LIVE);
    }

    public static function getInvalidStatuses(): array
    {
        return self::STATUS_INVALID;
    }

    public function markAsValid(): void
    {
        $this->update(['is_valid' => true]);
    }

    public function markAsInvalid(?string $reason = null): void
    {
        $this->update(['is_valid' => false]);
        
        if ($reason) {
            Log::info("Match {$this->id} marked invalid: {$reason}");
        }
    }
}