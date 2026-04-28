<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class SettleTipsJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public function __construct() {}

    public function handle()
    {
        // find finished matches in last hour
        $finished = DB::table('matches')->whereIn('status', ['ended','finished'])->where('updated_at', '>=', now()->subHour())->get();
        foreach ($finished as $m) {
            $tips = DB::table('tips')->where('fixture_id', $m->id)->where('status', 'open')->get();
            foreach ($tips as $t) {
                // simplistic: check winner based on home/away/fulltime
                $result = 'lost';
                if ($t->selection === 'home' && $m->home_score > $m->away_score) $result = 'won';
                if ($t->selection === 'away' && $m->away_score > $m->home_score) $result = 'won';
                if ($t->selection === 'draw' && $m->home_score == $m->away_score) $result = 'won';

                DB::table('tips')->where('id', $t->id)->update(['status' => $result, 'updated_at' => now()]);
            }
        }
    }
}
