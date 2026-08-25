<?php

namespace Database\Seeders;

use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();
        $subjects = [];
        $strands = DB::table('strands')->pluck('code', 'id')->toArray();

        if (empty($strands)) {
            $this->command->warn('Walang strands sa database! Mag-seed o mag-add muna ng strands.');

            return;
        }

        $strandIds = array_keys($strands);

        $titles = [
            'Oral Communication', 'Komunikasyon at Pananaliksik', 'General Mathematics',
            'Earth and Life Science', 'Physical Education', 'Empowerment Technologies',
            'Pre-Calculus', 'Basic Calculus', 'General Chemistry', 'General Physics',
            'Fundamentals of ABM', 'Business Math', 'Organization and Management',
            'Computer Programming', 'Animation', 'System Analysis', 'Creative Writing',
            'Philippine Politics', 'World Religions', 'Disaster Readiness',
        ];

        for ($i = 1; $i <= 30; $i++) {
            $strandId = $strandIds[array_rand($strandIds)];
            $codePrefix = $strands[$strandId];
            $subjects[] = [
                'id' => Str::uuid(),
                'code' => $codePrefix.'-'.str_pad($i, 3, '0', STR_PAD_LEFT),
                'description' => $faker->randomElement($titles).' '.$faker->randomDigitNotNull(),
                'grade_level' => $faker->randomElement(['11', '12']),
                'term' => $faker->randomElement(['1st', '2nd', '3rd']), // 1st, 2nd, or 3rd term
                'strand_id' => $strandId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('subjects')->insert($subjects);
    }
}
