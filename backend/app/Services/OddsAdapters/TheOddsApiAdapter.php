<?php

namespace App\Services\OddsAdapters;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TheOddsApiAdapter implements AdapterInterface
{
    protected $key;
    protected $base;

    public function __construct($meta = [])
    {
        $this->key = $meta['api_key'] ?? env('THEODDSAPI_KEY');
        $this->base = $meta['base_url'] ?? 'https://api.the-odds-api.com/v4';
    }

    public function fetchOddsForFixture($fixtureId): array
    {
        // This adapter is a scaffold — many providers require mapping of fixture ids
        try {
            // TheOddsAPI typically identifies events differently; this is a placeholder
            $res = Http::withHeaders(['x-api-key' => $this->key])->get("{$this->base}/sports/soccer/events/{$fixtureId}/odds");
            if (!$res->ok()) {
                Log::warning('TheOddsApiAdapter fetch failed', ['fixture' => $fixtureId, 'status' => $res->status()]);
                return [];
            }

            $data = $res->json();
            $normalized = [];
            // Normalize structure similar to ApiFootballAdapter
            foreach ($data as $entry) {
                foreach ($entry['bookmakers'] ?? [] as $bm) {
                    $selList = [];
                    foreach ($bm['markets'] ?? [] as $market) {
                        $marketKey = strtoupper(str_replace(' ', '_', $market['key'] ?? $market['name']));
                        foreach ($market['outcomes'] ?? [] as $o) {
                            $selList[] = ['selection' => strtolower($o['name']), 'odd' => (float)($o['price'] ?? $o['odds'] ?? 0)];
                        }
                        $normalized[] = ['bookmaker' => $bm['title'] ?? $bm['key'], 'market' => $marketKey, 'selections' => $selList];
                    }
                }
            }
            return $normalized;
        } catch (\Exception $e) {
            Log::error('TheOddsApiAdapter error', ['err' => $e->getMessage()]);
            return [];
        }
    }
}
