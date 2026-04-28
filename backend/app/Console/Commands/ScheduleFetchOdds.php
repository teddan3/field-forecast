<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ScheduleFetchOdds extends Command
{
    protected $signature = 'odds:schedule';
    protected $description = 'Helper: run this command from your scheduler (cron) to fetch odds snapshots periodically';

    public function handle()
    {
        // This command exists to provide a single cron entry that triggers the existing fetch command
        // Add to your system's cron: php artisan odds:schedule
        $this->call('odds:fetch');
        return 0;
    }
}
