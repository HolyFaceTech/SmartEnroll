<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'lrn',
        'last_name',
        'first_name',
        'middle_name',
        'suffix',
        'date_of_birth',
        'gender',
        'place_of_birth',
        'citizenship',
        'civil_status',
        'religion',
        '2x2_picture',
        'e_sign',
        'home_address',
        'provincial_address',
        'email',
        'contact_number',
        'current_school_attended',
        'strand_id',
        'section_id',
        'learning_modality',
        'grade_level',
        'general_average',
        'term',
        'school_year',
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
        'requirements',
        'fees',
        'status',
        'previous_status',
        'released_by',
        'released_at',
    ];

    protected $casts = [
        'requirements' => 'array',
        'fees' => 'array',
        'date_of_birth' => 'date',
        'released_at' => 'datetime',
    ];

    public function strand() 
    { 
        return $this->belongsTo(Strand::class); 
    }
    
    public function section() 
    { 
        return $this->belongsTo(Section::class); 
    }
}