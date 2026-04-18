<?php

namespace App\Console\Commands;

use App\Services\SubscriptionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckExpiredSubscriptions extends Command
{
    protected $signature = 'subscriptions:check-expired';
    protected $description = 'Check and deactivate expired subscriptions';

    public function __construct(
        private SubscriptionService $subscriptionService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Checking for expired subscriptions...');

        $count = $this->subscriptionService->checkAndUpdateExpiredSubscriptions();

        $this->info("Deactivated {$count} expired subscriptions.");

        Log::info("Scheduled task: Checked expired subscriptions", [
            'deactivated_count' => $count,
        ]);

        return Command::SUCCESS;
    }
}