<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subject extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /** Fillable */
    protected $fillable = [
        'code',
        'description',
        'grade_level',
        'strand_id',
        'term',
    ];

    /** Relationship for Strand */
    public function strand()
    {
        return $this->belongsTo(Strand::class);
    }
}
