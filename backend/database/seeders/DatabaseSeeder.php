<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Referral;
use App\Models\CommunityGroup;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CommunityGroupSeeder::class,
        ]);
    }
}

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin User',
                'email' => 'admin@fieldforecast.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'subscription_tier' => 'quarterly',
                'subscription_expires_at' => now()->addYear(),
                'subscription_started_at' => now(),
                'is_affiliate' => true,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'John Smith',
                'email' => 'john@example.com',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'subscription_tier' => 'monthly',
                'subscription_expires_at' => now()->addMonths(2),
                'subscription_started_at' => now()->subMonths(1),
                'is_affiliate' => true,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Sarah Johnson',
                'email' => 'sarah@example.com',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'subscription_tier' => 'weekly',
                'subscription_expires_at' => now()->addDays(3),
                'subscription_started_at' => now()->subDays(4),
                'is_affiliate' => false,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Mike Brown',
                'email' => 'mike@example.com',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'subscription_tier' => 'free',
                'is_affiliate' => false,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Emily Davis',
                'email' => 'emily@example.com',
                'password' => Hash::make('password123'),
                'role' => 'moderator',
                'subscription_tier' => 'quarterly',
                'subscription_expires_at' => now()->addMonths(4),
                'subscription_started_at' => now()->subMonths(2),
                'is_affiliate' => true,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Free User',
                'email' => 'free@example.com',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'subscription_tier' => 'free',
                'is_affiliate' => false,
                'email_verified_at' => now(),
            ],
        ];

        $createdUsers = [];
        
        foreach ($users as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );
            $createdUsers[$userData['email']] = $user;
        }

        $referral1 = Referral::create([
            'referrer_id' => $createdUsers['john@example.com']->id,
            'referred_user_id' => $createdUsers['sarah@example.com']->id,
            'status' => 'completed',
            'purchase_amount' => 14.00,
            'commission_amount' => 2.80,
            'converted_at' => now()->subDays(10),
        ]);

        $referral2 = Referral::create([
            'referrer_id' => $createdUsers['admin@fieldforecast.com']->id,
            'referred_user_id' => $createdUsers['mike@example.com']->id,
            'status' => 'pending',
        ]);

        $createdUsers['john@example.com']->update([
            'affiliate_earnings' => 2.80,
            'referrals_count' => 1,
        ]);

        $createdUsers['admin@fieldforecast.com']->update([
            'affiliate_earnings' => 0.00,
            'referrals_count' => 1,
        ]);

        echo "Created " . count($createdUsers) . " users\n";
    }
}

class CommunityGroupSeeder extends Seeder
{
    public function run(): void
    {
        $groups = [
            [
                'name' => 'General Chat',
                'slug' => 'general',
                'description' => 'Talk about anything sports related',
                'tier_required' => 'free',
                'icon' => 'message-circle',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Premier League',
                'slug' => 'premier-league',
                'description' => 'Discuss EPL matches and predictions',
                'tier_required' => 'weekly',
                'icon' => 'trophy',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Champions League',
                'slug' => 'champions-league',
                'description' => 'UEFA Champions League discussions',
                'tier_required' => 'weekly',
                'icon' => 'globe',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'VIP Lounge',
                'slug' => 'vip-lounge',
                'description' => 'Exclusive VIP members only',
                'tier_required' => 'quarterly',
                'icon' => 'star',
                'is_active' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($groups as $group) {
            CommunityGroup::firstOrCreate(
                ['slug' => $group['slug']],
                $group
            );
        }

        echo "Created " . count($groups) . " community groups\n";
    }
}