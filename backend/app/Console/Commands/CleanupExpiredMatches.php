<?php

namespace App\Console\Commands;

use App\Models\Match;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CleanupExpiredMatches extends Command
{
    protected $signature = 'matches:cleanup {--hours=48 : Hours after which matches are considered expired}';
    protected $description = 'Clean up expired and invalid matches';

    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        
        $this->info("Cleaning up matches older than {$hours} hours...");
        
        $cutoff = now()->subHours($hours);
        
        $expired = Match::where('match_date', '<', $cutoff)
            ->where('status', '!=', 'FT')
            ->where('is_live', false)
            ->get();
        
        $count = 0;
        
        foreach ($expired as $match) {
            $match->update([
                'is_valid' => false,
                'status' => 'CANCELLED',
                'status_long' => 'Expired - Auto Cleanup',
            ]);
            $count++;
        }
        
        $this->info("Marked {$count} matches as expired");
        
        Log::info("Expired matches cleanup completed", [
            'count' => $count,
            'cutoff' => $cutoff->toIso8601String(),
        ]);

        $this->cleanupDuplicateMatches();
        
        return Command::SUCCESS;
    }

    private function cleanupDuplicateMatches(): void
    {
        $this->info("Checking for duplicate matches...");
        
        $duplicates = Match::selectRaw('api_id, COUNT(*) as count')
            ->groupBy('api_id')
            ->having('count', '>', 1)
            ->get();
        
        $removed = 0;
        
        foreach ($duplicates as $dup) {
            $matches = Match::where('api_id', $dup->api_id)
                ->orderBy('match_date', 'desc')
                ->skip(1)
                ->get();
            
            foreach ($matches as $match) {
                $match->delete();
                $removed++;
            }
        }
        
        if ($removed > 0) {
            $this->info("Removed {$removed} duplicate matches");
        }
    }
}