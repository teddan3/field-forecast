<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\SubscriptionController;

/*
|--------------------------------------------------------------------------
| Subscription & Webhook Routes
|--------------------------------------------------------------------------
*/

// Stripe Webhooks (no auth required)
Route::post('/webhooks/stripe', [WebhookController::class, 'handleStripeWebhook']);
Route::post('/webhooks/paddle', [WebhookController::class, 'handlePaddleWebhook']);

// Subscription (requires auth)
Route::get('/subscription/plans', [SubscriptionController::class, 'plans']);
Route::get('/subscription/current', [SubscriptionController::class, 'current']);
Route::post('/subscription/check', [SubscriptionController::class, 'checkAccess']);
Route::post('/subscription/create-checkout', [SubscriptionController::class, 'createCheckoutSession']);
Route::post('/subscription/portal', [SubscriptionController::class, 'createPortalSession']);