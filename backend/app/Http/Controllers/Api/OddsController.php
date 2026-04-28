<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OddsController extends Controller
{
    public function showFixtureOdds($fixtureId)
    {
        // latest per bookmaker per selection
        $rows = DB::table('odds_snapshots')
            ->select('bookmaker_id','market','selection','odd', DB::raw('MAX(received_at) as last'))
            ->where('fixture_id', $fixtureId)
            ->groupBy('bookmaker_id','market','selection','odd')
            ->get();

        $agg = DB::table('odds_aggregates')->where('fixture_id', $fixtureId)->get();

        return response()->json(['snapshots' => $rows, 'aggregates' => $agg]);
    }

    public function scanArbitrage(Request $request)
    {
        $fixtureId = $request->input('fixture_id');
        if (!$fixtureId) return response()->json(['error' => 'fixture_id required'], 422);

        // load best odds per selection
        $best = DB::table('odds_snapshots')
            ->where('fixture_id', $fixtureId)
            ->select('market','selection', DB::raw('MAX(odd) as best_odd'))
            ->groupBy('market','selection')
            ->get();

        $grouped = [];
        foreach ($best as $b) {
            $grouped[$b->market][$b->selection] = (float) $b->best_odd;
        }

        $alerts = [];
        foreach ($grouped as $market => $sels) {
            $sumInv = 0;
            foreach ($sels as $sel => $odd) $sumInv += 1.0 / $odd;
            if ($sumInv < 1.0) {
                $profit = (1 - $sumInv) * 100;
                $alerts[] = ['market' => $market, 'profit_pct' => $profit, 'selections' => $sels];
                DB::table('arbitrage_alerts')->insertGetId([
                    'fixture_id' => $fixtureId,
                    'market' => $market,
                    'legs' => json_encode($sels),
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
