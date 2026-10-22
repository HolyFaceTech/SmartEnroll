<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnrollmentSetting extends Model
{
    use HasFactory;

    /** Fillable */
    protected $fillable = [
        'start_date',
        'end_date',
        'school_year',
        'term',
    ];

    /** Convert to Date */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];
}
