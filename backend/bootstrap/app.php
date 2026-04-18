<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'premium' => \App\Http\Middleware\PremiumAccess::class,
            'feature' => \App\Http\Middleware\CheckFeatureAccess::class,
            'tier' => \App\Http\Middleware\CheckSubscriptionTier::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();