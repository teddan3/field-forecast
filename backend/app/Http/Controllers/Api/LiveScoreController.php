<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Match;
use App\Services\SportsApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LiveScoreController extends Controller
{
    public function __construct(
        private SportsApiService $sportsApi
    ) {}

    public function index(Request $request): JsonResponse
    {
        $date = $request->get('date', now()->toDateString());
        
        $fixtures = $this->sportsApi->fetchFixturesByDate($date);
        
        $formatted = array_map(function ($fixture) {
            return $this->formatFixture($fixture);
        }, $fixtures);

        return response()->json([
            'success' => true,
            'data' => $formatted,
            'count' => count($formatted),
        ]);
    }

    public function live(): JsonResponse
    {
        $fixtures = $this->sportsApi->fetchLiveFixtures();
        
        $formatted = array_map(function ($fixture) {
            return $this->formatFixture($fixture);
        }, $fixtures);

        return response()->json([
            'success' => true,
            'data' => $formatted,
            'count' => count($formatted),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $cached = cache()->remember("fixture_{$id}", 60, function () use ($id) {
            $fixtures = $this->sportsApi->fetchFixturesByDate(now()->toDateString());
            return collect($fixtures)->firstWhere('fixture.id', $id);
        });

        if (!$cached) {
            return response()->json(['success' => false, 'message' => 'Match not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatFixture($cached),
        ]);
    }

    public function sync(): JsonResponse
    {
        $synced = $this->sportsApi->syncMatchesFromApi();

        return response()->json([
            'success' => true,
            'message' => "Synced {$synced} matches from API",
        ]);
    }

    protected function formatFixture(array $fixture): array
    {
        $status = $fixture['fixture']['status']['short'] ?? 'NS';
        $isLive = in_array($status, ['1H', '2H', 'HT', 'ET', 'BT', 'P']);

        return [
            'id' => $fixture['fixture']['id'],
            'date' => $fixture['fixture']['date'],
            'timestamp' => $fixture['fixture']['timestamp'],
            'status' => $status,
            'status_long' => $fixture['fixture']['status']['long'],
            'elapsed' => $fixture['fixture']['status']['elapsed'],
            'is_live' => $isLive,
            'competition' => [
                'id' => $fixture['league']['id'],
                'name' => $fixture['league']['name'],
                'country' => $fixture['league']['country'],
                'logo' => $fixture['league']['logo'],
                'round' => $fixture['league']['round'],
            ],
            'home_team' => [
                'id' => $fixture['teams']['home']['id'],
                'name' => $fixture['teams']['home']['name'],
                'logo' => $fixture['teams']['home']['logo'],
                'winner' => $fixture['teams']['home']['winner'],
            ],
            'away_team' => [
                'id' => $fixture['teams']['away']['id'],
                'name' => $fixture['teams']['away']['name'],
                'logo' => $fixture['teams']['away']['logo'],
                'winner' => $fixture['teams']['away']['winner'],
            ],
            'score' => [
                'home' => $fixture['goals']['home'],
                'away' => $fixture['goals']['away'],
                'halftime' => [
                    'home' => $fixture['score']['halftime']['home'],
                    'away' => $fixture['score']['halftime']['away'],
                ],
                'fulltime' => [
                    'home' => $fixture['score']['fulltime']['home'],
                    'away' => $fixture['score']['fulltime']['away'],
                ],
            ],
            'venue' => [
                'name' => $fixture['fixture']['venue']['name'] ?? null,
                'city' => $fixture['fixture']['venue']['city'] ?? null,
            ],
        ];
    }
}