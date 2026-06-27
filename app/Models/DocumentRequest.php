<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DocumentRequest extends Model
{
    use HasFactory, SoftDeletes, HasUuids;

    protected $table = 'requests'; 

    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'student_number',
        'lrn',
        'strand',
        'request',
        'status',
    ];
}