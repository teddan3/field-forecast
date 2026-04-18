<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SportsApiService;
use App\Services\PredictionService;
use App\Services\MatchValidationService;
use App\Models\Match;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OddsController extends Controller
{
    public function __construct(
        private SportsApiService $sportsApi,
        private PredictionService $prediction,
        private MatchValidationService $validation
    ) {}

    public function show(int $fixtureId): JsonResponse
    {
        $match = Match::where('api_id', $fixtureId)
            ->with(['homeTeam', 'awayTeam'])
            ->first();

        if (!$match) {
            return response()->json([
                'success' => false,
                'message' => 'Match not found',
            ], 404);
        }

        if (!$this->validation->isValidUpcomingMatch($match)) {
            return response()->json([
                'success' => false,
                'message' => 'This match is no longer valid for predictions',
                'match_status' => $match->status,
            ], 400);
        }

        if (!$match->is_upcoming && !$match->is_live) {
            return response()->json([
                'success' => false,
                'message' => 'This match has already finished',
                'match_status' => $match->status,
            ], 400);
        }

        $oddsData = $this->sportsApi->fetchOdds($fixtureId);

        if (!$oddsData) {
            return response()->json([
                'success' => false,
                'message' => 'No odds available for this match',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatOdds($oddsData, $match),
        ]);
    }

    public function upcoming(Request $request): JsonResponse
    {
        $type = $request->get('type', 'all');
        $limit = min($request->get('limit', 50), 100);
        $leagueId = $request->get('league');

        $matches = match ($type) {
            'live' => $this->prediction->getLivePredictions($limit),
            'premium' => $this->prediction->getPremiumPredictions(
                $request->user()?->id ?? 0,
                $limit
            ),
            'free' => $this->prediction->getFreePredictions($limit),
            default => $this->prediction->getUpcomingPredictions(
                $request->user()?->id ?? 0,
                $limit
            ),
        };

        if ($leagueId) {
            $matches = $this->prediction->getPredictionsByLeague($leagueId, $limit);
        }

        if (empty($matches)) {
            return response()->json([
                'success' => true,
                'message' => 'No predictions available at the moment',
                'data' => [],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $matches,
            'summary' => $this->prediction->getMatchSummary(),
        ]);
    }

    public function validateMatch(Request $request): JsonResponse
    {
        $request->validate([
            'match_id' => 'required|integer',
        ]);

        $match = Match::findOrFail($request->match_id);

        $isValid = $this->validation->isValidUpcomingMatch($match);
        $status = $this->validation->getMatchStatus($match);
        $canPredict = $this->validation->isMatchValidForPrediction($match);

        return response()->json([
            'success' => true,
            'match' => [
                'id' => $match->id,
                'api_id' => $match->api_id,
                'status' => $match->status,
                'is_valid' => $isValid,
                'is_upcoming' => $match->is_upcoming,
                'is_live' => $match->is_live,
                'can_predict' => $canPredict,
            ],
            'validation' => [
                'status' => $status,
                'match_time' => $match->match_date?->toIso8601String(),
                'is_future' => $match->is_upcoming,
            ],
        ]);
    }

    protected function formatOdds(array $oddsData, Match $match): array
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
            'match' => [
                'id' => $match->id,
                'status' => $match->status,
                'is_valid' => $match->is_valid,
                'is_upcoming' => $match->is_upcoming,
                'is_live' => $match->is_live,
                'match_date' => $match->match_date?->toIso8601String(),
            ],
            'teams' => [
                'home' => $match->homeTeam?->name,
                'away' => $match->awayTeam?->name,
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
            'last_update' => $oddsData['update'] ?? now()->toIso8601String(),
        ];
    }
}