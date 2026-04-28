<?php

namespace App\Console;

use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Facades\Log;
use App\Console\Commands\ScheduleFetchOdds;
use App\Jobs\SettleTipsJob;

class Kernel extends ConsoleKernel
{
    protected function schedule(\Illuminate\Console\Scheduling\Schedule $schedule)
    {
        // run the fetch scheduler every minute
        $schedule->command('odds:schedule')->everyMinute()->withoutOverlapping();

        // settle tips every minute
        $schedule->job(new SettleTipsJob())->everyMinute()->withoutOverlapping();
    }

    protected function commands()
    {
        // load default
        if (file_exists(base_path('routes/console.php'))) {
            require base_path('routes/console.php');
        }
    }
}
