<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Section extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /** Fillable */
    protected $fillable = [
        'name',
        'strand_id',
        'grade_level',
        'capacity',
    ];

    /** Relationship for Strand */
    public function strand()
    {
        return $this->belongsTo(Strand::class);
    }

    /** Relationship for Student */
    public function students()
    {
        return $this->hasManyThrough(
            Student::class,
            StudentAcademic::class,
            'section_id',
            'id',
            'id',
            'student_id'
        );
    }
}
