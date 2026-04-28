<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Models\Bookmaker;
use App\Services\OddsAdapters\ApiFootballAdapter;
use Illuminate\Support\Facades\Log;

class ProcessFixtureOdds implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public $fixtureId;

    public function __construct($fixtureId)
    {
        $this->fixtureId = $fixtureId;
    }

    public function handle()
    {
        // iterate bookmakers and fetch
        $bookmakers = Bookmaker::all();
        foreach ($bookmakers as $bm) {
            $meta = $bm->api_meta ?? [];
            // for now only support api_football slug
            if ($bm->slug === 'api_football' || isset($meta['api_key'])) {
                $adapter = new ApiFootballAdapter($meta);
                $data = $adapter->fetchOddsForFixture($this->fixtureId);
                foreach ($data as $entry) {
                    foreach ($entry['selections'] as $sel) {
                        try {
                            DB::table('odds_snapshots')->insertGetId([
                                'fixture_id' => $this->fixtureId,
                                'bookmaker_id' => $bm->id,
                                'market' => $entry['market'],
                                'selection' => $sel['selection'],
                                'odd' => $sel['odd'],
                                'raw' => json_encode($entry),
                                'received_at' => now(),
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        } catch (\Exception $e) {
                            Log::warning('insert odds snapshot failed', ['err' => $e->getMessage()]);
                        }
                    }
                }
            }
        }

        // compute aggregates for 1X2 market as a simple example
        $rows = DB::table('odds_snapshots')
            ->where('fixture_id', $this->fixtureId)
            ->where('market', '1X2')
            ->select('selection', DB::raw('MAX(odd) as best_odd'))
            ->groupBy('selection')
            ->get();

        $best = [];
        $sumInv = 0;
        foreach ($rows as $r) {
            $best[$r->selection] = (float)$r->best_odd;
            $sumInv += 1.0 / (float)$r->best_odd;
        }

        $vig = max(0, $sumInv - 1.0);
        DB::table('odds_aggregates')->insertGetId([
            'fixture_id' => $this->fixtureId,
            'market' => '1X2',
            'best_offer' => json_encode($best),
            'implied_probs' => json_encode(array_map(function($o) use ($best){ return 1/$o; }, $best)),
            'vig' => $vig,
            'computed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // cache aggregate
        Cache::put("odds:aggregate:fixture:{$this->fixtureId}:1X2", $best, 60);

        // TODO: broadcast event via laravel events / websockets
    }
}
