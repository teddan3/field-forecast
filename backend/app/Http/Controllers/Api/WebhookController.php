<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function __construct(
        private SubscriptionService $subscriptionService
    ) {}

    public function handleStripeWebhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        $sigHeader = $request->header('Stripe-Signature');

        if (!$this->verifyStripeSignature($payload, $sigHeader)) {
            Log::warning('Invalid Stripe signature');
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        try {
            $success = $this->subscriptionService->processWebhook($payload);

            if ($success) {
                return response()->json(['received' => true]);
            }

            return response()->json(['error' => 'Processing failed'], 500);
        } catch (\Exception $e) {
            Log::error('Webhook processing error: ' . $e->getMessage());
            return response()->json(['error' => 'Internal error'], 500);
        }
    }

    public function handlePaddleWebhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        
        Log::info('Paddle webhook received', $payload);

        return response()->json(['received' => true]);
    }

    protected function verifyStripeSignature($payload, ?string $sigHeader): bool
    {
        if (!$sigHeader) {
            return config('app.env') === 'local';
        }

        $webhookSecret = config('services.stripe.webhook_secret');
        
        if (!$webhookSecret) {
            return false;
        }

        $signature = explode(',', $sigHeader);
        
        foreach ($signature as $part) {
            $part = trim($part);
            if (str_starts_with($part, 't=')) {
                $timestamp = substr($part, 2);
                $expectedSignature = hash_hmac(
                    'sha256',
                    json_encode($payload) . '.' . $timestamp,
                    $webhookSecret
                );
                
                if (hash_equals($expectedSignature, $part)) {
                    return true;
                }
            }
        }

        return false;
    }
}