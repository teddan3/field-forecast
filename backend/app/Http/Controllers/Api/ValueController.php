<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\ValueEngine;

class ValueController extends Controller
{
    public function compute(Request $request)
    {
        $data = $request->validate([
            'fixture_id' => 'required|integer',
            'market' => 'required|string',
            'selection' => 'required|string',
        ]);

        $res = (new ValueEngine())->computeEV($data['fixture_id'], $data['market'], $data['selection']);
        if (!$res) return response()->json(['error' => 'data not available'], 404);
        return response()->json($res);
    }
}
