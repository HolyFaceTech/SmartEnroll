<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    use HasFactory, HasUuids;

    /** Fillable */
    protected $fillable = [
        'student_id',
        'date_of_birth',
        'gender',
        'place_of_birth',
        'citizenship',
        'civil_status',
        'religion',
        'home_address',
        'provincial_address',
    ];

    /** Convert to Date */
    protected $casts = [
        'date_of_birth' => 'date',
    ];

    /** Relationship for Student */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
