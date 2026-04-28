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
                // fetch odds for fixture
                $oddsRes = Http::withHeaders(['x-apisports-key' => $key])->get("{$base}/odds?fixture={$fixtureId}");
                if (!$oddsRes->ok()) continue;
                $odds = $oddsRes->json('response', []);

                foreach ($odds as $od) {
                    // store simple 1X2 market if present
                    foreach ($od['bookmakers'] as $bm) {
                        foreach ($bm['bets'] as $bet) {
                            if ($bet['id'] === 1) { // match winner
                                foreach ($bet['values'] as $val) {
                                    DB::table('odds_snapshots')->insertGetId([
                                        'fixture_id' => $fixtureId,
                                        'bookmaker_id' => $bookmaker->id,
                                        'market' => '1X2',
                                        'selection' => strtolower($val['value']),
                                        'odd' => $val['odd'],
                                        'raw' => json_encode($val),
                                        'received_at' => now(),
                                        'created_at' => now(),
                                        'updated_at' => now(),
                                    ]);
                                }
                            }
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('FetchOddsSnapshots error', ['err' => $e->getMessage()]);
            return 1;
        }

        $this->info('Done fetching odds snapshots.');
        return 0;
    }
}
