<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StudentAcademic extends Model
{
    use HasFactory, HasUuids;

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

    protected $casts = [
        'general_average' => 'decimal:2',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function strand()
    {
        return $this->belongsTo(Strand::class);
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }
}