<?php

namespace Database\Seeders;

use App\Models\Section;
use App\Models\Strand;
use App\Models\Student;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('en_PH');

        $strands = Strand::all();
        $sections = Section::with('strand')->get();

        if ($strands->isEmpty()) {
            $this->call(StrandSeeder::class);
            $strands = Strand::all();
        }

        if ($sections->isEmpty()) {
            $this->call(SectionSeeder::class);
            $sections = Section::with('strand')->get();
        }

        for ($i = 1; $i <= 50; $i++) {
            $this->createStudent($i, $faker, $strands, $sections);
        }

        $currentYear = date('y');
        DB::table('student_number_sequences')->updateOrInsert(
            ['year_prefix' => $currentYear],
            [
                'last_number' => 50,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    private function createStudent($i, $faker, $strands, $sections): void
    {
        $surnames = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Castillo', 'Villanueva', 'Ramos', 'Castro', 'Rivera', 'Aquino', 'Dela Cruz', 'Gonzales', 'Lopez'];
        $males = ['Juan', 'Jose', 'Mark', 'Angelo', 'Joshua', 'Christian', 'Gabriel', 'Daniel', 'John Paul', 'Kevin'];
        $females = ['Maria', 'Angel', 'Bea', 'Princess', 'Nicole', 'Samantha', 'Andrea', 'Patricia', 'Jasmine', 'Sophia'];
        $middles = ['Alcantara', 'Bernardo', 'Cabrera', 'Dizon', 'Enriquez', 'Francisco', 'Gomez', 'Javier'];
        $jobs = ['Teacher', 'Engineer', 'Accountant', 'Driver', 'Nurse', 'Office Clerk', 'IT Specialist'];
        $cities = ['Manila', 'Quezon City', 'Caloocan', 'Pasig', 'Taguig', 'Makati', 'Valenzuela'];

        $gender = $faker->randomElement(['Male', 'Female']);
        $firstName = $gender === 'Male' ? $faker->randomElement($males) : $faker->randomElement($females);
        $lastName = $faker->randomElement($surnames);
        $middleName = $faker->randomElement($middles);
        $suffix = ($gender === 'Male' && rand(1, 10) === 1) ? 'Jr.' : null;

        $status = $faker->randomElement(['pending', 'enrolled', 'on hold', 'graduate', 'drop out', 'released']);
        $releasedBy = $status === 'released' ? 'Admin Staff' : null;
        $releasedAt = $status === 'released' ? now()->subDays(rand(1, 30)) : null;

        $prevStatus = in_array($status, ['graduate', 'drop out', 'released']) ? 'enrolled' : null;

        if ($sections->isNotEmpty() && ($status === 'enrolled' || rand(1, 2) === 1)) {
            $sec = $sections->random();
            $strandId = $sec->strand_id;
            $gradeLevel = $sec->grade_level;
            $sectionId = $sec->id;
        } else {
            $strand = $strands->random();
            $strandId = $strand->id;
            $gradeLevel = (string) rand(11, 12);
            $sectionId = null;
        }

        $email = strtolower(str_replace(' ', '', $firstName)).'.'.strtolower(str_replace(' ', '', $lastName)).$i.'@smartenroll.edu.ph';
        $studentNumber = date('y').'-'.str_pad($i, 5, '0', STR_PAD_LEFT);

        $student = Student::create([
            'student_number' => $studentNumber,
            'lrn' => '1092'.str_pad($i, 8, '0', STR_PAD_LEFT),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'middle_name' => $middleName,
            'suffix' => $suffix,
            'email' => $email,
            'contact_number' => '09'.rand(10, 99).rand(100, 999).rand(1000, 9999),
            'status' => $status,
            'previous_status' => $prevStatus,
            'released_by' => $releasedBy,
            'released_at' => $releasedAt,
        ]);

        $birthYear = (int) $gradeLevel === 11 ? 2009 : 2008;
        $city = $faker->randomElement($cities);

        $student->profile()->create([
            'date_of_birth' => "$birthYear-".str_pad(rand(1, 12), 2, '0', STR_PAD_LEFT).'-'.str_pad(rand(1, 28), 2, '0', STR_PAD_LEFT),
            'gender' => $gender,
            'place_of_birth' => $city,
            'citizenship' => 'Filipino',
            'civil_status' => 'Single',
            'religion' => 'Roman Catholic',
            'home_address' => rand(1, 200).' St, Brgy. '.rand(1, 100).', '.$city,
        ]);

        $student->academic()->create([
            'current_school_attended' => $faker->randomElement(['Manila High School', 'Quezon City High School']),
            'strand_id' => $strandId,
            'section_id' => $sectionId,
            'grade_level' => $gradeLevel,
            'term' => $faker->randomElement(['1st', '2nd', '3rd']),
            'school_year' => '2026-2027',
            'learning_modality' => 'Face-to-Face',
            'general_average' => round(rand(8200, 9800) / 100, 2),
        ]);

        $isComp = in_array($status, ['enrolled', 'graduate', 'drop out', 'released']);

        $student->requirement()->create([
            'hard_copies' => [
                'psa' => $isComp,
                'form137' => $isComp,
                'good_moral' => $isComp,
                'diploma' => $isComp,
                'card' => $isComp,
                'picture' => $isComp,
            ],
            'psa' => $isComp ? 'uploads/requirements/psa_'.$student->id.'.pdf' : null,
            'form_137' => $isComp ? 'uploads/requirements/f137_'.$student->id.'.pdf' : null,
            'good_moral' => $isComp ? 'uploads/requirements/good_moral_'.$student->id.'.pdf' : null,
            'diploma' => $isComp ? 'uploads/requirements/diploma_'.$student->id.'.pdf' : null,
            'form_138' => $isComp ? 'uploads/requirements/f138_'.$student->id.'.pdf' : null,
            'photo_2x2' => $isComp ? 'uploads/requirements/photo_'.$student->id.'.jpg' : null,
        ]);
    }
}
