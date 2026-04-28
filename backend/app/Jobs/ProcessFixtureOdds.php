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

        // compute aggregates for available markets
        $markets = DB::table('odds_snapshots')
            ->where('fixture_id', $this->fixtureId)
            ->select('market')
            ->groupBy('market')
            ->pluck('market');

        foreach ($markets as $market) {
            $rows = DB::table('odds_snapshots')
                ->where('fixture_id', $this->fixtureId)
                ->where('market', $market)
                ->select('selection', DB::raw('MAX(odd) as best_odd'))
                ->groupBy('selection')
                ->get();

            $best = [];
            $sumInv = 0;
            foreach ($rows as $r) {
                $best[$r->selection] = (float)$r->best_odd;
                $sumInv += 1.0 / (float)$r->best_odd;

                // write to odds_history
                DB::table('odds_history')->insertGetId([
                    'fixture_id' => $this->fixtureId,
                    'market' => $market,
                    'selection' => $r->selection,
                    'odd' => (float)$r->best_odd,
                    'recorded_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $vig = max(0, $sumInv - 1.0);
            $aggId = DB::table('odds_aggregates')->insertGetId([
                'fixture_id' => $this->fixtureId,
                'market' => $market,
                'best_offer' => json_encode($best),
                'implied_probs' => json_encode(array_map(function($o){ return 1/$o; }, $best)),
                'vig' => $vig,
                'computed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // cache aggregate
            Cache::put("odds:aggregate:fixture:{$this->fixtureId}:{$market}", $best, 60);

            // broadcast update event
            try {
                event(new \App\Events\OddsAggregateUpdated($this->fixtureId, $market, $best));
            } catch (\Exception $e) {
                Log::warning('broadcast odds aggregate failed', ['err' => $e->getMessage()]);
            }
        }
    }
}
