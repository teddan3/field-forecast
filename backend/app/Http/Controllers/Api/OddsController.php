<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SportsApiService;
use Illuminate\Http\JsonResponse;

class OddsController extends Controller
{
    public function __construct(
        private SportsApiService $sportsApi
    ) {}

    public function show(int $fixtureId): JsonResponse
    {
        $oddsData = $this->sportsApi->fetchOdds($fixtureId);

        if (!$oddsData) {
            return response()->json([
                'success' => false,
                'message' => 'No odds available for this match',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatOdds($oddsData),
        ]);
    }

    protected function formatOdds(array $oddsData): array
    {
        $bookmakers = $oddsData['bookmakers'] ?? [];
        $matchWinnerOdds = [];
        
        foreach ($bookmakers as $bookmaker) {
            $bet = collect($bookmaker['bets'] ?? [])->firstWhere('id', 1);
            if (!$bet) continue;

            $home = collect($bet['values'] ?? [])->firstWhere('value', 'Home');
            $draw = collect($bet['values'] ?? [])->firstWhere('value', 'Draw');
            $away = collect($bet['values'] ?? [])->firstWhere('value', 'Away');

            $matchWinnerOdds[] = [
                'sportsbook' => $bookmaker['name'],
                'home' => $home['odd'] ?? null,
                'draw' => $draw['odd'] ?? null,
                'away' => $away['odd'] ?? null,
            ];
        }

        $avgHome = collect($matchWinnerOdds)
            ->filter(fn($o) => $o['home'])
            ->avg('home');
        $avgDraw = collect($matchWinnerOdds)
            ->filter(fn($o) => $o['draw'])
            ->avg('draw');
        $avgAway = collect($matchWinnerOdds)
            ->filter(fn($o) => $o['away'])
            ->avg('away');

        $impliedHome = $avgHome ? 1 / $avgHome : 0;
        $impliedDraw = $avgDraw ? 1 / $avgDraw : 0;
        $impliedAway = $avgAway ? 1 / $avgAway : 0;
        $total = $impliedHome + $impliedDraw + $impliedAway;

        return [
            'fixture' => [
                'id' => $oddsData['fixture']['id'],
                'date' => $oddsData['fixture']['date'],
                'league' => $oddsData['league']['name'],
            ],
            'averages' => [
                'home' => round($avgHome, 2),
                'draw' => round($avgDraw, 2),
                'away' => round($avgAway, 2),
            ],
            'implied_probability' => [
                'home' => $total ? round(($impliedHome / $total) * 100) : 0,
                'draw' => $total ? round(($impliedDraw / $total) * 100) : 0,
                'away' => $total ? round(($impliedAway / $total) * 100) : 0,
            ],
            'prediction' => [
                'value' => $avgHome < $avgDraw && $avgHome < $avgAway ? 'home' : 
                          ($avgAway < $avgHome && $avgAway < $avgDraw ? 'away' : 'draw'),
                'confidence' => $total ? round(max($impliedHome, $impliedDraw, $impliedAway) / $total * 100) : 0,
            ],
            'sportsbook_odds' => $matchWinnerOdds,
            'last_update' => $oddsData['update'],
        ];
    }
}