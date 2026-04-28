<?php

namespace App\Services\OddsAdapters;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ApiFootballAdapter implements AdapterInterface
{
    protected $key;
    protected $base;

    public function __construct($meta = [])
    {
        $this->key = $meta['api_key'] ?? env('API_FOOTBALL_KEY');
        $this->base = $meta['base_url'] ?? 'https://v3.football.api-sports.io';
    }

    public function fetchOddsForFixture($fixtureId): array
    {
        try {
            $res = Http::withHeaders(['x-apisports-key' => $this->key])->get("{$this->base}/odds?fixture={$fixtureId}");
            if (!$res->ok()) {
                Log::warning('ApiFootballAdapter fetch failed', ['fixture' => $fixtureId, 'status' => $res->status()]);
                return [];
            }
            $data = $res->json('response', []);

            $normalized = [];
            foreach ($data as $entry) {
                foreach ($entry['bookmakers'] as $bm) {
                    $bookmakerName = $bm['name'];
                    foreach ($bm['bets'] as $bet) {
                        $marketKey = $this->mapMarket($bet['id'], $bet['name']);
                        $values = $bet['values'];
                        $selections = [];
                        foreach ($values as $v) {
                            $selections[] = ['selection' => strtolower($v['value']), 'odd' => (float)$v['odd']];
                        }

                        $normalized[] = [
                            'bookmaker' => $bookmakerName,
                            'market' => $marketKey,
                            'selections' => $selections,
                        ];
                    }
                }
            }

            return $normalized;
        } catch (\Exception $e) {
            Log::error('ApiFootballAdapter error', ['err' => $e->getMessage()]);
            return [];
        }
    }

    protected function mapMarket($id, $name)
    {
        // basic mapping for match winner
        if ($id === 1 || stripos($name, 'match winner') !== false) return '1X2';
        // fallback to normalized name
        return strtoupper(str_replace(' ', '_', $name));
    }
}
