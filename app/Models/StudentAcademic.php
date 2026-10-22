<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentAcademic extends Model
{
    use HasFactory, HasUuids;

    /** Fillable */
    protected $fillable = [
        'student_id',
        'current_school_attended',
        'strand_id',
        'section_id',
        'grade_level',
        'term',
        'school_year',
        'learning_modality',
        'general_average',
    ];

    /** Convert to Decimal Number */
    protected $casts = [
        'general_average' => 'decimal:2',
    ];

    /** Relationship for Student */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /** Relationship for Strand */
    public function strand()
    {
        return $this->belongsTo(Strand::class);
    }

    /** Relationship for Section */
    public function section()
    {
        return $this->belongsTo(Section::class);
    }
}
