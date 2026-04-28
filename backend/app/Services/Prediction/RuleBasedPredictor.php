<?php

namespace App\Services\Prediction;

class RuleBasedPredictor
{
    // Simple rule-based predictor using team historical average goals and home advantage
    public function predict($fixture)
    {
        // fixture: array with home_team_id, away_team_id, league, etc.
        // Return probabilities for home, draw, away
        // This is a stub - replace with a proper model later
        $home = 0.45;
        $draw = 0.25;
        $away = 0.30;
        // normalize
        $s = $home + $draw + $away;
        return ['home' => $home/$s, 'draw' => $draw/$s, 'away' => $away/$s];
    }
}
