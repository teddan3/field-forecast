<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunityGroup;
use App\Models\CommunityMessage;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CommunityController extends Controller
{
    public function __construct(
        private SubscriptionService $subscriptionService
    ) {}

    public function groups(Request $request): JsonResponse
    {
        $user = $request->user();
        $tier = $user->subscription_tier ?? 'free';

        $groups = CommunityGroup::getGroupsForTier($tier);

        return response()->json([
            'success' => true,
            'groups' => $groups,
        ]);
    }

    public function messages(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'page' => 'integer|min:1',
            'limit' => 'integer|min:1|max:100',
        ]);

        $group = CommunityGroup::where('slug', $slug)->first();

        if (!$group) {
            return response()->json([
                'success' => false,
                'message' => 'Group not found',
            ], 404);
        }

        $user = $request->user();
        $tier = $user->subscription_tier ?? 'free';

        $tierHierarchy = ['free' => 0, 'weekly' => 1, 'monthly' => 2, 'quarterly' => 3];
        $userLevel = $tierHierarchy[$tier] ?? 0;
        $requiredLevel = $tierHierarchy[$group->tier_required] ?? 0;

        if ($userLevel < $requiredLevel) {
            return response()->json([
                'success' => false,
                'message' => 'Upgrade your subscription to access this group',
            ], 403);
        }

        $limit = $request->get('limit', 50);

        $messages = CommunityMessage::with('user')
            ->where('group_id', $group->id)
            ->whereNull('reply_to')
            ->orderBy('created_at', 'desc')
            ->paginate($limit);

        return response()->json([
            'success' => true,
            'messages' => $messages,
            'group' => $group,
        ]);
    }

    public function sendMessage(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'reply_to' => 'nullable|integer',
        ]);

        $group = CommunityGroup::where('slug', $slug)->first();

        if (!$group) {
            return response()->json([
                'success' => false,
                'message' => 'Group not found',
            ], 404);
        }

        $user = $request->user();
        $tier = $user->subscription_tier ?? 'free';

        $tierHierarchy = ['free' => 0, 'weekly' => 1, 'monthly' => 2, 'quarterly' => 3];
        $userLevel = $tierHierarchy[$tier] ?? 0;
        $requiredLevel = $tierHierarchy[$group->tier_required] ?? 0;

        if ($userLevel < $requiredLevel) {
            return response()->json([
                'success' => false,
                'message' => 'Upgrade your subscription to post in this group',
            ], 403);
        }

        $message = CommunityMessage::create([
            'user_id' => $user->id,
            'group_id' => $group->id,
            'reply_to' => $request->get('reply_to'),
            'message' => $request->get('message'),
        ]);

        Log::info("New community message", [
            'user_id' => $user->id,
            'group_id' => $group->id,
            'message_id' => $message->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => $message->load('user'),
        ]);
    }

    public function likeMessage(Request $request, int $messageId): JsonResponse
    {
        $user = $request->user();

        $message = CommunityMessage::findOrFail($messageId);
        $liked = $message->toggleLike($user);

        return response()->json([
            'success' => true,
            'liked' => $liked,
            'likes_count' => $message->fresh()->likes_count,
        ]);
    }

    public function deleteMessage(Request $request, int $messageId): JsonResponse
    {
        $user = $request->user();

        $message = CommunityMessage::findOrFail($messageId);

        if ($message->user_id !== $user->id && !$user->isModerator()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $message->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message deleted',
        ]);
    }

    public function createGroup(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:community_groups',
            'description' => 'nullable|string|max:500',
            'tier_required' => 'required|in:free,weekly,monthly,quarterly',
            'icon' => 'nullable|string|max:50',
        ]);

        $group = CommunityGroup::create([
            'name' => $request->get('name'),
            'slug' => $request->get('slug'),
            'description' => $request->get('description'),
            'tier_required' => $request->get('tier_required'),
            'icon' => $request->get('icon'),
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'group' => $group,
        ]);
    }

    public function pinMessage(Request $request, int $messageId): JsonResponse
    {
        $user = $request->user();

        if (!$user->isModerator()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $message = CommunityMessage::findOrFail($messageId);
        $message->update(['is_pinned' => !$message->is_pinned]);

        return response()->json([
            'success' => true,
            'is_pinned' => $message->is_pinned,
        ]);
    }
}