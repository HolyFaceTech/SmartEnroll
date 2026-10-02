<?php

namespace App\Http\Controllers;

use App\Mail\StudentApplication;
use App\Mail\StudentUpdated;
use App\Models\ActivityLog;
use App\Models\Section;
use App\Models\Strand;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class StudentController extends Controller
{
    // security
    private function checkAccess($authUser)
    {
        if (! in_array($authUser->role, ['head', 'staff'])) {
            abort(403, 'Unauthorized Access. You do not have permission to manage students.');
        }
    }

    // folder name
    private function getFolderName($student)
    {
        $lastName = trim("{$student->last_name} {$student->suffix}");
        $firstName = trim("{$student->first_name} {$student->middle_name}");

        return "{$lastName}, {$firstName} - {$student->lrn}";
    }

    // student number sequence
    private function generateUniqueStudentNumber()
    {
        $currentYear = date('y');

        $sequence = DB::table('student_number_sequences')
            ->where('year_prefix', $currentYear)
            ->lockForUpdate()
            ->first();

        if (! $sequence) {
            DB::table('student_number_sequences')->insert([
                'year_prefix' => $currentYear,
                'last_number' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $lastNumber = 1;
        } else {
            $lastNumber = $sequence->last_number + 1;
            DB::table('student_number_sequences')
                ->where('year_prefix', $currentYear)
                ->update(['last_number' => $lastNumber, 'updated_at' => now()]);
        }

        return $currentYear.'-'.str_pad($lastNumber, 5, '0', STR_PAD_LEFT);
    }

    // view
    public function index(Request $request)
    {
        try {
            $this->checkAccess(Auth::user());
            $query = Student::with(['academic.strand', 'academic.section', 'profile', 'family', 'requirement']);

            if ($search = $request->search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('lrn', 'like', "%{$search}%")
                        ->orWhere('student_number', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $perPage = $request->per_page ?? 10;

            return response()->json($query->latest()->paginate($perPage));

        } catch (\Throwable $e) {
            Log::error('StudentController index Error: '.$e->getMessage());

            return response()->json(['message' => 'Failed to load students: '.$e->getMessage()], 500);
        }
    }

    // create
    public function store(Request $request)
    {
        try {
            $this->checkAccess(Auth::user());

            $validated = $request->validate([
                'student_number' => 'nullable|string|unique:students,student_number',
                'lrn' => 'required|digits:12|unique:students,lrn',
                'email' => 'required|email|unique:students,email',
                'last_name' => 'required|string|max:255',
                'first_name' => 'required|string|max:255',
                'strand_id' => 'required|exists:strands,id',
                'date_of_birth' => 'required|date',
                'gender' => 'required|in:Male,Female',
                'civil_status' => 'required|string',
                'citizenship' => 'required|string',
                'religion' => 'required|string',
                'place_of_birth' => 'required|string',
                'contact_number' => 'required|digits:11',
                'home_address' => 'required|string',
                'guardian_name' => 'required|string',
                'guardian_occupation' => 'required|string',
                'guardian_contact' => 'required|digits:11',
                'grade_level' => 'required|in:11,12',
                'term' => 'required|in:1st,2nd,3rd',
                'school_year' => 'required|string',
                'learning_modality' => 'required|in:Face-to-Face,Modular',
                'general_average' => 'nullable|numeric|min:75|max:100',

                'file_psa' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_form137' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_good_moral' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_diploma' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_card' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_picture' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            ]);

            return DB::transaction(function () use ($request) {
                $finalStatus = strtolower($request->status ?? 'pending');
                $assignedStudentNumber = $request->student_number;

                if ($finalStatus === 'enrolled' && $request->filled('section_id')) {
                    $section = Section::where('id', $request->section_id)->lockForUpdate()->first();
                    if ($section && $section->students()->where('status', 'enrolled')->count() >= $section->capacity) {
                        return response()->json(['message' => 'FAILED: The selected section is FULL.'], 422);
                    }
                }

                if (empty($assignedStudentNumber)) {
                    if ($finalStatus === 'enrolled') {
                        $assignedStudentNumber = $this->generateUniqueStudentNumber();
                    } else {
                        $assignedStudentNumber = null;
                    }
                }

                $releasedBy = null;
                $releasedAt = null;

                if ($finalStatus === 'released') {
                    $admin = Auth::user();
                    $releasedBy = collect([$admin->first_name, $admin->middle_name, $admin->last_name, $admin->suffix])->filter()->implode(' ');
                    $releasedAt = now();
                }

                $student = Student::create([
                    'student_number' => $assignedStudentNumber,
                    'lrn' => $request->lrn,
                    'first_name' => $request->first_name,
                    'last_name' => $request->last_name,
                    'middle_name' => $request->middle_name,
                    'suffix' => $request->suffix,
                    'email' => $request->email,
                    'contact_number' => $request->contact_number,
                    'status' => $finalStatus,
                    'released_by' => $releasedBy,
                    'released_at' => $releasedAt,
                ]);

                $student->profile()->create($request->only(['date_of_birth', 'gender', 'place_of_birth', 'citizenship', 'civil_status', 'religion', 'home_address', 'provincial_address']));

                $student->academic()->create([
                    'current_school_attended' => $request->current_school_attended,
                    'strand_id' => $request->strand_id,
                    'section_id' => $request->section_id,
                    'grade_level' => $request->grade_level,
                    'term' => $request->term,
                    'school_year' => $request->school_year,
                    'learning_modality' => $request->learning_modality,
                    'general_average' => $request->general_average,
                ]);

                $student->family()->create($request->only(['employer_name', 'employer_contact', 'father_name', 'father_occupation', 'father_contact', 'mother_name', 'mother_occupation', 'mother_contact', 'guardian_name', 'guardian_occupation', 'guardian_contact']));

                $folderName = $this->getFolderName($student);
                Storage::disk('public')->makeDirectory("students/{$folderName}");

                $filePaths = [];
                $fileMap = ['file_psa' => 'psa', 'file_form137' => 'form_137', 'file_good_moral' => 'good_moral', 'file_diploma' => 'diploma', 'file_card' => 'form_138', 'file_picture' => 'photo_2x2'];

                foreach ($fileMap as $requestKey => $dbKey) {
                    if ($request->hasFile($requestKey)) {
                        $file = $request->file($requestKey);
                        $filename = time().'_'.preg_replace('/[^A-Za-z0-9\-\.]/', '_', $file->getClientOriginalName());
                        $path = $file->storeAs("students/{$folderName}", $filename, 'public');
                        $filePaths[$dbKey] = $path;
                    }
                }

                $reqData = ['hard_copies' => json_decode($request->requirements, true) ?? []];
                $student->requirement()->create(array_merge($reqData, $filePaths));

                ActivityLog::create([
                    'user_id' => Auth::id(),
                    'action' => 'create',
                    'description' => "Enrolled new student: {$student->last_name}, {$student->first_name}",
                    'ip_address' => $request->ip(),
                ]);

                try {
                    Mail::to($student->email)->send(new StudentApplication($student));
                } catch (\Throwable $e) {
                    Log::warning('Email Failed to Send: '.$e->getMessage());
                }

                return response()->json([
                    'message' => 'Application submitted successfully!',
                    'student' => $student->load(['academic.section', 'academic.strand']),
                ], 201);
            });

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('StudentController store Error: '.$e->getMessage());

            return response()->json(['message' => 'Backend Error: '.$e->getMessage()], 500);
        }
    }

    // update
    public function update(Request $request, $id)
    {
        try {
            $this->checkAccess(Auth::user());

            $request->validate([
                'student_number' => 'nullable|string|unique:students,student_number,'.$id,
                'lrn' => 'required|digits:12|unique:students,lrn,'.$id,
                'email' => 'required|email|unique:students,email,'.$id,
                'last_name' => 'required|string|max:255',
                'first_name' => 'required|string|max:255',
                'strand_id' => 'required|exists:strands,id',
                'date_of_birth' => 'required|date',
                'gender' => 'required|in:Male,Female',
                'contact_number' => 'required|digits:11',
                'guardian_contact' => 'required|digits:11',
                'general_average' => 'nullable|numeric|min:75|max:100',

                'file_psa' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_form137' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_good_moral' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_diploma' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_card' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'file_picture' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            ]);

            return DB::transaction(function () use ($request, $id) {
                $student = Student::with(['profile', 'academic', 'family', 'requirement'])->findOrFail($id);
                $oldFolderName = $this->getFolderName($student);
                $finalStatus = strtolower($request->status ?? $student->status);
                $assignedStudentNumber = $request->student_number;

                if ($finalStatus === 'enrolled' && $request->filled('section_id') && $request->section_id != $student->academic->section_id) {
                    $section = Section::where('id', $request->section_id)->lockForUpdate()->first();
                    if ($section && $section->students()->where('status', 'enrolled')->count() >= $section->capacity) {
                        return response()->json(['message' => 'FAILED: Section is FULL.'], 422);
                    }
                }

                if (empty($assignedStudentNumber)) {
                    if ($finalStatus === 'enrolled') {
                        $assignedStudentNumber = $this->generateUniqueStudentNumber();
                    } else {
                        $assignedStudentNumber = null;
                    }
                }

                $releasedBy = $student->released_by;
                $releasedAt = $student->released_at;

                if ($finalStatus === 'released') {
                    $admin = Auth::user();
                    $releasedBy = collect([$admin->first_name, $admin->middle_name, $admin->last_name, $admin->suffix])->filter()->implode(' ');
                    $releasedAt = now();
                } elseif ($finalStatus !== 'released' && $student->status === 'released') {
                    $releasedBy = null;
                    $releasedAt = null;
                }

                $student->update(array_merge($request->only(['lrn', 'first_name', 'last_name', 'middle_name', 'suffix', 'email', 'contact_number']), [
                    'status' => $finalStatus,
                    'student_number' => $assignedStudentNumber,
                    'released_by' => $releasedBy,
                    'released_at' => $releasedAt,
                ]));

                if ($student->profile) {
                    $student->profile->update($request->only(['date_of_birth', 'gender', 'place_of_birth', 'citizenship', 'civil_status', 'religion', 'home_address', 'provincial_address']));
                }
                if ($student->academic) {
                    $student->academic->update($request->only(['current_school_attended', 'strand_id', 'section_id', 'grade_level', 'term', 'school_year', 'learning_modality', 'general_average']));
                }
                if ($student->family) {
                    $student->family->update($request->only(['employer_name', 'employer_contact', 'father_name', 'father_occupation', 'father_contact', 'mother_name', 'mother_occupation', 'mother_contact', 'guardian_name', 'guardian_occupation', 'guardian_contact']));
                }

                $newFolderName = $this->getFolderName($student);
                if ($oldFolderName !== $newFolderName) {
                    if (Storage::disk('public')->exists("students/{$oldFolderName}")) {
                        Storage::disk('public')->move("students/{$oldFolderName}", "students/{$newFolderName}");
                    } else {
                        Storage::disk('public')->makeDirectory("students/{$newFolderName}");
                    }
                }

                $filePaths = [];
                $fileMap = ['file_psa' => 'psa', 'file_form137' => 'form_137', 'file_good_moral' => 'good_moral', 'file_diploma' => 'diploma', 'file_card' => 'form_138', 'file_picture' => 'photo_2x2'];

                foreach ($fileMap as $requestKey => $dbKey) {
                    if ($request->hasFile($requestKey)) {
                        $file = $request->file($requestKey);
                        $filename = time().'_'.preg_replace('/[^A-Za-z0-9\-\.]/', '_', $file->getClientOriginalName());
                        $path = $file->storeAs("students/{$newFolderName}", $filename, 'public');
                        $filePaths[$dbKey] = $path;
                    }
                }

                $reqData = ['hard_copies' => json_decode($request->requirements, true) ?? []];
                $student->requirement()->updateOrCreate(['student_id' => $student->id], array_merge($reqData, $filePaths));

                ActivityLog::create([
                    'user_id' => Auth::id(), 'action' => 'update', 'description' => "Updated record of: {$student->last_name}", 'ip_address' => $request->ip(),
                ]);

                try {
                    Mail::to($student->email)->send(new StudentUpdated($student, ['Profile' => 'Data Updated by Admin']));
                } catch (\Throwable $e) {
                }

                return response()->json([
                    'message' => 'Student updated successfully.',
                    'student' => $student->load(['academic.section', 'academic.strand']),
                ]);
            });

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('StudentController update Error: '.$e->getMessage());

            return response()->json(['message' => 'Backend Error: '.$e->getMessage()], 500);
        }
    }

    // change status
    public function changeStatus(Request $request, $id)
    {
        try {
            $this->checkAccess(Auth::user());

            return DB::transaction(function () use ($request, $id) {
                $student = Student::with('academic')->findOrFail($id);
                $newStatus = strtolower($request->status);

                if ($newStatus === 'enrolled' && $student->academic->section_id) {
                    $section = Section::where('id', $student->academic->section_id)->lockForUpdate()->first();
                    if ($section && $section->students()->where('status', 'enrolled')->count() >= $section->capacity) {
                        return response()->json(['message' => 'FAILED: Section is FULL.'], 422);
                    }
                }

                if ($newStatus !== 'reset') {
                    $student->update(['previous_status' => $student->status]);
                }

                $mailChanges = ['Status' => strtoupper($newStatus)];

                if ($newStatus === 'cleared' && $student->academic) {
                    $acad = $student->academic;
                    $acad->update(['previous_level' => $acad->grade_level, 'previous_term' => $acad->term]);

                    if ($acad->grade_level == '11' && $acad->term == '1st Term') {
                        $acad->update(['term' => '2nd Term']);
                        $newStatus = 'enrolled';
                    } elseif ($acad->grade_level == '11' && $acad->term == '2nd Term') {
                        $acad->update(['term' => '3rd Term']);
                        $newStatus = 'enrolled';
                    } elseif ($acad->grade_level == '11' && $acad->term == '3rd Term') {
                        $acad->update(['grade_level' => '12', 'term' => '1st Term', 'section_id' => null]);
                        $newStatus = 'pending';
                    } elseif ($acad->grade_level == '12' && $acad->term == '1st Term') {
                        $acad->update(['term' => '2nd Term']);
                        $newStatus = 'enrolled';
                    } elseif ($acad->grade_level == '12' && $acad->term == '2nd Term') {
                        $acad->update(['term' => '3rd Term']);
                        $newStatus = 'enrolled';
                    } elseif ($acad->grade_level == '12' && $acad->term == '3rd Term') {
                        $newStatus = 'graduate';
                    }

                    $mailChanges['Grade Level'] = $acad->grade_level;
                    $mailChanges['Term'] = $acad->term;
                }

                $updateData = [];

                if ($newStatus === 'reset') {
                    $newStatus = $student->previous_status ?? 'pending';
                    $updateData = ['status' => $newStatus, 'released_by' => null, 'released_at' => null];
                } elseif ($newStatus === 'released') {
                    $updateData = ['status' => 'released', 'released_by' => Auth::user()->name, 'released_at' => now()];
                } else {
                    $updateData = ['status' => $newStatus];
                }

                if ($newStatus === 'enrolled' && empty($student->student_number)) {
                    $updateData['student_number'] = $this->generateUniqueStudentNumber();
                }

                $student->update($updateData);

                ActivityLog::create(['user_id' => Auth::id(), 'action' => 'update', 'description' => "Changed status of {$student->last_name} to ".strtoupper($newStatus), 'ip_address' => $request->ip()]);
                try {
                    Mail::to($student->email)->send(new StudentUpdated($student, $mailChanges));
                } catch (\Throwable $e) {
                }

                return response()->json(['message' => 'Status updated successfully.']);
            });

        } catch (\Throwable $e) {
            Log::error('StudentController changeStatus Error: '.$e->getMessage());

            return response()->json(['message' => 'Backend Error: '.$e->getMessage()], 500);
        }
    }

    // single delete
    public function destroy($id)
    {
        try {
            $this->checkAccess(Auth::user());
            $student = Student::find($id);
            if (! $student) {
                return response()->json(['message' => 'Deletion Failed: Student record not found or was already removed.'], 404);
            }

            $name = trim("{$student->last_name}, {$student->first_name}");
            $student->delete();

            ActivityLog::create(['user_id' => Auth::id(), 'action' => 'delete', 'description' => "Deleted student record: {$name}", 'ip_address' => request()->ip()]);

            return response()->json(['message' => 'Student record has been successfully deleted.']);
        } catch (\Throwable $e) {
            Log::error('StudentController destroy Error: '.$e->getMessage());

            return response()->json(['message' => 'Backend Error: '.$e->getMessage()], 500);
        }
    }

    // bulk delete
    public function bulkDelete(Request $request)
    {
        try {
            $this->checkAccess(Auth::user());
            $request->validate(['ids' => 'required|array|max:50', 'ids.*' => 'exists:students,id']);

            $students = Student::whereIn('id', $request->ids)->get();
            $deletedCount = 0;

            foreach ($students as $student) {
                $name = "{$student->last_name}, {$student->first_name}";
                $student->delete();
                $deletedCount++;
                ActivityLog::create(['user_id' => Auth::id(), 'action' => 'delete', 'description' => "Bulk Deleted student: {$name}", 'ip_address' => $request->ip()]);
            }

            return response()->json(['message' => "Successfully deleted {$deletedCount} student(s)."]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('StudentController bulkDelete Error: '.$e->getMessage());

            return response()->json(['message' => 'Backend Error: '.$e->getMessage()], 500);
        }
    }

    // import
    public function importStudents(Request $request)
    {
        try {
            $this->checkAccess(Auth::user());
            $request->validate(['file' => 'required|file|mimes:csv,txt|max:2048']);

            $file = $request->file('file');
            $csvData = file_get_contents($file);
            $rows = array_map('str_getcsv', explode("\n", trim($csvData)));

            if (count($rows) < 2) {
                return response()->json(['message' => 'CSV is empty.'], 422);
            }

            $header = array_map('trim', array_shift($rows));
            $requiredHeaders = ['lrn', 'first_name', 'last_name', 'email', 'contact_number'];

            if (array_diff($requiredHeaders, $header)) {
                return response()->json(['message' => 'Missing required columns.'], 422);
            }

            $importedCount = 0;

            DB::transaction(function () use ($rows, $header, &$importedCount) {
                foreach ($rows as $row) {
                    if (count($header) !== count($row)) {
                        continue;
                    }
                    $data = array_combine($header, $row);

                    $validator = Validator::make($data, [
                        'lrn' => 'required|digits:12|unique:students,lrn',
                        'email' => 'required|email|unique:students,email',
                        'last_name' => 'required',
                        'first_name' => 'required',
                    ]);

                    if ($validator->fails()) {
                        continue;
                    }

                    $student = Student::create([
                        'lrn' => $data['lrn'],
                        'first_name' => $data['first_name'],
                        'last_name' => $data['last_name'],
                        'email' => $data['email'],
                        'contact_number' => $data['contact_number'] ?? 'N/A',
                        'status' => 'pending',
                    ]);

                    $student->profile()->create(['date_of_birth' => now(), 'gender' => 'Male', 'place_of_birth' => 'N/A', 'citizenship' => 'Filipino', 'civil_status' => 'Single', 'religion' => 'N/A', 'home_address' => 'N/A']);
                    $student->academic()->create(['strand_id' => Strand::first()->id ?? null, 'grade_level' => '11', 'term' => '1st Term', 'school_year' => '2026-2027']);
                    $student->family()->create([]);
                    $student->requirement()->create(['hard_copies' => []]);

                    $folderName = $this->getFolderName($student);
                    Storage::disk('public')->makeDirectory("students/{$folderName}");

                    $importedCount++;
                }
            });

            return response()->json(['message' => "Successfully imported {$importedCount} students."]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('StudentController import Error: '.$e->getMessage());

            return response()->json(['message' => 'Backend Error: '.$e->getMessage()], 500);
        }
    }
}
