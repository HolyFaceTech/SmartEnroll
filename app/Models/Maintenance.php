<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Maintenance extends Model
{
    use HasFactory, SoftDeletes;

    /** Fillable */
    protected $fillable = [
        'is_enabled',
        'message',
    ];

    /** Convert to True or False */
    protected $casts = [
        'is_enabled' => 'boolean',
    ];
}
