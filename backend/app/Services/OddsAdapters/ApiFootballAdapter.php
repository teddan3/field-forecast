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
                            $sel = $this->normalizeSelection($v['value']);
                            $selections[] = ['selection' => $sel, 'odd' => (float)$v['odd']];
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
        // over/under markets e.g., "Over/Under 2.5"
        if (stripos($name, 'over/under') !== false || stripos($name, 'totals') !== false) {
            // extract line
            if (preg_match('/([0-9]+\.?[0-9]*)/', $name, $m)) {
                return 'OU_' . $m[1];
            }
            return 'OU';
        }
        // asian handicap
        if (stripos($name, 'handicap') !== false || stripos($name, 'asian') !== false) {
            return 'AH';
        }
        // fallback to normalized name
        return strtoupper(str_replace(' ', '_', $name));
    }

    protected function normalizeSelection($value)
    {
        $v = trim(strtolower($value));
        // normalize common variants
        if (in_array($v, ['home', 'home win', 'team 1', '1'])) return 'home';
        if (in_array($v, ['away', 'away win', 'team 2', '2'])) return 'away';
        if (in_array($v, ['draw', 'tie', 'x'])) return 'draw';
        // over/under selections like 'Over' or 'Under'
        if (stripos($v, 'over') !== false) return 'over';
        if (stripos($v, 'under') !== false) return 'under';
        // default: return cleaned string
        return preg_replace('/[^a-z0-9_\.-]/', '_', $v);
    }
}
