<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // admin
        User::create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'middle_name' => 'A',
            'suffix' => null,
            'email' => 'admin@smartenroll.com',
            'contact_number' => '09123456789',
            'birthday' => '1990-01-01',
            'gender' => 'Male',
            'role' => 'admin',
            'status' => 'active',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        // head
        User::create([
            'first_name' => 'Department',
            'last_name' => 'Head',
            'middle_name' => 'B',
            'suffix' => null,
            'email' => 'head@smartenroll.com',
            'contact_number' => '09112233445',
            'birthday' => '1992-02-02',
            'gender' => 'Female',
            'role' => 'head',
            'status' => 'active',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        // staff
        User::create([
            'first_name' => 'Registrar',
            'last_name' => 'Staff',
            'middle_name' => 'C',
            'suffix' => null,
            'email' => 'staff@smartenroll.com',
            'contact_number' => '09987654321',
            'birthday' => '1995-05-05',
            'gender' => 'Female',
            'role' => 'staff',
            'status' => 'active',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);
    }
}
