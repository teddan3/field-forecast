<?php

namespace App\Http\Middleware;

use App\Services\SubscriptionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscriptionTier
{
    public function __construct(
        private SubscriptionService $subscriptionService
    ) {}

    public function handle(Request $request, Closure $next, string $requiredTier): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
            ], 401);
        }

        if ($this->subscriptionService->hasAccess($user, $requiredTier)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Upgrade your subscription to access this content',
            'required_tier' => $requiredTier,
            'current_tier' => $user->subscription_tier ?? 'free',
        ], 403);
    }
}