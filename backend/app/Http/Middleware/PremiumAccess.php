<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PremiumAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        $tier = $user->subscription_tier ?? 'free';

        if ($tier !== 'premium' && $tier !== 'vip') {
            return response()->json([
                'success' => false,
                'message' => 'Premium subscription required for this feature',
                'upgrade_url' => '/pricing'
            ], 403);
        }

        return $next($request);
    }
}