<?php

namespace Database\Seeders;

use App\Models\Section;
use App\Models\Strand;
use Illuminate\Database\Seeder;

class SectionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Strands
        $stem = Strand::where('code', 'STEM')->first();
        $abm = Strand::where('code', 'ABM')->first();
        $humss = Strand::where('code', 'HUMSS')->first();
        $ict = Strand::where('code', 'ICT')->first();

        $sections = [
            // STEM Sections
            ['name' => 'Einstein', 'strand_id' => $stem->id, 'grade_level' => '11'],
            ['name' => 'Newton',   'strand_id' => $stem->id, 'grade_level' => '12'],

            // ABM Sections
            ['name' => 'Tycoon',   'strand_id' => $abm->id, 'grade_level' => '11'],
            ['name' => 'Executive', 'strand_id' => $abm->id, 'grade_level' => '12'],

            // HUMSS Sections
            ['name' => 'Plato',    'strand_id' => $humss->id, 'grade_level' => '11'],
            ['name' => 'Socrates', 'strand_id' => $humss->id, 'grade_level' => '12'],

            // ICT Sections
            ['name' => 'Java',     'strand_id' => $ict->id, 'grade_level' => '11'],
            ['name' => 'Python',   'strand_id' => $ict->id, 'grade_level' => '12'],
        ];

        foreach ($sections as $sec) {
            Section::create($sec);
        }
    }
}
