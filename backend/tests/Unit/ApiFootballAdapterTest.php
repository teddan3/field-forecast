<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Services\OddsAdapters\ApiFootballAdapter;

class ApiFootballAdapterTest extends TestCase
{
    public function testNormalizeSelection()
    {
        $adapter = new ApiFootballAdapter([]);
        $r = $this->invokeMethod($adapter, 'normalizeSelection', ['Home Win']);
        $this->assertEquals('home', $r);

        $r = $this->invokeMethod($adapter, 'normalizeSelection', ['Over 2.5']);
        $this->assertEquals('over', $r);

        $r = $this->invokeMethod($adapter, 'normalizeSelection', ['Under 1.5']);
        $this->assertEquals('under', $r);
    }

    // helper to call protected/private methods
    protected function invokeMethod(&$object, $methodName, array $params = [])
    {
        $reflection = new \ReflectionClass(get_class($object));
        $method = $reflection->getMethod($methodName);
        $method->setAccessible(true);
        return $method->invokeArgs($object, $params);
    }
}
