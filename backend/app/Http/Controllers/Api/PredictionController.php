<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Prediction\RuleBasedPredictor;
use Illuminate\Support\Facades\DB;

class PredictionController extends Controller
{
    public function predict($fixtureId)
    {
        $fixture = DB::table('matches')->where('id', $fixtureId)->first();
        if (!$fixture) return response()->json(['error' => 'fixture not found'], 404);

        $pred = (new RuleBasedPredictor())->predict((array)$fixture);
        return response()->json(['probabilities' => $pred]);
    }
}
