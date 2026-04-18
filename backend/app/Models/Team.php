<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Team extends Model
{
    protected $fillable = [
        'api_id',
        'name',
        'short_name',
        'logo',
        'country',
        'city',
        'venue',
        'league_id',
        'league_name',
        'is_premium',
    ];

    protected $casts = [
        'is_premium' => 'boolean',
    ];

    public function homeMatches(): HasMany
    {
        return $this->hasMany(Match::class, 'home_team_id');
    }

    public function awayMatches(): HasMany
    {
        return $this->hasMany(Match::class, 'away_team_id');
    }

    public function stats(): HasMany
    {
        return $this->hasMany(TeamStat::class);
    }

    public function h2hAsHome(): HasMany
    {
        return $this->hasMany(HeadToHeadRecord::class, 'team_home_id');
    }

    public function h2hAsAway(): HasMany
    {
        return $this->hasMany(HeadToHeadRecord::class, 'team_away_id');
    }

    public function getRecentFormAttribute(): array
    {
        $matches = $this->homeMatches()
            ->union($this->awayMatches())
            ->orderBy('match_date', 'desc')
            ->limit(5)
            ->get();

        $form = [];
        foreach ($matches as $match) {
            $isHome = $match->home_team_id === $this->id;
            $goalsFor = $isHome ? $match->home_score : $match->away_score;
            $goalsAgainst = $isHome ? $match->away_score : $match->home_score;

            if ($goalsFor > $goalsAgainst) {
                $form[] = 'W';
            } elseif ($goalsFor < $goalsAgainst) {
                $form[] = 'L';
            } else {
                $form[] = 'D';
            }
        }

        return $form;
    }

    public function getIsPremiumAttribute(): bool
    {
        return in_array($this->league_id, [39, 140, 78, 135, 61, 2, 3]);
    }

    public static function getPremiumLeagueIds(): array
    {
        return [39, 140, 78, 135, 61, 2, 3];
    }
}