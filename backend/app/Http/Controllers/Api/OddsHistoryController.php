<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OddsHistoryController extends Controller
{
    public function history(Request $request, $fixtureId)
    {
        $market = $request->query('market', '1X2');
        $since = $request->query('since', null);

        $q = DB::table('odds_history')
            ->where('fixture_id', $fixtureId)
            ->where('market', $market)
            ->orderBy('recorded_at', 'asc');

        if ($since) {
            $q->where('recorded_at', '>=', $since);
        }

        $rows = $q->get();
        return response()->json(['history' => $rows]);
    }
}
