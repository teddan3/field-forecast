<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\HeadToHeadRecord;
use App\Services\SportsApiService;
use Illuminate\Http\JsonResponse;

class HeadToHeadController extends Controller
{
    private SportsApiService $sportsApi;

    public function __construct(SportsApiService $sportsApi)
    {
        $this->sportsApi = $sportsApi;
    }

    public function show(int $team1Id, int $team2Id): JsonResponse
    {
        // First check cached record from DB
        $record = HeadToHeadRecord::where(function ($query) use ($team1Id, $team2Id) {
            $query->where('team_home_id', $team1Id)->where('team_away_id', $team2Id);
        })->orWhere(function ($query) use ($team1Id, $team2Id) {
            $query->where('team_home_id', $team2Id)->where('team_away_id', $team1Id);
        })->first();

        if ($record) {
            return response()->json([
                'success' => true,
                'data' => $this->formatRecord($record),
                'matches' => [],
            ]);
        }

        // If not cached, fetch from API
        $team1 = Team::findOrFail($team1Id);
        $team2 = Team::findOrFail($team2Id);

        $fixtures = $this->sportsApi->fetchH2H(
            $team1->api_id,
            $team2->api_id
        );

        // Save to DB
        $this->sportsApi->syncH2HRecord($team1Id, $team2Id);

        $matches = array_map(function ($fixture) {
            return [
                'id' => $fixture['fixture']['id'],
                'date' => $fixture['fixture']['date'],
                'home_team' => $fixture['teams']['home']['name'],
                'away_team' => $fixture['teams']['away']['name'],
                'score' => [
                    'home' => $fixture['goals']['home'],
                    'away' => $fixture['goals']['away'],
                ],
            ];
        }, array_slice($fixtures, 0, 10));

        return response()->json([
            'success' => true,
            'data' => [
                'team1' => [
                    'id' => $team1->id,
                    'name' => $team1->name,
                    'logo' => $team1->logo,
                ],
                'team2' => [
                    'id' => $team2->id,
                    'name' => $team2->name,
                    'logo' => $team2->logo,
                ],
                'total_matches' => count($fixtures),
                'home_wins' => collect($matches)->filter(fn($m) => ($m['score']['home'] ?? 0) > ($m['score']['away'] ?? 0))->count(),
                'away_wins' => collect($matches)->filter(fn($m) => ($m['score']['away'] ?? 0) > ($m['score']['home'] ?? 0))->count(),
                'draws' => collect($matches)->filter(fn($m) => ($m['score']['home'] ?? 0) === ($m['score']['away'] ?? 0))->count(),
            ],
            'matches' => $matches,
        ]);
    }

    public function sync(int $team1Id, int $team2Id): JsonResponse
    {
        $record = $this->sportsApi->syncH2HRecord($team1Id, $team2Id);

        return response()->json([
            'success' => true,
            'message' => 'H2H record synced',
            'data' => $record ? $this->formatRecord($record) : null,
        ]);
    }

    protected function formatRecord(HeadToHeadRecord $record): array
    {
        return [
            'id' => $record->id,
            'team_home' => [
                'id' => $record->teamHome->id,
                'name' => $record->teamHome->name,
                'logo' => $record->teamHome->logo,
            ],
            'team_away' => [
                'id' => $record->teamAway->id,
                'name' => $record->teamAway->name,
                'logo' => $record->teamAway->logo,
            ],
            'total_matches' => $record->total_matches,
            'home_wins' => $record->home_wins,
            'away_wins' => $record->away_wins,
            'draws' => $record->draws,
            'win_distribution' => $record->win_distribution,
            'average_score' => $record->average_score,
            'last_meeting' => $record->last_meeting?->toIso8601String(),
        ];
    }
}