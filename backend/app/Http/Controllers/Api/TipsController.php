<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class TipsController extends Controller
{
    public function create(Request $request)
    {
        $user = Auth::user();
        $data = $request->validate([
            'fixture_id' => 'required|integer',
            'market' => 'required|string',
            'selection' => 'required|string',
            'odd_posted' => 'required|numeric',
            'stake' => 'nullable|numeric',
            'note' => 'nullable|string',
            'visibility' => 'nullable|in:public,paid,followers',
        ]);

        $id = DB::table('tips')->insertGetId([
            'user_id' => $user->id,
            'fixture_id' => $data['fixture_id'],
            'market' => $data['market'],
            'selection' => $data['selection'],
            'odd_posted' => $data['odd_posted'],
            'stake' => $data['stake'] ?? 0,
            'note' => $data['note'] ?? null,
            'status' => 'open',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id], 201);
    }

    public function listForUser($userId)
    {
        $rows = DB::table('tips')->where('user_id', $userId)->orderBy('created_at', 'desc')->get();
        return response()->json(['tips' => $rows]);
    }
}
