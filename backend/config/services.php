<?php

return [
    'api_football' => [
        'key' => env('API_FOOTBALL_KEY', ''),
        'base_url' => env('API_FOOTBALL_BASE_URL', 'https://v3.football.api-sports.io'),
    ],

    'cache' => [
        'livescore_ttl' => env('CACHE_LIVESCORE_TTL', 60),
        'team_stats_ttl' => env('CACHE_TEAM_STATS_TTL', 86400),
        'h2h_ttl' => env('CACHE_H2H_TTL', 43200),
    ],

    'pusher' => [
        'app_id' => env('PUSHER_APP_ID'),
        'key' => env('PUSHER_APP_KEY'),
        'secret' => env('PUSHER_APP_SECRET'),
        'cluster' => env('PUSHER_CLUSTER', 'mt1'),
    ],
];