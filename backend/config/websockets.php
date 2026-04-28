<?php

return [
    'apps' => [
        [
            'id' => env('PUSHER_APP_ID'),
            'name' => env('APP_NAME'),
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'path' => env('PUSHER_APP_PATH', ''),
            'capacity' => null,
            'enable_client_messages' => false,
            'enable_statistics' => true,
        ],
    ],
    'replications' => [],
    'statistics' => [
        'model' => '\\BeyondCode\\LaravelWebSockets\\Statistics\\Models\\WebSocketsStatisticsEntry',
    ],
];
