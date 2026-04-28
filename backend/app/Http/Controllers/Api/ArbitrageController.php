<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ArbitrageController extends Controller
{
    public function scan(Request $request)
    {
        $fixtureId = $request->input('fixture_id');
        if (!$fixtureId) return response()->json(['error' => 'fixture_id required'], 422);

        $best = DB::table('odds_snapshots')
            ->where('fixture_id', $fixtureId)
            ->select('market','selection','bookmaker_id', DB::raw('MAX(odd) as best_odd'))
            ->groupBy('market','selection','bookmaker_id')
            ->get();

        $grouped = [];
        foreach ($best as $b) {
            $grouped[$b->market][$b->selection][] = ['bookmaker' => $b->bookmaker_id, 'odd' => (float)$b->best_odd];
        }

        $alerts = [];
        foreach ($grouped as $market => $sels) {
            $bestPerSel = [];
            foreach ($sels as $sel => $list) {
                usort($list, function($a,$b){ return $b['odd'] <=> $a['odd']; });
                $bestPerSel[$sel] = $list[0];
            }

            $sumInv = 0;
            foreach ($bestPerSel as $sel => $b) $sumInv += 1.0 / $b['odd'];
            if ($sumInv < 1.0) {
                $profit = (1 - $sumInv) * 100;
                // compute stake distribution for a sample total stake
                $S = 100; // sample
                $stakes = [];
                foreach ($bestPerSel as $sel => $b) {
                    $stakes[$sel] = ($S * (1 / $b['odd'])) / $sumInv;
                }
                $alerts[] = ['market' => $market, 'profit_pct' => $profit, 'legs' => $bestPerSel, 'stakes' => $stakes];

                DB::table('arbitrage_alerts')->insertGetId([
                    'fixture_id' => $fixtureId,
                    'market' => $market,
                    'legs' => json_encode($bestPerSel),
                    'profit_pct' => $profit,
                    'detected_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return response()->json(['alerts' => $alerts]);
    }
}
