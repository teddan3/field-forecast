<?php

namespace App\Services\OddsAdapters;

use App\Models\Bookmaker;

class AdapterFactory
{
    public static function forBookmaker(Bookmaker $bm)
    {
        $meta = $bm->api_meta ?? [];
        $slug = $bm->slug;

        // extend with other adapters later
        if ($slug === 'api_football' || isset($meta['api_key'])) {
            return new ApiFootballAdapter($meta);
        }
        if ($slug === 'the_odds_api' || isset($meta['theoddsapi_key'])) {
            return new TheOddsApiAdapter($meta);
        }

        // default: null (no adapter)
        return null;
    }
}
