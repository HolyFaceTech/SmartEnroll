<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Strand extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /** Fillable */
    protected $fillable = [
        'code',
        'description',
    ];

    /** Relationship for Section */
    public function sections()
    {
        return $this->hasMany(Section::class);
    }

    /** Relationship for Subjects */
    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }

    /** Relationship for Student */
    public function students()
    {
        return $this->hasManyThrough(
            Student::class,
            StudentAcademic::class,
            'strand_id',
            'id',
            'id',
            'student_id'
        );
    }
}
