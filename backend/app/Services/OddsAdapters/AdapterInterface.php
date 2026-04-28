<?php

namespace App\Services\OddsAdapters;

interface AdapterInterface
{
    /**
     * Fetch odds for a single fixture id
     * @param int|string $fixtureId
     * @return array normalized odds data
     */
    public function fetchOddsForFixture($fixtureId): array;
}
