<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Referral extends Model
{
    protected $fillable = [
        'referrer_id',
        'referred_user_id',
        'commission_amount',
        'status',
        'purchase_amount',
        'converted_at',
    ];

    protected $casts = [
        'commission_amount' => 'decimal:2',
        'purchase_amount' => 'decimal:2',
        'converted_at' => 'datetime',
    ];

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    public function referredUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }

    public function markAsConverted(float $purchaseAmount, float $commission)
    {
        $this->update([
            'status' => 'completed',
            'purchase_amount' => $purchaseAmount,
            'commission_amount' => $commission,
            'converted_at' => now(),
        ]);

        $this->referrer->increment('affiliate_earnings', $commission);
        $this->referrer->increment('referrals_count');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}