<?php

namespace Database\Seeders;

use App\Models\Status;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;

class StatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        $maintenanceTypes = [
            'Server Maintenance',
            'Bug Fix',
            'UI Enhancement',
            'Database Optimization',
            'API Integration',
            'Security Patch',
            'Feature Rollout',
            'System Backup',
            'Network Configuration',
            'Performance Tuning',
        ];

        for ($i = 0; $i < 60; $i++) {
            $isDone = $faker->boolean(40);

            Status::create([
                'name' => $faker->randomElement($maintenanceTypes).' - '.strtoupper($faker->lexify('???-???')),
                'description' => $faker->sentence(10),
                'status' => $isDone ? 'done' : 'processing',
                'done_at' => $isDone ? $faker->dateTimeBetween('-1 month', 'now') : null,
                'created_at' => $faker->dateTimeBetween('-2 months', '-1 month'),
            ]);
        }
    }
}
