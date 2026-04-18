<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AffiliateController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        $stats = [
            'total_referrals' => $user->referralRecords()->count(),
            'completed_referrals' => $user->referralRecords()->completed()->count(),
            'pending_referrals' => $user->referralRecords()->pending()->count(),
            'total_earnings' => $user->affiliate_earnings,
            'referral_code' => $user->referral_code,
            'referral_link' => $user->referral_link,
            'is_affiliate' => $user->is_affiliate,
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats,
        ]);
    }

    public function referrals(Request $request): JsonResponse
    {
        $user = $request->user();

        $referrals = $user->referralRecords()
            ->with('referredUser')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'referrals' => $referrals,
        ]);
    }

    public function becomeAffiliate(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->is_affiliate) {
            return response()->json([
                'success' => false,
                'message' => 'Already an affiliate',
            ], 400);
        }

        $user->update(['is_affiliate' => true]);

        Log::info("User became affiliate", ['user_id' => $user->id]);

        return response()->json([
            'success' => true,
            'message' => 'You are now an affiliate',
            'referral_code' => $user->referral_code,
            'referral_link' => $user->referral_link,
        ]);
    }

    public function regenerateCode(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->is_affiliate) {
            return response()->json([
                'success' => false,
                'message' => 'Become an affiliate first',
            ], 400);
        }

        $newCode = $user->generateNewReferralCode();

        return response()->json([
            'success' => true,
            'referral_code' => $newCode,
            'referral_link' => $user->referral_link,
        ]);
    }

    public function track(Request $request): JsonResponse
    {
        $request->validate([
            'referral_code' => 'required|string',
        ]);

        $referralCode = $request->get('referral_code');

        $referrer = \App\Models\User::where('referral_code', $referralCode)
            ->where('is_affiliate', true)
            ->first();

        if (!$referrer) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid referral code',
            ], 404);
        }

        $request->session()->put('referred_by', $referrer->id);

        return response()->json([
            'success' => true,
            'message' => 'Referral tracked',
            'referrer' => $referrer->name,
        ]);
    }
}