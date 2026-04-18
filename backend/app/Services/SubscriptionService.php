<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SubscriptionService
{
    private const PRICE_PREMIUM = 9.99;
    private const PRICE_VIP = 19.99;

    public function getSubscriptionPlans(): array
    {
        return [
            'free' => [
                'id' => 'free',
                'name' => 'Free',
                'price' => 0,
                'interval' => 'month',
                'features' => [
                    'Live scores',
                    'Free league matches',
                    'Basic predictions',
                ],
                'limits' => [
                    'matches_per_day' => 50,
                    'premium_leagues' => false,
                    'h2h_data' => false,
                    'advanced_stats' => false,
                ],
            ],
            'premium' => [
                'id' => 'premium',
                'name' => 'Premium',
                'price' => self::PRICE_PREMIUM,
                'interval' => 'month',
                'stripe_price_id' => config('services.stripe.premium_price_id'),
                'features' => [
                    'Everything in Free',
                    'All premium leagues',
                    'Champions League',
                    'Premier League',
                    'La Liga, Bundesliga, Serie A',
                    'Real-time odds comparison',
                    'H2H data',
                    'Advanced stats',
                    'No ads',
                    'Priority support',
                ],
                'limits' => [
                    'matches_per_day' => -1,
                    'premium_leagues' => true,
                    'h2h_data' => true,
                    'advanced_stats' => true,
                ],
            ],
            'vip' => [
                'id' => 'vip',
                'name' => 'VIP',
                'price' => self::PRICE_VIP,
                'interval' => 'month',
                'stripe_price_id' => config('services.stripe.vip_price_id'),
                'features' => [
                    'Everything in Premium',
                    'Exclusive VIP predictions',
                    'Early access to tips',
                    'VIP community access',
                    'Custom alerts',
                    'Birthday bonus',
                    'Dedicated support',
                ],
                'limits' => [
                    'matches_per_day' => -1,
                    'premium_leagues' => true,
                    'h2h_data' => true,
                    'advanced_stats' => true,
                    'early_access' => true,
                ],
            ],
        ];
    }

    public function canAccess(User $user, string $feature): bool
    {
        $tier = $user->subscription_tier ?? 'free';

        $limits = $this->getSubscriptionPlans()[$tier]['limits'] ?? [];
        
        return match ($feature) {
            'premium_leagues' => ($limits['premium_leagues'] ?? false) || $tier === 'free',
            'h2h_data' => ($limits['h2h_data'] ?? false) || $tier === 'free',
            'advanced_stats' => ($limits['advanced_stats'] ?? false),
            'early_access' => ($limits['early_access'] ?? false) || $tier !== 'free',
            default => true,
        };
    }

    public function getUserAccessLevel(User $user): string
    {
        $subscription = $user;
        
        if (!$subscription->subscription_tier) {
            return 'free';
        }

        if (!$this->isSubscriptionActive($subscription)) {
            return 'free';
        }

        return $subscription->subscription_tier;
    }

    public function isSubscriptionActive(User $user): bool
    {
        if (in_array($user->subscription_tier, ['premium', 'vip'])) {
            if (!$user->subscription_expires_at) {
                return true;
            }
            return $user->subscription_expires_at->isFuture();
        }
        return false;
    }

    public function hasAccess(User $user, string $requiredTier): bool
    {
        $currentTier = $this->getUserAccessLevel($user);
        
        $tierHierarchy = ['free' => 0, 'premium' => 1, 'vip' => 2];
        
        return ($tierHierarchy[$currentTier] ?? 0) >= ($tierHierarchy[$requiredTier] ?? 0);
    }

    public function processWebhook(array $payload): bool
    {
        $eventType = $payload['type'] ?? '';
        $data = $payload['data'] ?? [];
        
        return match ($eventType) {
            'customer.subscription.created' => $this->handleSubscriptionCreated($data),
            'customer.subscription.updated' => $this->handleSubscriptionUpdated($data),
            'customer.subscription.deleted' => $this->handleSubscriptionDeleted($data),
            'invoice.payment_succeeded' => $this->handlePaymentSucceeded($data),
            'invoice.payment_failed' => $this->handlePaymentFailed($data),
            default => true,
        };
    }

    protected function handleSubscriptionCreated(array $data): bool
    {
        $subscription = $data['object'] ?? [];
        
        return $this->updateUserSubscription(
            $subscription['customer'] ?? null,
            $subscription['items']['data'][0]['price']['id'] ?? null,
            $subscription['current_period_end'] ?? null,
            'active'
        );
    }

    protected function handleSubscriptionUpdated(array $data): bool
    {
        return $this->handleSubscriptionCreated($data);
    }

    protected function handleSubscriptionDeleted(array $data): bool
    {
        $subscription = $data['object'] ?? [];
        
        return $this->updateUserSubscription(
            $subscription['customer'] ?? null,
            null,
            null,
            'cancelled'
        );
    }

    protected function handlePaymentSucceeded(array $data): bool
    {
        $invoice = $data['object'] ?? [];
        $customerId = $invoice['customer'] ?? null;
        
        if (!$customerId) {
            return false;
        }

        $user = User::where('stripe_customer_id', $customerId)->first();
        
        if ($user) {
            $history = $user->subscription_history ?? [];
            $history[] = [
                'event' => 'payment_succeeded',
                'amount' => $invoice['amount_paid'],
                'timestamp' => now()->toIso8601String(),
            ];
            
            $user->update([
                'subscription_history' => $history,
                'subscription_expires_at' => now()->addMonth(),
            ]);
        }

        return true;
    }

    protected function handlePaymentFailed(array $data): bool
    {
        $invoice = $data['object'] ?? [];
        $customerId = $invoice['customer'] ?? null;
        
        Log::warning('Payment failed', ['customer' => $customerId, 'invoice' => $invoice['id'] ?? '']);
        
        return true;
    }

    protected function updateUserSubscription(?string $customerId, ?string $priceId, ?string $expiresAt, string $status): bool
    {
        if (!$customerId) {
            return false;
        }

        $tier = $this->getTierFromPriceId($priceId);
        
        $user = User::where('stripe_customer_id', $customerId)->first();
        
        if (!$user) {
            Log::warning("User not found for customer: {$customerId}");
            return false;
        }

        $update = [
            'subscription_tier' => $tier,
            'stripe_subscription_id' => $data['id'] ?? null,
        ];

        if ($expiresAt) {
            $update['subscription_expires_at'] = now()->setTimestamp($expiresAt);
        }

        if ($status === 'cancelled') {
            $update['subscription_tier'] = 'free';
        }

        $user->update($update);

        Log::info("User subscription updated: {$user->email}", [
            'tier' => $tier,
            'status' => $status,
        ]);

        return true;
    }

    protected function getTierFromPriceId(?string $priceId): string
    {
        if (!$priceId) {
            return 'free';
        }

        $premiumPriceId = config('services.stripe.premium_price_id');
        $vipPriceId = config('services.stripe.vip_price_id');

        if ($priceId === $vipPriceId) {
            return 'vip';
        }

        if ($priceId === $premiumPriceId) {
            return 'premium';
        }

        return 'free';
    }

    public function checkAndUpdateExpiredSubscriptions(): int
    {
        $expired = User::whereIn('subscription_tier', ['premium', 'vip'])
            ->where('subscription_expires_at', '<', now())
            ->where('auto_renew', false)
            ->get();

        foreach ($expired as $user) {
            Log::info("Subscription expired for user: {$user->email}");
            
            $user->update([
                'subscription_tier' => 'free',
            ]);
        }

        return $expired->count();
    }
}