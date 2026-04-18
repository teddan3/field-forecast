<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSubscription extends Model
{
    protected $table = 'users';

    protected $fillable = [
        'subscription_tier',
        'stripe_subscription_id',
        'subscription_expires_at',
    ];

    protected $casts = [
        'subscription_expires_at' => 'datetime',
        'subscription_started_at' => 'datetime',
        'subscription_history' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        if (in_array($this->subscription_tier, ['premium', 'vip'])) {
            if ($this->subscription_expires_at === null) {
                return true;
            }
            return $this->subscription_expires_at->isFuture();
        }
        return false;
    }

    public function isPremium(): bool
    {
        return $this->subscription_tier === 'premium' && $this->isActive();
    }

    public function isVip(): bool
    {
        return $this->subscription_tier === 'vip' && $this->isActive();
    }

    public function getDaysRemainingAttribute(): int
    {
        if (!$this->subscription_expires_at) {
            return -1;
        }
        return now()->diffInDays($this->subscription_expires_at, false);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('subscription_tier', ['premium', 'vip'])
            ->where(function ($q) {
                $q->whereNull('subscription_expires_at')
                  ->orWhere('subscription_expires_at', '>', now());
            });
    }

    public function scopeExpiringSoon($query, int $days = 7)
    {
        return $query->whereIn('subscription_tier', ['premium', 'vip'])
            ->where('subscription_expires_at', '<=', now()->addDays($days))
            ->where('subscription_expires_at', '>', now());
    }

    public function scopeTier($query, string $tier)
    {
        return $query->where('subscription_tier', $tier);
    }

    public static function getActiveCount(): int
    {
        return static::active()->count();
    }

    public static function getPremiumCount(): int
    {
        return static::tier('premium')->active()->count();
    }

    public static function getVipCount(): int
    {
        return static::tier('vip')->active()->count();
    }

    public static function getMrr(): float
    {
        $premiumPrice = 9.99;
        $vipPrice = 19.99;

        $premium = static::tier('premium')->active()->count() * $premiumPrice;
        $vip = static::tier('vip')->active()->count() * $vipPrice;

        return $premium + $vip;
    }

    public function cancelAutoRenew(): void
    {
        $this->update(['auto_renew' => false]);
    }

    public function enableAutoRenew(): void
    {
        $this->update(['auto_renew' => true]);
    }
}