<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class ValueEngine
{
    /**
     * Compute EV for a given fixture market selection using model probabilities
     * @param int $fixtureId
     * @param string $market
     * @param string $selection
     * @param float $modelProb (optional) - if not provided, call local predictor via endpoint
     */
    public function computeEV($fixtureId, $market, $selection, $modelProb = null)
    {
        // fetch best odd for selection from aggregates cache or DB
        $agg = DB::table('odds_aggregates')->where('fixture_id', $fixtureId)->where('market', $market)->first();
        if (!$agg) return null;
        $bestOffer = json_decode($agg->best_offer, true);
        if (!isset($bestOffer[$selection])) return null;
        $odd = (float)$bestOffer[$selection];

        // get model prob if not provided
        if ($modelProb === null) {
            // call internal predictor service
            $pred = (new \App\Services\Prediction\RuleBasedPredictor())->predict(['fixture_id' => $fixtureId]);
            $modelProb = $pred[$selection] ?? ($pred['home'] ?? 0.33);
        }

        $implied = 1.0 / $odd;
        $sumImplied = array_sum(array_map(function($o){ return 1.0/$o; }, $bestOffer));
        $normalized = $implied / $sumImplied;

        $ev = ($modelProb * $odd) - 1.0;
        return ['odd' => $odd, 'model_prob' => $modelProb, 'implied' => $implied, 'normalized' => $normalized, 'ev' => $ev];
    }
}
