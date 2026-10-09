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
use Illuminate\Support\Facades\File;
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
        return trim($student->lrn);
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

                if ($finalStatus === 'graduate' && ($request->grade_level != '12' || $request->term != '3rd')) {
                    return response()->json([
                        'errors' => [
                            'status' => ['A student can only be marked as GRADUATE if their Grade Level is 12 and Term is 3rd.'],
                        ],
                    ], 422);
                }

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
                    'previous_status' => null,
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

            return DB::transaction(function () use ($request, $id) {
                $student = Student::with(['profile', 'academic', 'family', 'requirement'])->findOrFail($id);

                $oldFolderName = $this->getFolderName($student);
                $finalStatus = strtolower($request->status ?? $student->status);
                $currentStatus = strtolower($student->status);

                if ($finalStatus === 'graduate' && ($request->grade_level != '12' || $request->term != '3rd')) {
                    return response()->json([
                        'errors' => [
                            'status' => ['A student can only be marked as GRADUATE if their Grade Level is 12 and Term is 3rd.'],
                        ],
                    ], 422);
                }

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
                } elseif ($finalStatus !== 'released' && strtolower($student->status) === 'released') {
                    $releasedBy = null;
                    $releasedAt = null;
                }

                $changesArray = [];

                // Track Core Student Changes
                $studentUpdateData = [
                    'status' => $finalStatus,
                    'student_number' => $assignedStudentNumber,
                    'released_by' => $releasedBy,
                    'released_at' => $releasedAt,
                ];

                if ($currentStatus !== $finalStatus) {
                    $studentUpdateData['previous_status'] = $currentStatus;
                }

                $student->fill(array_merge($request->only(['lrn', 'first_name', 'last_name', 'middle_name', 'suffix', 'email', 'contact_number']), $studentUpdateData));

                foreach ($student->getDirty() as $key => $newValue) {
                    if (! in_array($key, ['updated_at', 'released_by', 'released_at', 'previous_status'])) { // Added previous_status here to prevent showing in email
                        $changesArray[$key] = [
                            'old' => $student->getOriginal($key) ?? 'None',
                            'new' => $newValue ?? 'None',
                        ];
                    }
                }
                $student->save();

                // Track Profile Changes
                if ($student->profile) {
                    $student->profile->fill($request->only(['date_of_birth', 'gender', 'place_of_birth', 'citizenship', 'civil_status', 'religion', 'home_address', 'provincial_address']));
                    foreach ($student->profile->getDirty() as $key => $newValue) {
                        if ($key !== 'updated_at') {
                            $changesArray[$key] = ['old' => $student->profile->getOriginal($key) ?? 'None', 'new' => $newValue ?? 'None'];
                        }
                    }
                    $student->profile->save();
                }

                // Track Academic Changes
                if ($student->academic) {
                    $student->academic->fill($request->only(['current_school_attended', 'strand_id', 'section_id', 'grade_level', 'term', 'school_year', 'learning_modality', 'general_average']));
                    foreach ($student->academic->getDirty() as $key => $newValue) {
                        if ($key !== 'updated_at') {
                            $oldValue = $student->academic->getOriginal($key);

                            if ($key === 'strand_id') {
                                $oldStrand = Strand::find($oldValue);
                                $newStrand = Strand::find($newValue);
                                $changesArray['Strand'] = [
                                    'old' => $oldStrand ? $oldStrand->code : 'None',
                                    'new' => $newStrand ? $newStrand->code : 'None',
                                ];
                            } elseif ($key === 'section_id') {
                                $oldSection = Section::find($oldValue);
                                $newSection = Section::find($newValue);
                                $changesArray['Section'] = [
                                    'old' => $oldSection ? $oldSection->name : 'None',
                                    'new' => $newSection ? $newSection->name : 'None',
                                ];
                            } else {
                                $changesArray[$key] = ['old' => $oldValue ?? 'None', 'new' => $newValue ?? 'None'];
                            }
                        }
                    }
                    $student->academic->save();
                }

                // Track Family Changes
                if ($student->family) {
                    $student->family->fill($request->only(['employer_name', 'employer_contact', 'father_name', 'father_occupation', 'father_contact', 'mother_name', 'mother_occupation', 'mother_contact', 'guardian_name', 'guardian_occupation', 'guardian_contact']));
                    foreach ($student->family->getDirty() as $key => $newValue) {
                        if ($key !== 'updated_at') {
                            $changesArray[$key] = ['old' => $student->family->getOriginal($key) ?? 'None', 'new' => $newValue ?? 'None'];
                        }
                    }
                    $student->family->save();
                }

                // Directory rename
                $newFolderName = $this->getFolderName($student);

                if ($oldFolderName !== $newFolderName) {
                    $oldPathAbs = storage_path("app/public/students/{$oldFolderName}");
                    $newPathAbs = storage_path("app/public/students/{$newFolderName}");

                    if (file_exists($oldPathAbs) && is_dir($oldPathAbs)) {
                        if (strtolower($oldFolderName) === strtolower($newFolderName)) {
                            $tempPathAbs = storage_path('app/public/students/temp_'.time());
                            @rename($oldPathAbs, $tempPathAbs);
                            @rename($tempPathAbs, $newPathAbs);
                        } else {
                            if (file_exists($newPathAbs)) {
                                $files = glob($oldPathAbs.'/*');
                                foreach ($files as $file) {
                                    if (is_file($file)) {
                                        @rename($file, $newPathAbs.DIRECTORY_SEPARATOR.basename($file));
                                    }
                                }
                                @rmdir($oldPathAbs);
                            } else {
                                if (! @rename($oldPathAbs, $newPathAbs)) {
                                    File::copyDirectory($oldPathAbs, $newPathAbs);
                                    File::deleteDirectory($oldPathAbs);
                                }
                            }
                        }
                    } elseif (! file_exists($newPathAbs)) {
                        mkdir($newPathAbs, 0777, true);
                    }

                    if ($student->requirement) {
                        $reqUpdate = [];
                        $fileCols = ['psa', 'form_137', 'good_moral', 'diploma', 'form_138', 'photo_2x2'];
                        foreach ($fileCols as $col) {
                            if (! empty($student->requirement->$col)) {
                                $reqUpdate[$col] = str_replace("students/{$oldFolderName}", "students/{$newFolderName}", $student->requirement->$col);
                            }
                        }
                        if (! empty($reqUpdate)) {
                            $student->requirement->update($reqUpdate);
                        }
                    }
                } else {
                    $pathAbs = storage_path("app/public/students/{$newFolderName}");
                    if (! file_exists($pathAbs)) {
                        mkdir($pathAbs, 0777, true);
                    }
                }

                $student->refresh();
                $student->load('requirement');

                // Hard delete existing files removed via 'Delete Icon' button
                $removedFiles = json_decode($request->removed_files, true) ?? [];
                $reqUpdateAfterRemoval = [];
                if (! empty($removedFiles) && $student->requirement) {
                    foreach ($removedFiles as $dbKey) {
                        if (in_array($dbKey, ['psa', 'form_137', 'good_moral', 'diploma', 'form_138', 'photo_2x2'])) {
                            if (! empty($student->requirement->$dbKey)) {

                                $cleanPath = ltrim($student->requirement->$dbKey, '/');
                                $fullPath = storage_path('app'.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $cleanPath));

                                if (file_exists($fullPath)) {
                                    @chmod($fullPath, 0777);
                                    @unlink($fullPath);
                                }

                                $reqUpdateAfterRemoval[$dbKey] = null;
                            }
                        }
                    }
                    if (! empty($reqUpdateAfterRemoval)) {
                        $student->requirement->update($reqUpdateAfterRemoval);
                        $changesArray['Uploaded Files'] = ['old' => 'Existing Attachments', 'new' => 'Some attachments were removed'];
                    }
                }

                $student->refresh();
                $student->load('requirement');

                // Upload new files and hard delete replaced ones
                $filePaths = [];
                $fileMap = ['file_psa' => 'psa', 'file_form137' => 'form_137', 'file_good_moral' => 'good_moral', 'file_diploma' => 'diploma', 'file_card' => 'form_138', 'file_picture' => 'photo_2x2'];
                $hasNewFiles = false;

                foreach ($fileMap as $requestKey => $dbKey) {
                    if ($request->hasFile($requestKey)) {
                        $hasNewFiles = true;

                        if ($student->requirement && ! empty($student->requirement->$dbKey)) {
                            $oldFilePath = $student->requirement->$dbKey;

                            $cleanPath = ltrim($oldFilePath, '/');
                            $fullPath = storage_path('app'.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $cleanPath));

                            if (file_exists($fullPath)) {
                                @chmod($fullPath, 0777);
                                @unlink($fullPath);
                            }
                        }

                        $file = $request->file($requestKey);
                        $filename = time().'_'.preg_replace('/[^A-Za-z0-9\-\.]/', '_', $file->getClientOriginalName());
                        $path = $file->storeAs("students/{$newFolderName}", $filename, 'public');
                        $filePaths[$dbKey] = $path;
                    }
                }

                // Track Document Checkbox Changes safely
                $reqData = ['hard_copies' => json_decode($request->requirements, true) ?? []];
                if ($student->requirement) {
                    $oldReqs = $student->requirement->hard_copies ?? [];
                    $newReqs = $reqData['hard_copies'];

                    $oldNormalized = array_map(function ($val) {
                        return filter_var($val, FILTER_VALIDATE_BOOLEAN);
                    }, $oldReqs);
                    $newNormalized = array_map(function ($val) {
                        return filter_var($val, FILTER_VALIDATE_BOOLEAN);
                    }, $newReqs);

                    ksort($oldNormalized);
                    ksort($newNormalized);

                    if (json_encode($oldNormalized) !== json_encode($newNormalized)) {
                        $changesArray['Document Status'] = ['old' => 'Pending Verification', 'new' => 'Updated by Registrar'];
                    }
                }

                if ($hasNewFiles) {
                    $changesArray['Uploaded Files'] = ['old' => 'Previous Attachments', 'new' => 'New Attachments Uploaded'];
                }

                $student->requirement()->updateOrCreate(['student_id' => $student->id], array_merge($reqData, $filePaths));
                $student->refresh();
                $student->load(['profile', 'academic.section', 'academic.strand', 'family', 'requirement']);

                ActivityLog::create([
                    'user_id' => Auth::id(),
                    'action' => 'update',
                    'description' => "Updated record of: {$student->last_name}",
                    'ip_address' => $request->ip(),
                ]);

                if (! empty($changesArray)) {
                    try {
                        Mail::to($student->email)->send(new StudentUpdated($student, $changesArray));
                    } catch (\Throwable $e) {
                        Log::warning('Email Failed to Send: '.$e->getMessage());
                    }
                }

                return response()->json([
                    'message' => 'Student updated successfully.',
                    'student' => $student,
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
                $student = Student::with(['academic.section', 'academic.strand'])->findOrFail($id);
                $newStatus = strtolower($request->status);
                $currentStatus = strtolower($student->status);
                $mailChanges = [];

                if ($newStatus === 'graduate' && ($student->academic->grade_level != '12' || $student->academic->term != '3rd')) {
                    return response()->json([
                        'message' => 'A student can only be marked as GRADUATE if their Grade Level is 12 and Term is 3rd.',
                    ], 422);
                }

                if ($newStatus === 'enrolled' && $student->academic->section_id) {
                    $section = Section::where('id', $student->academic->section_id)->lockForUpdate()->first();
                    if ($section && $section->students()->where('status', 'enrolled')->count() >= $section->capacity) {
                        return response()->json(['message' => 'FAILED: Section is FULL.'], 422);
                    }
                }

                if ($newStatus === 'cleared' && $student->academic) {
                    $acad = $student->academic;
                    $oldGrade = $acad->grade_level;
                    $oldTerm = $acad->term;

                    if ($oldGrade == '11' && $oldTerm == '1st') {
                        $acad->update(['term' => '2nd']);
                        $newStatus = 'enrolled';
                    } elseif ($oldGrade == '11' && $oldTerm == '2nd') {
                        $acad->update(['term' => '3rd']);
                        $newStatus = 'enrolled';
                    } elseif ($oldGrade == '11' && $oldTerm == '3rd') {
                        $acad->update(['grade_level' => '12', 'term' => '1st', 'section_id' => null]);
                        $newStatus = 'pending';
                    } elseif ($oldGrade == '12' && $oldTerm == '1st') {
                        $acad->update(['term' => '2nd']);
                        $newStatus = 'enrolled';
                    } elseif ($oldGrade == '12' && $oldTerm == '2nd') {
                        $acad->update(['term' => '3rd']);
                        $newStatus = 'enrolled';
                    } elseif ($oldGrade == '12' && $oldTerm == '3rd') {
                        $newStatus = 'graduate';
                    }

                    $acad->refresh();

                    if ($oldGrade !== $acad->grade_level) {
                        $mailChanges['Grade Level'] = ['old' => "Grade $oldGrade", 'new' => "Grade {$acad->grade_level}"];
                    }
                    if ($oldTerm !== $acad->term) {
                        $mailChanges['Term'] = ['old' => "$oldTerm Term", 'new' => "{$acad->term} Term"];
                    }
                }

                $updateData = [];

                if ($newStatus === 'reset') {
                    $newStatus = $student->previous_status ?? 'pending';
                    $updateData['status'] = $newStatus;

                    if ($currentStatus === 'released') {
                        $updateData['released_by'] = null;
                        $updateData['released_at'] = null;
                    }
                } elseif ($newStatus === 'released') {
                    $admin = Auth::user();

                    $releasedByName = trim(($admin->first_name ?? '').' '.($admin->last_name ?? ''));
                    if (empty($releasedByName)) {
                        $releasedByName = $admin->name ?? 'Admin Staff';
                    }

                    $updateData['status'] = 'released';
                    $updateData['released_by'] = $releasedByName;
                    $updateData['released_at'] = now();

                    $mailChanges['Released By'] = ['old' => 'None', 'new' => $releasedByName];
                } else {
                    $updateData['status'] = $newStatus;

                    if ($currentStatus === 'released') {
                        $updateData['released_by'] = null;
                        $updateData['released_at'] = null;
                    }
                }

                // Handle Student Number auto-generation
                if ($newStatus === 'enrolled' && empty($student->student_number)) {
                    $assignedNumber = $this->generateUniqueStudentNumber();
                    $updateData['student_number'] = $assignedNumber;
                    $mailChanges['Student Number'] = ['old' => 'None', 'new' => $assignedNumber];
                }

                if ($currentStatus !== $newStatus) {
                    $mailChanges['Status'] = ['old' => strtoupper($currentStatus), 'new' => strtoupper($newStatus)];

                    if ($request->status !== 'reset') {
                        $updateData['previous_status'] = $currentStatus;
                    }
                }

                $student->update($updateData);
                $student->refresh();
                $student->load(['academic.section', 'academic.strand']);

                ActivityLog::create([
                    'user_id' => Auth::id(),
                    'action' => 'update',
                    'description' => "Changed status of {$student->last_name} to ".strtoupper($newStatus),
                    'ip_address' => $request->ip(),
                ]);

                if (strtolower($request->status) !== 'reset') {
                    try {
                        Mail::to($student->email)->send(new StudentUpdated($student, $mailChanges));
                    } catch (\Throwable $e) {
                        Log::warning('Email Failed to Send in changeStatus: '.$e->getMessage());
                    }
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

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'delete',
                'description' => "Deleted student record: {$name}",
                'ip_address' => request()->ip(),
            ]);

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
                ActivityLog::create([
                    'user_id' => Auth::id(),
                    'action' => 'delete',
                    'description' => "Bulk Deleted student: {$name}",
                    'ip_address' => $request->ip(),
                ]);
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

            $request->validate([
                'file' => 'required|file|mimes:csv,txt|max:2048',
            ]);

            $file = $request->file('file');
            $csvData = file_get_contents($file);
            $rows = array_map('str_getcsv', explode("\n", trim($csvData)));

            if (count($rows) < 2) {
                return response()->json(['message' => 'CSV is empty or missing headers.'], 422);
            }

            $header = array_map('trim', array_shift($rows));

            $requiredHeaders = [
                'student_number', 'lrn', 'first_name', 'last_name', 'middle_name', 'suffix', 'email', 'contact_number', 'status',
                'date_of_birth', 'gender', 'place_of_birth', 'citizenship', 'civil_status', 'religion', 'home_address', 'provincial_address',
                'current_school_attended', 'strand_code', 'section_name', 'grade_level', 'term', 'school_year', 'learning_modality', 'general_average',
                'employer_name', 'employer_contact', 'father_name', 'father_occupation', 'father_contact',
                'mother_name', 'mother_occupation', 'mother_contact', 'guardian_name', 'guardian_occupation', 'guardian_contact',
            ];

            // Check if all exact columns are present
            $missingHeaders = array_diff($requiredHeaders, $header);
            if (! empty($missingHeaders)) {
                return response()->json([
                    'message' => 'CSV Format is incorrect. Missing required columns.',
                    'missing_columns' => array_values($missingHeaders),
                ], 422);
            }

            $importedCount = 0;

            DB::transaction(function () use ($rows, $header, &$importedCount) {
                $rowNumber = 2;

                foreach ($rows as $row) {
                    if (count($header) !== count($row)) {
                        throw new \Exception("Row {$rowNumber}: Missing or extra columns in this row.");
                    }

                    $data = array_combine($header, array_map('trim', $row));

                    $data = array_map(function ($value) {
                        return $value === '' ? null : $value;
                    }, $data);

                    if (isset($data['status'])) {
                        $data['status'] = strtolower($data['status']);
                    }

                    // validation
                    $validator = Validator::make($data, [
                        'student_number' => 'nullable|string|unique:students,student_number',
                        'lrn' => 'required|digits:12|unique:students,lrn',
                        'first_name' => 'required|string|max:255',
                        'last_name' => 'required|string|max:255',
                        'email' => 'required|email|unique:students,email',
                        'contact_number' => 'required|digits:11',
                        'status' => 'required|in:pending,enrolled,on hold,graduate,drop out,released',
                        'date_of_birth' => 'required|date',
                        'gender' => 'required|in:Male,Female',
                        'grade_level' => 'required|in:11,12',
                        'term' => 'required|in:1st,2nd,3rd',
                        'learning_modality' => 'required|in:Face-to-Face,Modular',
                        'general_average' => 'nullable|numeric|min:75|max:100',
                        'employer_contact' => 'nullable|digits:11',
                        'father_contact' => 'nullable|digits:11',
                        'mother_contact' => 'nullable|digits:11',
                        'guardian_name' => 'required|string',
                        'guardian_contact' => 'required|digits:11',
                    ]);

                    if ($validator->fails()) {
                        throw new \Exception("Row {$rowNumber}: ".implode(', ', $validator->errors()->all()));
                    }

                    // Map Strand Code and Section Name
                    $strand = Strand::where('code', $data['strand_code'])->first();
                    if (! $strand) {
                        throw new \Exception("Row {$rowNumber}: Strand Code '{$data['strand_code']}' not found in the database.");
                    }

                    $sectionId = null;
                    if ($data['section_name'] !== null) {
                        $section = Section::where('name', $data['section_name'])->first();
                        $sectionId = $section ? $section->id : null;
                    }

                    // Core Students
                    $student = Student::create([
                        'student_number' => $data['student_number'],
                        'lrn' => $data['lrn'],
                        'first_name' => $data['first_name'],
                        'last_name' => $data['last_name'],
                        'middle_name' => $data['middle_name'],
                        'suffix' => $data['suffix'],
                        'email' => $data['email'],
                        'contact_number' => $data['contact_number'],
                        'status' => $data['status'],
                        'previous_status' => null,
                        'released_by' => null,
                        'released_at' => null,
                    ]);

                    // Profiles
                    $student->profile()->create([
                        'date_of_birth' => $data['date_of_birth'],
                        'gender' => $data['gender'],
                        'place_of_birth' => $data['place_of_birth'],
                        'citizenship' => $data['citizenship'],
                        'civil_status' => $data['civil_status'],
                        'religion' => $data['religion'],
                        'home_address' => $data['home_address'],
                        'provincial_address' => $data['provincial_address'],
                    ]);

                    // Academics
                    $student->academic()->create([
                        'current_school_attended' => $data['current_school_attended'],
                        'strand_id' => $strand->id,
                        'section_id' => $sectionId,
                        'grade_level' => $data['grade_level'],
                        'term' => $data['term'],
                        'school_year' => $data['school_year'],
                        'learning_modality' => $data['learning_modality'],
                        'general_average' => $data['general_average'],
                    ]);

                    // Families
                    $student->family()->create([
                        'employer_name' => $data['employer_name'],
                        'employer_contact' => $data['employer_contact'],
                        'father_name' => $data['father_name'],
                        'father_occupation' => $data['father_occupation'],
                        'father_contact' => $data['father_contact'],
                        'mother_name' => $data['mother_name'],
                        'mother_occupation' => $data['mother_occupation'],
                        'mother_contact' => $data['mother_contact'],
                        'guardian_name' => $data['guardian_name'],
                        'guardian_occupation' => $data['guardian_occupation'],
                        'guardian_contact' => $data['guardian_contact'],
                    ]);

                    // Requirements
                    $student->requirement()->create([
                        'hard_copies' => [],
                        'psa' => null,
                        'form_137' => null,
                        'good_moral' => null,
                        'diploma' => null,
                        'form_138' => null,
                        'photo_2x2' => null,
                    ]);

                    $folderName = $this->getFolderName($student);
                    Storage::disk('public')->makeDirectory("students/{$folderName}");

                    $importedCount++;
                    $rowNumber++;
                }
            });

            if ($importedCount > 0) {
                ActivityLog::create([
                    'user_id' => Auth::id(),
                    'action' => 'import',
                    'description' => "Imported {$importedCount} student record(s) via CSV file.",
                    'ip_address' => $request->ip(),
                ]);
            }

            return response()->json(['message' => "Successfully imported {$importedCount} valid student records."]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('StudentController import Error: '.$e->getMessage());

            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
