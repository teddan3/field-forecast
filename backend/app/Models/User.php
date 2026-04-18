<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'referral_code',
        'referred_by',
        'is_affiliate',
        'affiliate_earnings',
        'referrals_count',
        'email_verified_at',
        'subscription_tier',
        'subscription_expires_at',
        'subscription_started_at',
        'auto_renew',
        'stripe_customer_id',
        'stripe_subscription_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_affiliate' => 'boolean',
        'affiliate_earnings' => 'decimal:2',
        'referrals_count' => 'integer',
        'subscription_expires_at' => 'datetime',
        'subscription_started_at' => 'datetime',
        'auto_renew' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (empty($user->referral_code)) {
                $user->referral_code = strtoupper(Str::random(8));
            }
        });
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription(): HasMany
    {
        return $this->hasMany(Subscription::class)->where('status', 'active');
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(User::class, 'referred_by');
    }

    public function referralRecords(): HasMany
    {
        return $this->hasMany(Referral::class, 'referrer_id');
    }

    public function communityMessages(): HasMany
    {
        return $this->hasMany(CommunityMessage::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isModerator(): bool
    {
        return in_array($this->role, ['admin', 'moderator']);
    }

    public function getSubscriptionTierAttribute(): string
    {
        return $this->subscription_tier ?? 'free';
    }

    public function canAccessPremium(): bool
    {
        return in_array($this->subscription_tier, ['weekly', 'monthly', 'quarterly']);
    }

    public function canAccessVip(): bool
    {
        return in_array($this->subscription_tier, ['monthly', 'quarterly']);
    }

    public function getReferralLinkAttribute(): string
    {
        return url('/register?ref=' . $this->referral_code);
    }

    public function generateNewReferralCode(): string
    {
        $this->referral_code = strtoupper(Str::random(8));
        $this->save();
        return $this->referral_code;
    }
}