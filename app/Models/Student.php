<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /** Fillable */
    protected $guarded = [];

    /** Convert to Date and Time */
    protected $casts = [
        'released_at' => 'datetime',
    ];

    /** Relationship for Student Profile */
    public function profile()
    {
        return $this->hasOne(StudentProfile::class);
    }

    /** Relationship for Student Academic */
    public function academic()
    {
        return $this->hasOne(StudentAcademic::class);
    }

    /** Relationship for Student Family */
    public function family()
    {
        return $this->hasOne(StudentFamily::class);
    }

    /** Relationship for Student Requirement */
    public function requirement()
    {
        return $this->hasOne(StudentRequirement::class);
    }

    /** Relationship for Strand */
    public function strand()
    {
        return $this->hasOneThrough(
            Strand::class,
            StudentAcademic::class,
            'student_id',
            'id',
            'id',
            'strand_id'
        );
    }

    /** Relationship for Section */
    public function section()
    {
        return $this->hasOneThrough(
            Section::class,
            StudentAcademic::class,
            'student_id',
            'id',
            'id',
            'section_id'
        );
    }

    /** Relationship for Fetching Hard Copies Requirements */
    public function getRequirementsAttribute()
    {
        return $this->requirement ? $this->requirement->hard_copies : [];
    }

    /** Relationship for Fetching Grade Level */
    public function getGradeLevelAttribute()
    {
        return $this->academic?->grade_level;
    }

    /** Relationship for Fetching Term */
    public function getSemesterAttribute()
    {
        return $this->academic?->term;
    }

    /** Relationship for Fetching School Year */
    public function getSchoolYearAttribute()
    {
        return $this->academic?->school_year;
    }

    /** Relationship for Fetching Strand */
    public function getStrandIdAttribute()
    {
        return $this->academic?->strand_id;
    }

    /** Relationship for Fetching Section */
    public function getSectionIdAttribute()
    {
        return $this->academic?->section_id;
    }
}
