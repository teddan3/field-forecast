<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class OddsAggregateUpdated implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public $fixtureId;
    public $market;
    public $aggregate;

    public function __construct($fixtureId, $market, $aggregate)
    {
        $this->fixtureId = $fixtureId;
        $this->market = $market;
        $this->aggregate = $aggregate;
    }

    public function broadcastOn()
    {
        return new Channel('match.' . $this->fixtureId);
    }

    public function broadcastWith()
    {
        return ['market' => $this->market, 'aggregate' => $this->aggregate];
    }
}
