<?php

namespace App\Http\Controllers;

use App\Mail\StudentApplication;
use App\Models\EnrollmentSetting;
use App\Models\Request as DocumentRequest;
use App\Models\Strand;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PublicController extends Controller
{
    /** Get Enrollment Settings */
    public function getSettings()
    {
        $settings = EnrollmentSetting::latest()->first();

        return response()->json($settings);
    }

    /** Get Strands */
    public function getStrands()
    {
        $strands = Strand::select('id', 'code', 'description')->get();

        return response()->json($strands);
    }

    /** Check LRN */
    public function checkLrn(Request $request)
    {
        $request->validate(['lrn' => 'required|digits:12']);

        $student = Student::where('lrn', $request->lrn)->first();

        // Freshmen
        if (! $student) {
            return response()->json([
                'message' => 'Ready for enrollment.',
                'is_freshman' => true,
            ], 200);
        }

        // Old Students
        return response()->json([
            'message' => 'Record found. Old students must proceed to the Registrar\'s Office for enrollment.',
            'status' => $student->status,
            'is_freshman' => false,
        ], 403);
    }

    /** Check Enrollment Status */
    public function checkStatus(Request $request)
    {
        $request->validate(['lrn' => 'required|digits:12']);

        $student = Student::with(['strand', 'section', 'academic', 'requirement'])
            ->where('lrn', $request->lrn)
            ->first();

        if (! $student) {
            return response()->json(['message' => 'LRN not found in our records.'], 404);
        }

        return response()->json([
            'student_number' => $student->student_number,
            'lrn' => $student->lrn,
            'first_name' => $student->first_name,
            'middle_name' => $student->middle_name,
            'last_name' => $student->last_name,
            'suffix' => $student->suffix,
            'status' => $student->status,
            'grade_level' => $student->academic->grade_level ?? 'N/A',
            'term' => $student->academic->term ?? 'N/A',
            'strand' => [
                'code' => $student->strand->code ?? 'N/A',
            ],
            'section' => [
                'name' => $student->section->name ?? 'TBA',
            ],
            'photo_2x2' => $student->requirement->photo_2x2 ?? null,
        ], 200);
    }

    /** Enrollment Form for Freshmen */
    public function enrollNew(Request $request)
    {
        try {
            $settings = EnrollmentSetting::latest()->first();

            if (! $this->isEnrollmentOpen($settings)) {
                return response()->json(['message' => 'Enrollment is currently closed or in maintenance.'], 403);
            }

            $validated = $request->validate([
                'lrn' => 'required|digits:12|unique:students,lrn',
                'email' => 'required|email|unique:students,email',
                'last_name' => 'required|string|max:255',
                'first_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'suffix' => 'nullable|string|max:50',
                'contact_number' => 'required|digits:11',

                'date_of_birth' => 'required|date',
                'gender' => 'required|in:Male,Female',
                'civil_status' => 'required|string',
                'citizenship' => 'required|string',
                'religion' => 'required|string',
                'place_of_birth' => 'required|string',
                'home_address' => 'required|string',
                'provincial_address' => 'nullable|string',

                'guardian_name' => 'required|string',
                'guardian_occupation' => 'required|string',
                'guardian_contact' => 'required|digits:11',
                'father_name' => 'nullable|string|max:255',
                'father_occupation' => 'nullable|string|max:255',
                'father_contact' => 'nullable|digits:11',
                'mother_name' => 'nullable|string|max:255',
                'mother_occupation' => 'nullable|string|max:255',
                'mother_contact' => 'nullable|digits:11',
                'employer_name' => 'nullable|string|max:255',
                'employer_contact' => 'nullable|digits:11',

                'strand_id' => 'required|exists:strands,id',
                'current_school_attended' => 'required|string|max:255',
                'learning_modality' => 'required|in:Face-to-Face,Modular',
                'general_average' => 'nullable|numeric|min:75|max:100',

                'file_psa' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_form137' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_good_moral' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_diploma' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_card' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_picture' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            ]);

            return DB::transaction(function () use ($request, $settings) {

                $student = Student::create([
                    'lrn' => $request->lrn,
                    'first_name' => $request->first_name,
                    'last_name' => $request->last_name,
                    'middle_name' => $request->middle_name,
                    'suffix' => $request->suffix,
                    'email' => $request->email,
                    'contact_number' => $request->contact_number,
                    'status' => 'pending',
                ]);

                $student->profile()->create($request->only([
                    'date_of_birth', 'gender', 'place_of_birth', 'citizenship',
                    'civil_status', 'religion', 'home_address', 'provincial_address',
                ]));

                $student->academic()->create([
                    'current_school_attended' => $request->current_school_attended,
                    'strand_id' => $request->strand_id,
                    'learning_modality' => $request->learning_modality,
                    'general_average' => $request->general_average,
                    'grade_level' => '11',
                    'term' => '1st',
                    'school_year' => $settings->school_year,
                    'section_id' => null,
                ]);

                $student->family()->create($request->only([
                    'employer_name', 'employer_contact', 'father_name', 'father_occupation',
                    'father_contact', 'mother_name', 'mother_occupation', 'mother_contact',
                    'guardian_name', 'guardian_occupation', 'guardian_contact',
                ]));

                $folderName = trim($student->lrn);
                Storage::disk('public')->makeDirectory("students/{$folderName}");

                $filePaths = [];
                $fileMap = [
                    'file_psa' => 'psa',
                    'file_form137' => 'form_137',
                    'file_good_moral' => 'good_moral',
                    'file_diploma' => 'diploma',
                    'file_card' => 'form_138',
                    'file_picture' => 'photo_2x2',
                ];

                foreach ($fileMap as $requestKey => $dbKey) {
                    if ($request->hasFile($requestKey)) {
                        $file = $request->file($requestKey);
                        $filename = time().'_'.preg_replace('/[^A-Za-z0-9\-\.]/', '_', $file->getClientOriginalName());
                        $path = $file->storeAs("students/{$folderName}", $filename, 'public');
                        $filePaths[$dbKey] = $path;
                    }
                }

                $student->requirement()->create(array_merge(['hard_copies' => []], $filePaths));

                try {
                    Mail::to($student->email)->queue(new StudentApplication($student));
                } catch (\Throwable $mailError) {
                    Log::warning('Public Enrollment Email Failed: '.$mailError->getMessage());
                }

                return response()->json([
                    'message' => 'Application submitted successfully!',
                    'student_id' => $student->id,
                ], 201);
            });

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Public Enrollment Error: '.$e->getMessage());

            return response()->json(['message' => 'An unexpected server error occurred. Please try again later.'], 500);
        }
    }

    /** Check Enrollment if Open */
    private function isEnrollmentOpen($settings)
    {
        if (! $settings) {
            return false;
        }

        $now = Carbon::now()->format('Y-m-d');

        return $now >= $settings->start_date->format('Y-m-d') && $now <= $settings->end_date->format('Y-m-d');
    }

    /** Verify LRN for Request */
    public function verifyForRequest(Request $request)
    {
        $request->validate([
            'lrn' => 'required|digits:12',
            'date_of_birth' => 'required|date',
        ]);

        $student = Student::where('lrn', $request->lrn)
            ->whereHas('profile', function ($query) use ($request) {
                $query->where('date_of_birth', $request->date_of_birth);
            })
            ->with(['strand'])
            ->first();

        if (! $student) {
            return response()->json([
                'message' => 'Verification failed. Incorrect LRN or Date of Birth. If you are not in the system, please proceed to the Registrar\'s Office to manually request documents.',
            ], 404);
        }

        return response()->json([
            'first_name' => $student->first_name,
            'last_name' => $student->last_name,
            'student_number' => $student->student_number ?? 'N/A',
            'strand_code' => $student->strand->code ?? 'N/A',
        ], 200);
    }

    /** Request Form */
    public function submitRequest(Request $request)
    {
        $request->validate([
            'lrn' => 'required|digits:12',
            'type' => 'required|string|max:255',
            'purpose' => 'nullable|string|max:1000',
        ]);

        $student = Student::where('lrn', $request->lrn)->first();

        if (! $student) {
            return response()->json([
                'message' => 'LRN not found. Please visit the Registrar\'s Office.',
            ], 404);
        }

        try {
            DocumentRequest::create([
                'student_id' => $student->id,
                'type' => $request->type,
                'purpose' => $request->purpose,
                'status' => 'pending',
            ]);

            return response()->json([
                'message' => 'Request submitted successfully! We will process it shortly.',
            ], 201);

        } catch (\Throwable $e) {
            Log::error('Public Request Error: '.$e->getMessage());

            return response()->json([
                'message' => 'An unexpected server error occurred.',
            ], 500);
        }
    }
}
