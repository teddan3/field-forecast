<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SubscriptionController extends Controller
{
    public function __construct(
        private SubscriptionService $subscriptionService
    ) {}

    public function plans(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'plans' => $this->subscriptionService->getSubscriptionPlans(),
        ]);
    }

    public function current(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'subscription' => [
                'tier' => $user->subscription_tier ?? 'free',
                'is_active' => $this->subscriptionService->isSubscriptionActive($user),
                'expires_at' => $user->subscription_expires_at?->toIso8601String(),
                'started_at' => $user->subscription_started_at?->toIso8601String(),
                'auto_renew' => $user->auto_renew,
                'days_remaining' => $user->days_remaining ?? -1,
            ],
            'features' => $this->subscriptionService->getSubscriptionPlans()[$user->subscription_tier ?? 'free'] ?? [],
        ]);
    }

    public function checkAccess(Request $request): JsonResponse
    {
        $request->validate([
            'feature' => 'required|string',
        ]);

        $feature = $request->get('feature');
        $user = $request->user();

        $canAccess = $this->subscriptionService->canAccess($user, $feature);

        return response()->json([
            'success' => true,
            'feature' => $feature,
            'can_access' => $canAccess,
            'current_tier' => $user->subscription_tier ?? 'free',
        ]);
    }

    public function createCheckoutSession(Request $request): JsonResponse
    {
        $request->validate([
            'price_id' => 'required|string',
            'success_url' => 'required|url',
            'cancel_url' => 'required|url',
        ]);

        $priceId = $request->get('price_id');
        $user = $request->user();

        // In production, this would create a Stripe Checkout session
        // For now, return a mock response
        
        $checkoutSession = [
            'id' => 'cs_' . uniqid(),
            'url' => $request->get('success_url') . '?session_id=cs_' . uniqid(),
        ];

        Log::info('Checkout session created', [
            'user' => $user->id,
            'price_id' => $priceId,
        ]);

        return response()->json([
            'success' => true,
            'checkout_session' => $checkoutSession,
        ]);
    }

    public function createPortalSession(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$this->subscriptionService->isSubscriptionActive($user)) {
            return response()->json([
                'success' => false,
                'message' => 'No active subscription',
            ], 400);
        }

        // In production, this would create a Stripe Portal session
        $portalSession = [
            'id' => 'bps_' . uniqid(),
            'url' => config('app.url') . '/settings?portal=true',
        ];

        return response()->json([
            'success' => true,
            'portal_session' => $portalSession,
        ]);
    }
}