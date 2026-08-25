<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'released_at' => 'datetime',
    ];

    public function profile()
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function academic()
    {
        return $this->hasOne(StudentAcademic::class);
    }

    public function family()
    {
        return $this->hasOne(StudentFamily::class);
    }

    public function requirement()
    {
        return $this->hasOne(StudentRequirement::class);
    }

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
}
