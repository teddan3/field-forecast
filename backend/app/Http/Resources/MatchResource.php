<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'api_id' => $this->api_id,
            'date' => $this->match_date?->toIso8601String(),
            'status' => $this->status,
            'status_long' => $this->status_long,
            'elapsed' => $this->elapsed,
            'is_live' => $this->is_live,
            'score' => $this->score,
            'competition' => [
                'id' => $this->competition_id,
                'name' => $this->competition,
                'round' => $this->round,
            ],
            'home_team' => [
                'id' => $this->home_team_id,
                'name' => $this->homeTeam?->name,
                'logo' => $this->homeTeam?->logo,
                'score' => $this->home_score,
            ],
            'away_team' => [
                'id' => $this->away_team_id,
                'name' => $this->awayTeam?->name,
                'logo' => $this->awayTeam?->logo,
                'score' => $this->away_score,
            ],
            'venue' => [
                'name' => $this->venue,
                'city' => $this->city,
            ],
            'is_premium' => $this->is_premium,
        ];
    }
}