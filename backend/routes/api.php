<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LiveScoreController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\HeadToHeadController;
use App\Http\Controllers\Api\OddsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\AffiliateController;
use App\Http\Controllers\Api\CommunityController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\WebhookController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Webhooks (no auth required)
Route::post('/webhooks/stripe', [WebhookController::class, 'handleStripeWebhook']);

// Free Access Routes
Route::get('/live-scores', [LiveScoreController::class, 'index']);
Route::get('/live-scores/live', [LiveScoreController::class, 'live']);
Route::get('/live-scores/{id}', [LiveScoreController::class, 'show']);

Route::get('/teams', [TeamController::class, 'index']);
Route::get('/teams/{id}', [TeamController::class, 'show']);
Route::get('/teams/{id}/form', [TeamController::class, 'recentForm']);

Route::get('/odds/{fixtureId}', [OddsController::class, 'show']);
Route::get('/odds/upcoming', [OddsController::class, 'upcoming']);
Route::post('/odds/validate', [OddsController::class, 'validateMatch']);

// Subscription Plans (public)
Route::get('/subscription/plans', [SubscriptionController::class, 'plans']);
Route::get('/matches/valid', [OddsController::class, 'upcoming']);

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/track-referral', [AuthController::class, 'trackReferral']);

    // Subscriptions
    Route::get('/subscription/current', [SubscriptionController::class, 'current']);
    Route::post('/subscription/check', [SubscriptionController::class, 'checkAccess']);
    Route::post('/subscription/create-checkout', [SubscriptionController::class, 'createCheckoutSession']);
    Route::post('/subscription/portal', [SubscriptionController::class, 'createPortalSession']);

    // Affiliate
    Route::get('/affiliate/dashboard', [AffiliateController::class, 'dashboard']);
    Route::get('/affiliate/referrals', [AffiliateController::class, 'referrals']);
    Route::post('/affiliate/become', [AffiliateController::class, 'becomeAffiliate']);
    Route::post('/affiliate/regenerate', [AffiliateController::class, 'regenerateCode']);

    // Community
    Route::get('/community/groups', [CommunityController::class, 'groups']);
    Route::get('/community/{slug}/messages', [CommunityController::class, 'messages']);
    Route::post('/community/{slug}/messages', [CommunityController::class, 'sendMessage']);
    Route::post('/community/messages/{id}/like', [CommunityController::class, 'likeMessage']);
    Route::delete('/community/messages/{id}', [CommunityController::class, 'deleteMessage']);
});

// Premium Routes (require subscription)
Route::middleware('auth:sanctum', 'feature:premium_leagues')->group(function () {
    Route::get('/h2h/{team1}/{team2}', [HeadToHeadController::class, 'show']);
});

// Admin Routes (require admin role)
Route::middleware('auth:sanctum', 'auth')->group(function () {
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::get('/admin/users/{id}', [AdminController::class, 'user']);
    Route::put('/admin/users/{id}', [AdminController::class, 'updateUser']);
    Route::get('/admin/subscriptions', [AdminController::class, 'subscriptions']);
    Route::get('/admin/referrals', [AdminController::class, 'referrals']);
    Route::get('/admin/community/groups', [AdminController::class, 'communityGroups']);
    Route::post('/admin/community/groups', [AdminController::class, 'createGroup']);
    Route::put('/admin/community/groups/{id}', [AdminController::class, 'updateGroup']);
    Route::delete('/admin/community/groups/{id}', [AdminController::class, 'deleteGroup']);
});

// Sync Routes (internal)
Route::post('/sync/teams', [TeamController::class, 'sync']);
Route::post('/sync/matches', [LiveScoreController::class, 'sync']);
Route::post('/sync/h2h/{team1}/{team2}', [HeadToHeadController::class, 'sync']);