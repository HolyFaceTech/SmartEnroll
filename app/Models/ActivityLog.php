<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    /** Fillable */
    protected $fillable = [
        'user_id',
        'action',
        'description',
        'ip_address',
    ];

    /** Relationship for User */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
