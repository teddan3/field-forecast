<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\TeamStat;
use App\Services\SportsApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    private SportsApiService $sportsApi;

    public function __construct(SportsApiService $sportsApi)
    {
        $this->sportsApi = $sportsApi;
    }

    public function index(Request $request): JsonResponse
    {
        $leagueId = $request->get('league_id');
        
        $teams = Team::when($leagueId, fn($q) => $q->where('league_id', $leagueId))
            ->orderBy('name')
            ->get()
            ->map(fn($t) => $this->formatTeam($t));

        return response()->json([
            'success' => true,
            'data' => $teams,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $team = Team::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $this->formatTeam($team),
            'stats' => $this->getTeamStats($team),
        ]);
    }

    public function recentForm(int $id): JsonResponse
    {
        $team = Team::findOrFail($id);
        $form = $team->recent_form;

        return response()->json([
            'success' => true,
            'data' => $form,
            'display' => implode('', $form),
        ]);
    }

    public function sync(): JsonResponse
    {
        $synced = $this->sportsApi->syncTeamsFromApi();

        return response()->json([
            'success' => true,
            'message' => "Synced {$synced} teams from API",
        ]);
    }

    protected function formatTeam(Team $team): array
    {
        return [
            'id' => $team->id,
            'api_id' => $team->api_id,
            'name' => $team->name,
            'short_name' => $team->short_name,
            'logo' => $team->logo,
            'country' => $team->country,
            'city' => $team->city,
            'venue' => $team->venue,
            'league_id' => $team->league_id,
            'league_name' => $team->league_name,
            'is_premium' => $team->is_premium,
        ];
    }

    protected function getTeamStats(Team $team): ?array
    {
        $stat = $team->stats()->latest()->first();
        
        if (!$stat) return null;

        return [
            'position' => $stat->position,
            'games_played' => $stat->games_played,
            'wins' => $stat->wins,
            'draws' => $stat->draws,
            'losses' => $stat->losses,
            'goals_for' => $stat->goals_for,
            'goals_against' => $stat->goals_against,
            'goal_difference' => $stat->goal_difference,
            'points' => $stat->points,
            'form' => $stat->form_string,
            'possession' => $stat->possession,
            'shots_on_target' => $stat->shots_on_target,
        ];
    }
}