<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids; 
use Illuminate\Database\Eloquent\SoftDeletes; 

class Strand extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'code',         
        'description'  
    ];

    public function sections()
    {
        return $this->hasMany(Section::class);
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }
}