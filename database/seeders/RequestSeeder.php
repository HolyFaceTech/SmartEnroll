<?php

namespace Database\Seeders;

use App\Models\Request as DocumentRequest;
use App\Models\Student;
use App\Models\User;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;

class RequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('en_PH');

        $students = Student::all();
        $staffUsers = User::whereIn('role', ['head', 'staff'])->get();

        if ($students->isEmpty()) {
            $this->command->warn('Walang students sa database. Mangyari po lamang na i-run muna ang StudentSeeder.');

            return;
        }

        $documentTypes = [
            'Certificate of Enrollment',
            'Certificate of Graduate',
            'Copy of Grades',
            'Certificate of Dismissal',
            'Form 137',
            'Good Moral Certificate',
            'Transcript of Records',
        ];

        $purposes = [
            'For college admission requirement.',
            'For employment purposes.',
            'For scholarship application.',
            'Personal copy.',
            'For board examination requirement.',
            'Transferring to another school.',
        ];

        $statuses = ['pending', 'processing', 'on hold', 'done', 'released', 'denied'];

        for ($i = 1; $i <= 60; $i++) {
            $status = $faker->randomElement($statuses);
            $student = $students->random();

            $selectedDocsCount = rand(1, 3);
            $selectedDocs = (array) $faker->randomElements($documentTypes, $selectedDocsCount);
            $typeString = implode(', ', $selectedDocs);

            $userId = null;
            $releasedAt = null;
            $claimedBy = null;

            if ($status === 'released') {
                $staff = $staffUsers->isNotEmpty() ? $staffUsers->random() : null;
                $userId = $staff ? $staff->id : null;
                $releasedAt = $faker->dateTimeBetween('-1 month', 'now');

                if (rand(1, 10) <= 8) {
                    $claimedBy = trim("{$student->first_name} {$student->last_name}");
                } else {
                    $claimedBy = $faker->name();
                }
            }

            DocumentRequest::create([
                'student_id' => $student->id,
                'user_id' => $userId,
                'type' => $typeString,
                'purpose' => $faker->randomElement($purposes),
                'status' => $status,
                'released_at' => $releasedAt,
                'claimed_at' => $releasedAt,
                'claimed_by' => $claimedBy,
                'created_at' => $faker->dateTimeBetween('-3 months', '-1 day'),
            ]);
        }
    }
}
