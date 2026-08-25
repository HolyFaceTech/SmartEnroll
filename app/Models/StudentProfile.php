<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StudentProfile extends Model
{
    use HasFactory, HasUuids;

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

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}