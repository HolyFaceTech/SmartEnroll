<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentRequirement extends Model
{
    use HasFactory, HasUuids;

    /** Fillable */
    protected $fillable = [
        'student_id',
        'hard_copies',
        'psa',
        'form_137',
        'good_moral',
        'diploma',
        'form_138',
        'photo_2x2',
    ];

    /** Convert to Array Format */
    protected $casts = [
        'hard_copies' => 'array',
    ];

    /** Relationship for Student */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
