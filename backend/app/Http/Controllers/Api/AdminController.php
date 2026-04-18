<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Referral;
use App\Models\CommunityGroup;
use App\Models\CommunityMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $stats = [
            'total_users' => User::count(),
            'active_subscriptions' => User::whereIn('subscription_tier', ['weekly', 'monthly', 'quarterly'])->count(),
            'total_earnings' => User::sum('affiliate_earnings'),
            'total_referrals' => Referral::count(),
            'completed_referrals' => Referral::completed()->count(),
        ];

        $recentUsers = User::latest()->limit(10)->get(['id', 'name', 'email', 'subscription_tier', 'created_at']);
        $recentReferrals = Referral::with('referrer', 'referredUser')
            ->latest()
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'recent_users' => $recentUsers,
            'recent_referrals' => $recentReferrals,
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $query = User::query();

        if ($request->has('tier')) {
            $query->where('subscription_tier', $request->get('tier'));
        }

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'users' => $users,
        ]);
    }

    public function user(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $targetUser = User::findOrFail($id);

        return response()->json([
            'success' => true,
            'user' => $targetUser,
        ]);
    }

    public function updateUser(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $targetUser = User::findOrFail($id);

        $request->validate([
            'subscription_tier' => 'sometimes|in:free,weekly,monthly,quarterly',
            'subscription_expires_at' => 'sometimes|date',
            'role' => 'sometimes|in:user,moderator,admin',
            'is_affiliate' => 'sometimes|boolean',
        ]);

        $data = $request->only([
            'subscription_tier',
            'subscription_expires_at',
            'role',
            'is_affiliate',
        ]);

        $targetUser->update(array_filter($data));

        Log::info("Admin updated user", [
            'admin_id' => $user->id,
            'target_id' => $targetUser->id,
            'changes' => $data,
        ]);

        return response()->json([
            'success' => true,
            'user' => $targetUser->fresh(),
        ]);
    }

    public function subscriptions(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $tier = $request->get('tier');

        $query = User::whereIn('subscription_tier', ['weekly', 'monthly', 'quarterly']);

        if ($tier) {
            $query->where('subscription_tier', $tier);
        }

        $subscriptions = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'subscriptions' => $subscriptions,
        ]);
    }

    public function referrals(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $status = $request->get('status');

        $query = Referral::with('referrer', 'referredUser');

        if ($status) {
            $query->where('status', $status);
        }

        $referrals = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'referrals' => $referrals,
        ]);
    }

    public function communityGroups(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $groups = CommunityGroup::orderBy('sort_order')->get();

        return response()->json([
            'success' => true,
            'groups' => $groups,
        ]);
    }

    public function createGroup(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:community_groups',
            'description' => 'nullable|string|max:500',
            'tier_required' => 'required|in:free,weekly,monthly,quarterly',
            'icon' => 'nullable|string|max:50',
        ]);

        $group = CommunityGroup::create($request->all());

        return response()->json([
            'success' => true,
            'group' => $group,
        ]);
    }

    public function updateGroup(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $group = CommunityGroup::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:100',
            'slug' => 'sometimes|string|max:100|unique:community_groups',
            'description' => 'nullable|string|max:500',
            'tier_required' => 'sometimes|in:free,weekly,monthly,quarterly',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
        ]);

        $group->update($request->all());

        return response()->json([
            'success' => true,
            'group' => $group->fresh(),
        ]);
    }

    public function deleteGroup(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $group = CommunityGroup::findOrFail($id);
        $group->delete();

        return response()->json([
            'success' => true,
            'message' => 'Group deleted',
        ]);
    }
}