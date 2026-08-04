<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Student;
use App\Models\Strand;
use Faker\Factory as Faker;
use Illuminate\Support\Str;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Gagamit tayo ng PH locale para mas realistic ang pangalan at address
        $faker = Faker::create('en_PH'); 

        // 1. Siguraduhing existing ang mga Strands
        $strandCodes = [
            'HTEE' => 'Hospitality, Tourism & Event',
            'BE' => 'Business Enterprise',
            'ASSH' => 'Arts, Sciences, Society & Humanities',
            'HE' => 'Home Economics'
        ];
        
        $strands = [];
        foreach ($strandCodes as $code => $desc) {
            $strands[] = Strand::firstOrCreate(
                ['code' => $code],
                ['description' => $desc]
            );
        }

        // 2. Mga random choices
        $terms = ['1st Term', '2nd Term', '3rd Term'];
        $gradeLevels = ['11', '12'];
        $statuses = ['pending', 'passed', 'enrolled', 'rejected'];
        $modalities = ['Face-to-Face', 'Modular'];
        $genders = ['Male', 'Female'];
        $civilStatuses = ['Single', 'Married'];

        // 3. Loop para gumawa ng 50 Students
        for ($i = 1; $i <= 50; $i++) {
            $gender = $faker->randomElement($genders);
            $firstName = $gender === 'Male' ? $faker->firstNameMale : $faker->firstNameFemale;
            $lastName = $faker->lastName;
            $middleName = $faker->lastName;

            Student::create([
                // Unique Identifiers
                'student_number' => '2026' . str_pad($i, 4, '0', STR_PAD_LEFT), // e.g. 20260001
                'lrn' => $faker->numerify('############'), // 12 digits LRN
                
                // Name
                'last_name' => $lastName,
                'first_name' => $firstName,
                'middle_name' => $middleName,
                'suffix' => $gender === 'Male' ? $faker->randomElement(['', '', 'Jr.', 'III']) : '', // Madalas walang suffix
                
                // Demographics
                'date_of_birth' => $faker->dateTimeBetween('-19 years', '-16 years')->format('Y-m-d'),
                'gender' => $gender,
                'place_of_birth' => $faker->city . ', ' . $faker->province,
                'citizenship' => 'Filipino',
                'civil_status' => $faker->randomElement($civilStatuses),
                'religion' => $faker->randomElement(['Roman Catholic', 'Iglesia ni Cristo', 'Islam', 'Born Again', 'Baptist']),
                
                // Contact
                'home_address' => $faker->address,
                'email' => strtolower($firstName . '.' . $lastName . $i . '@example.com'),
                'contact_number' => '09' . $faker->numerify('#########'),
                
                // Academic
                'current_school_attended' => $faker->company . ' High School',
                'strand_id' => $faker->randomElement($strands)->id,
                'learning_modality' => $faker->randomElement($modalities),
                'grade_level' => $faker->randomElement($gradeLevels),
                'general_average' => $faker->randomFloat(2, 75, 98), // Grades between 75 and 98
                'term' => $faker->randomElement($terms),
                'school_year' => '2026-2027',
                
                // Family
                'father_name' => $faker->name('male'),
                'father_occupation' => $faker->jobTitle,
                'father_contact' => '09' . $faker->numerify('#########'),
                'mother_name' => $faker->name('female'),
                'mother_occupation' => $faker->jobTitle,
                'mother_contact' => '09' . $faker->numerify('#########'),
                'guardian_name' => $faker->name,
                'guardian_occupation' => $faker->jobTitle,
                'guardian_contact' => '09' . $faker->numerify('#########'),
                
                // JSON Requirements (Random T/F)
                'requirements' => json_encode([
                    'psa' => $faker->boolean(80), // 80% chance na true
                    'form137' => $faker->boolean(70),
                    'good_moral' => $faker->boolean(90),
                    'diploma' => $faker->boolean(50),
                    'card' => $faker->boolean(80),
                    'picture' => $faker->boolean(95)
                ]),
                
                // System Status
                'status' => $faker->randomElement($statuses),
            ]);
        }
    }
}