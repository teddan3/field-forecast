<?php

namespace App\Jobs;

use App\Services\SportsApiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncLiveScoresJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private ?string $date = null
    ) {}

    public function handle(SportsApiService $sportsApi): void
    {
        $date = $this->date ?? now()->toDateString();
        
        Log::info("Syncing live scores for date: {$date}");
        
        try {
            $synced = $sportsApi->syncMatchesFromApi();
            Log::info("Synced {$synced} matches");
        } catch (\Exception $e) {
            Log::error("Failed to sync live scores: " . $e->getMessage());
        }
    }
}