<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bookmaker extends Model
{
    use HasFactory;

    protected $guarded = [];
    protected $casts = [
        'api_meta' => 'array'
    ];
}
