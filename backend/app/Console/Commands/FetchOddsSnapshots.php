<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Bookmaker;

class FetchOddsSnapshots extends Command
{
    protected $signature = 'odds:fetch {bookmaker_slug?}';
    protected $description = 'Fetch odds snapshots from configured bookmakers (simple adapter for API-Football)';

    public function handle()
    {
        $slug = $this->argument('bookmaker_slug') ?? 'api_football';
        $bookmaker = Bookmaker::where('slug', $slug)->first();
        if (!$bookmaker) {
            $this->error("Bookmaker not found: {$slug}");
            return 1;
        }

        $meta = $bookmaker->api_meta ?? [];
        $key = $meta['api_key'] ?? env('API_FOOTBALL_KEY');
        $base = $meta['base_url'] ?? 'https://v3.football.api-sports.io';

        // Simple: fetch today's fixtures and then fetch odds per fixture (limited)
        try {
            $date = now()->toDateString();
            $fixturesRes = Http::withHeaders(['x-apisports-key' => $key])->get("{$base}/fixtures?date={$date}&timezone=UTC");
            if (!$fixturesRes->ok()) {
                Log::error('Fixtures fetch failed', ['resp' => $fixturesRes->body()]);
                return 1;
            }

            $fixtures = $fixturesRes->json('response', []);
            foreach (array_slice($fixtures, 0, 25) as $f) {
                $fixtureId = $f['fixture']['id'];
                // dispatch job to process fixture odds
                \App\Jobs\ProcessFixtureOdds::dispatch($fixtureId);
            }
        } catch (\Exception $e) {
            Log::error('FetchOddsSnapshots error', ['err' => $e->getMessage()]);
            return 1;
        }

        $this->info('Done fetching odds snapshots.');
        return 0;
    }
}
