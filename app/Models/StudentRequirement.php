<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentRequirement extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'student_id',
        'requirements',
        'psa',
        'form_137',
        'good_moral',
        'diploma',
        'form_138',
        'photo_2x2',
        'e_sign',
    ];

    protected $casts = [
        'requirements' => 'array',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
