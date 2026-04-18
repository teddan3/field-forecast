<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamStat extends Model
{
    protected $fillable = [
        'team_id',
        'match_id',
        'league_id',
        'position',
        'games_played',
        'wins',
        'draws',
        'losses',
        'goals_for',
        'goals_against',
        'points',
        'form_w',
        'form_d',
        'form_l',
        'possession',
        'shots_on_target',
        'shots_off_target',
        'corners',
        'fouls',
        'yellow_cards',
        'red_cards',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function match(): BelongsTo
    {
        return $this->belongsTo(Match::class);
    }

    public function getGoalDifferenceAttribute(): int
    {
        return $this->goals_for - $this->goals_against;
    }

    public function getFormStringAttribute(): string
    {
        return str_repeat('W', $this->form_w) . 
               str_repeat('D', $this->form_d) . 
               str_repeat('L', $this->form_l);
    }
}