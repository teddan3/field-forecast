<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('subscription_tier', ['free', 'premium', 'vip'])->default('free')->after('email');
            $table->string('stripe_customer_id')->nullable()->after('subscription_tier');
            $table->string('stripe_subscription_id')->nullable()->after('stripe_customer_id');
            $table->timestamp('subscription_expires_at')->nullable()->after('stripe_subscription_id');
            $table->timestamp('subscription_started_at')->nullable()->after('subscription_expires_at');
            $table->boolean('auto_renew')->default(false)->after('subscription_started_at');
            $table->json('subscription_history')->nullable()->after('auto_renew');
            
            $table->index('subscription_tier');
            $table->index('subscription_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'subscription_tier',
                'stripe_customer_id',
                'stripe_subscription_id',
                'subscription_expires_at',
                'subscription_started_at',
                'auto_renew',
                'subscription_history',
            ]);
        });
    }
};