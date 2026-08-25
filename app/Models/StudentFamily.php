<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StudentFamily extends Model
{
    use HasFactory, HasUuids;

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

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}