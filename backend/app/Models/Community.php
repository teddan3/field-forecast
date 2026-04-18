<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityGroup extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'tier_required',
        'icon',
        'is_active',
        'sort_order',
    ];

    public function messages(): HasMany
    {
        return $this->hasMany(CommunityMessage::class)->latest();
    }

    public function latestMessages(): HasMany
    {
        return $this->hasMany(CommunityMessage::class)->latest()->limit(100);
    }

    public function messagesCount(): int
    {
        return $this->messages()->count();
    }

    public function usersCount(): int
    {
        return $this->messages()->distinct('user_id')->count('user_id');
    }

    public static function getGroupsForTier(string $tier): array
    {
        $tierHierarchy = ['free' => 0, 'premium' => 1, 'vip' => 2];
        $userLevel = $tierHierarchy[$tier] ?? 0;

        return static::where('is_active', true)
            ->get()
            ->filter(function ($group) use ($userLevel) {
                $requiredLevel = $tierHierarchy[$group->tier_required] ?? 0;
                return $userLevel >= $requiredLevel;
            })
            ->values()
            ->toArray();
    }
}

class CommunityMessage extends Model
{
    protected $fillable = [
        'user_id',
        'group_id',
        'reply_to',
        'message',
        'is_pinned',
        'is_edited',
        'likes_count',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'is_edited' => 'boolean',
        'likes_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(CommunityGroup::class);
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(CommunityMessage::class, 'reply_to');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(CommunityMessage::class, 'reply_to');
    }

    public function likes(): HasMany
    {
        return $this->hasMany(CommunityLike::class, 'message_id');
    }

    public function isLikedBy(User $user): bool
    {
        return $this->likes()->where('user_id', $user->id)->exists();
    }

    public function toggleLike(User $user): bool
    {
        $existing = $this->likes()->where('user_id', $user->id)->first();
        
        if ($existing) {
            $existing->delete();
            $this->decrement('likes_count');
            return false;
        }
        
        $this->likes()->create(['user_id' => $user->id]);
        $this->increment('likes_count');
        return true;
    }
}

class CommunityLike extends Model
{
    protected $fillable = [
        'user_id',
        'message_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(CommunityMessage::class);
    }
}