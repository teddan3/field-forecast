<?php

return [
    'default' => env('BROADCAST_DRIVER', env('PUSHER_DRIVER', 'pusher')),

    'connections' => [
        'pusher' => [
            'driver' => 'pusher',
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'app_id' => env('PUSHER_APP_ID'),
            'options' => [
                'cluster' => env('PUSHER_CLUSTER'),
                'useTLS' => env('PUSHER_USE_TLS', true),
                'host' => env('PUSHER_HOST', null),
                'port' => env('PUSHER_PORT', null),
                'scheme' => env('PUSHER_SCHEME', null),
            ],
        ],

        'log' => [
            'driver' => 'log',
        ],
    ],
];
