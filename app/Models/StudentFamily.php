<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentFamily extends Model
{
    use HasFactory, HasUuids;

    /** Fillable */
    protected $fillable = [
        'student_id',
        'employer_name',
        'employer_contact',
        'father_name',
        'father_occupation',
        'father_contact',
        'mother_name',
        'mother_occupation',
        'mother_contact',
        'guardian_name',
        'guardian_occupation',
        'guardian_contact',
    ];

    /** Relationship for Student */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
