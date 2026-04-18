<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LiveScoreUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public array $match
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('live-scores'),
            new Channel("match.{$this->match['id']}"),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'type' => 'score_update',
            'match' => $this->match,
        ];
    }
}