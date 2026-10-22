<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Request extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /** Fillable */
    protected $fillable = [
        'student_id',
        'user_id',
        'type',
        'purpose',
        'status',
        'release_date',
        'claimed_at',
    ];

    /** Convert to Date and Time */
    protected $casts = [
        'release_date' => 'datetime',
        'claimed_at' => 'datetime',
    ];

    /** Relationship for Student */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /** Relationship for User */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
