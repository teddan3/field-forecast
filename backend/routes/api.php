<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LiveScoreController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\HeadToHeadController;
use App\Http\Controllers\Api\OddsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Live Scores - Free Access
Route::get('/live-scores', [LiveScoreController::class, 'index']);
Route::get('/live-scores/live', [LiveScoreController::class, 'live']);
Route::get('/live-scores/{id}', [LiveScoreController::class, 'show']);

// Teams - Free Access
Route::get('/teams', [TeamController::class, 'index']);
Route::get('/teams/{id}', [TeamController::class, 'show']);
Route::get('/teams/{id}/form', [TeamController::class, 'recentForm']);

// Head to Head - Premium
Route::get('/h2h/{team1}/{team2}', [HeadToHeadController::class, 'show']);

// Odds - Free Access
Route::get('/odds/{fixtureId}', [OddsController::class, 'show']);

// Sync (Internal)
Route::post('/sync/teams', [TeamController::class, 'sync']);
Route::post('/sync/matches', [LiveScoreController::class, 'sync']);
Route::post('/sync/h2h/{team1}/{team2}', [HeadToHeadController::class, 'sync']);