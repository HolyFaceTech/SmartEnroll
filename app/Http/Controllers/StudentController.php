<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Section;
use App\Models\Strand;
use App\Models\EnrollmentSetting;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

// Mailables
use App\Mail\ApplicationReceived;
use App\Mail\StudentUpdated;
use App\Mail\EnrollmentInstruction;
use App\Mail\FailedAdvisory;

class StudentController extends Controller
{
    // view
    // 1. GET ALL STUDENTS (Server-Side Pagination & Search)
    public function index(Request $request)
    {
        $limit = $request->input('limit', 10);
        $search = $request->input('search', '');

        $query = Student::with(['strand', 'section'])->orderBy('created_at', 'desc');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                // String searches
                $q->where('student_number', 'like', "%{$search}%")
                  ->orWhere('lrn', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('middle_name', 'like', "%{$search}%")
                  ->orWhere('suffix', 'like', "%{$search}%")
                  ->orWhere('gender', 'like', "%{$search}%")
                  ->orWhere('citizenship', 'like', "%{$search}%")
                  ->orWhere('civil_status', 'like', "%{$search}%")
                  ->orWhere('religion', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('contact_number', 'like', "%{$search}%")
                  ->orWhere('current_school_attended', 'like', "%{$search}%")
                  ->orWhere('strand_id', 'like', "%{$search}%")
                  ->orWhereHas('strand', function ($subQ) use ($search) {
                      // Tinanggal ang 'name', 'code' at 'description' na lang
                      $subQ->where('code', 'like', "%{$search}%")
                           ->orWhere('description', 'like', "%{$search}%");
                  })
                  ->orWhere('section_id', 'like', "%{$search}%")
                  ->orWhereHas('section', function ($subQ) use ($search) {
                      $subQ->where('name', 'like', "%{$search}%");
                  })
                  ->orWhere('learning_modality', 'like', "%{$search}%")
                  ->orWhere('grade_level', 'like', "%{$search}%")
                  ->orWhere('term', 'like', "%{$search}%")
                  ->orWhere('school_year', 'like', "%{$search}%");

                // DECIMAL safe search (I-se-search lang sa general_average kung number ang tinype)
                if (is_numeric($search)) {
                    $q->orWhere('general_average', 'like', "%{$search}%");
                }
            });
        }

        return response()->json($query->paginate($limit));
    }

    // create
    public function store(Request $request)
    {
        return DB::transaction(function () use ($request) {
            $settings = EnrollmentSetting::lockForUpdate()->first();
            $activeSem = $settings ? $settings->term : '1st Term';
            $activeSY = $settings ? $settings->school_year : date('Y').'-'.(date('Y')+1);

            $request->validate([
                'lrn' => 'required|digits:12|unique:students,lrn',
                'email' => 'required|email|unique:students,email',
                'last_name' => 'required',
                'first_name' => 'required',
                'strand_id' => 'required',
                'date_of_birth' => 'required|date',
                'general_average' => 'required|numeric|min:75|max:100',
                'current_school_attended' => 'required',
                'status' => 'required|string',
                'contact_number' => ['required', 'regex:/^09\d{2}-\d{3}-\d{4}$/'],
                'guardian_name' => 'required',
                'guardian_occupation' => 'required',
                'guardian_contact' => ['required', 'regex:/^09\d{2}-\d{3}-\d{4}$/'],
                'father_contact' => ['nullable', 'regex:/^09\d{2}-\d{3}-\d{4}$/'],
                'mother_contact' => ['nullable', 'regex:/^09\d{2}-\d{3}-\d{4}$/'],
                'employer_contact' => ['nullable', 'regex:/^09\d{2}-\d{3}-\d{4}$/'],
                '2x2_picture' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'e_sign' => 'nullable|image|mimes:png|max:2048',
            ]);

            $data = $request->except(['2x2_picture', 'e_sign', 'age']);
            
            // Auto-override using settings for Create
            $data['term'] = $activeSem;
            $data['school_year'] = $activeSY;
            if (empty($data['section_id'])) $data['section_id'] = null;

            // STATUS LOGIC: RELEASED
            if ($data['status'] === 'released') {
                $data['released_by'] = Auth::check() ? Auth::user()->name : 'Admin';
                $data['released_at'] = now();
            }

            // STATUS LOGIC: ENROLLED (Generate Student Number if empty)
            if ($data['status'] === 'enrolled') {
                // Section Capacity Check
                if (!empty($data['section_id'])) {
                    $section = Section::where('id', $data['section_id'])->lockForUpdate()->first();
                    if ($section && $section->students()->where('status', 'enrolled')->count() >= $section->capacity) {
                        return response()->json(['message' => "FAILED: Section '{$section->name}' is FULL."], 422);
                    }
                }

                // Generate Student Number (Format: YY-00001)
                if (empty($data['student_number'])) {
                    $year = date('y');
                    $lastStudent = Student::where('student_number', 'like', "{$year}-%")->orderBy('student_number', 'desc')->first();
                    if ($lastStudent) {
                        $lastNumber = intval(substr($lastStudent->student_number, 3));
                        $data['student_number'] = $year . '-' . str_pad($lastNumber + 1, 5, '0', STR_PAD_LEFT);
                    } else {
                        $data['student_number'] = "{$year}-00001";
                    }
                }
            }

            // Custom File Naming variables
            $lastNameSafe = Str::slug($request->last_name);
            $firstNameSafe = Str::slug($request->first_name);
            $timestamp = time();

            // FILE UPLOADS WITH CUSTOM NAME
            if ($request->hasFile('2x2_picture')) {
                $ext = $request->file('2x2_picture')->getClientOriginalExtension();
                $fileName = "{$lastNameSafe}-{$firstNameSafe}-2x2-{$timestamp}.{$ext}";
                $data['2x2_picture'] = $request->file('2x2_picture')->storeAs('students/pictures', $fileName, 'public');
            }

            if ($request->hasFile('e_sign')) {
                $ext = $request->file('e_sign')->getClientOriginalExtension();
                $fileName = "{$lastNameSafe}-{$firstNameSafe}-esign-{$timestamp}.{$ext}";
                $data['e_sign'] = $request->file('e_sign')->storeAs('students/signatures', $fileName, 'public');
            }

            foreach ($data as $key => $value) {
                if ($value === "null" || $value === "") {
                    if (!in_array($key, ['requirements'])) {
                        $data[$key] = null;
                    }
                }
            }

            $student = Student::create($data);

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'create',
                'description' => "Enrolled new student: {$student->last_name}, {$student->first_name}",
                'ip_address' => $request->ip()
            ]);
            
            try { Mail::to($student->email)->send(new ApplicationReceived($student)); } 
            catch (\Exception $e) { Log::error("Email failed: " . $e->getMessage()); }

            return response()->json([
                'message' => 'Application submitted successfully!',
                'student' => $student
            ]);
        });
    }

    // 3. SHOW
    public function show($id)
    {
        return Student::with(['strand', 'section'])->findOrFail($id);
    }

    // update
    public function update(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $student = Student::findOrFail($id);

            $request->validate([
                'lrn' => 'required|digits:12|unique:students,lrn,'.$id,
                'email' => 'required|email|unique:students,email,'.$id,
                'last_name' => 'required',
                'first_name' => 'required',
                'strand_id' => 'required',
                'status' => 'required|string',
                'date_of_birth' => 'required|date',
                'general_average' => 'required|numeric|min:75|max:100',
                'current_school_attended' => 'required',
                'term' => 'required',
                'school_year' => ['required', 'regex:/^\d{4}-\d{4}$/'],
                'contact_number' => ['required', 'regex:/^09\d{2}-\d{3}-\d{4}$/'],
                'guardian_name' => 'required',
                'guardian_occupation' => 'required',
                'guardian_contact' => ['required', 'regex:/^09\d{2}-\d{3}-\d{4}$/'],
                'father_contact' => ['nullable', 'regex:/^09\d{2}-\d{3}-\d{4}$/'],
                'mother_contact' => ['nullable', 'regex:/^09\d{2}-\d{3}-\d{4}$/'],
                'employer_contact' => ['nullable', 'regex:/^09\d{2}-\d{3}-\d{4}$/'],
                '2x2_picture' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'e_sign' => 'nullable|image|mimes:png|max:2048',
            ]);

            $data = $request->except(['2x2_picture', 'e_sign', '_method', 'age']);

            // STATUS LOGIC: RELEASED
            if ($data['status'] === 'released' && $student->status !== 'released') {
                $releaserName = 'Admin';
                
                if (Auth::check()) {
                    $user = Auth::user();
                    $fname = $user->first_name ?? '';
                    $lname = $user->last_name ?? '';
                    $suffix = $user->suffix ?? '';
                    
                    $fullName = trim("{$fname} {$lname} {$suffix}");
                    $releaserName = !empty($fullName) ? $fullName : ($user->name ?? 'Admin');
                }

                $data['released_by'] = $releaserName;
                $data['released_at'] = now();
            }

            // STATUS LOGIC: ENROLLED
            if ($data['status'] === 'enrolled') {
                
                $settings = EnrollmentSetting::lockForUpdate()->first();

                // Generate Student Number if missing
                if (empty($student->student_number)) {
                    $year = date('y');
                    $lastStudent = Student::where('student_number', 'like', "{$year}-%")->orderBy('student_number', 'desc')->first();
                    if ($lastStudent) {
                        $lastNumber = intval(substr($lastStudent->student_number, 3));
                        $data['student_number'] = $year . '-' . str_pad($lastNumber + 1, 5, '0', STR_PAD_LEFT);
                    } else {
                        $data['student_number'] = "{$year}-00001";
                    }
                }

                // CAPACITY CHECK FOR SECTION ASSIGNMENT
                $isAssigningSection = !empty($data['section_id']) && $data['section_id'] != $student->section_id;
                $isEnrolling = $student->status !== 'enrolled';

                if (($isAssigningSection || $isEnrolling) && !empty($data['section_id'])) {
                    $section = Section::where('id', $data['section_id'])->lockForUpdate()->first();
                    if ($section && $section->students()->where('status', 'enrolled')->count() >= $section->capacity) {
                        return response()->json(['message' => "FAILED: Section '{$section->name}' is FULL."], 422);
                    }
                }
            }

            // Custom File Naming variables
            $lastNameSafe = Str::slug($data['last_name'] ?? $student->last_name);
            $firstNameSafe = Str::slug($data['first_name'] ?? $student->first_name);
            $timestamp = time();

            // FILE UPLOADS WITH CUSTOM NAME
            if ($request->hasFile('2x2_picture')) {
                if ($student->{'2x2_picture'}) Storage::disk('public')->delete($student->{'2x2_picture'});
                $ext = $request->file('2x2_picture')->getClientOriginalExtension();
                $fileName = "{$lastNameSafe}-{$firstNameSafe}-2x2-{$timestamp}.{$ext}";
                $data['2x2_picture'] = $request->file('2x2_picture')->storeAs('students/pictures', $fileName, 'public');
            }
            if ($request->hasFile('e_sign')) {
                if ($student->e_sign) Storage::disk('public')->delete($student->e_sign);
                $ext = $request->file('e_sign')->getClientOriginalExtension();
                $fileName = "{$lastNameSafe}-{$firstNameSafe}-esign-{$timestamp}.{$ext}";
                $data['e_sign'] = $request->file('e_sign')->storeAs('students/signatures', $fileName, 'public');
            }

            unset($data['id'], $data['created_at'], $data['updated_at'], $data['deleted_at'], $data['strand'], $data['section']);
            if (empty($data['section_id'])) $data['section_id'] = null;

            foreach ($data as $key => $value) {
                if ($value === "null" || $value === "") {
                    if (!in_array($key, ['requirements'])) {
                        $data[$key] = null;
                    }
                }
            }

            $student->fill($data);
            if ($student->isDirty()) {
                $student->save();
                ActivityLog::create([
                    'user_id' => Auth::id(), 'action' => 'update',
                    'description' => "Updated profile: {$student->last_name}", 'ip_address' => $request->ip()
                ]);
            }

            return response()->json([
                'message' => 'Student record updated successfully.',
                'student' => $student
            ]);
        });
    }

    // 5. CHANGE STATUS
    public function changeStatus(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $student = Student::findOrFail($id);
            $newStatus = $request->status;
            $oldStatus = $student->status; 
            $user = Auth::user(); 

            // RULE 3: KUNG RELEASED NA, BAWAL NANG PALITAN NG IBANG STATUS (EXCEPT RESET)
            if ($oldStatus === 'released' && $newStatus !== 'reset') {
                return response()->json([
                    'message' => "FAILED: Student is already released. Please 'Reset Status' first."
                ], 422);
            }

            // RULE 1 & RULE 4: RESET STATUS LOGIC
            if ($newStatus === 'reset') {
                $prev = $student->previous_status ?? 'pending';
                $updateData = ['status' => $prev];

                // RULE 4: Buburahin lang ang released_by at released_at 
                // KUNG ang previous status ay HINDI 'released'
                if ($oldStatus === 'released' && $prev !== 'released') {
                    $updateData['released_by'] = null;
                    $updateData['released_at'] = null;
                }

                $student->update($updateData);

                // ⭐ SENIOR DEV NOTE: Dahil may "return" tayo dito, HINDI na ito aabot sa 
                // email logic sa ibaba. Kaya ligtas na walang magsesend na email kahit 
                // 'passed' o 'failed' pa ang previous status niya.
                return response()->json(['message' => 'Status reset to ' . $prev]);
            }

            // I-SAVE ANG PREVIOUS STATUS BAGO MAG-UPDATE
            $student->update(['previous_status' => $oldStatus]);

            // CAPACITY CHECK FOR ENROLLED
            if ($newStatus === 'enrolled' && $oldStatus !== 'enrolled' && $student->section_id) {
                $section = Section::where('id', $student->section_id)->lockForUpdate()->first();
                if ($section && $section->students()->where('status', 'enrolled')->count() >= $section->capacity) {
                    return response()->json(['message' => "FAILED: Section is FULL."], 422);
                }
            }

            // EMAILS (PASSED / FAILED)
            if ($newStatus === 'passed') {
                try { Mail::to($student->email)->send(new EnrollmentInstruction($student)); } 
                catch (\Exception $e) { Log::error("Email failed: " . $e->getMessage()); }
            }

            if ($newStatus === 'failed') {
                try { Mail::to($student->email)->send(new FailedAdvisory($student)); } 
                catch (\Exception $e) { Log::error("Email failed: " . $e->getMessage()); }
            }

            // RULE 2: RELEASED LOGIC (FIRST NAME, LAST NAME, SUFFIX)
            if ($newStatus === 'released') {
                $releaserName = 'Admin';

                if ($user) {
                    // Kunin ang specific fields mula sa Auth user
                    $fname = $user->first_name ?? '';
                    $lname = $user->last_name ?? '';
                    $suffix = $user->suffix ?? '';
                    
                    // Pagsama-samahin (trim para walang extra space kung walang suffix)
                    $fullName = trim("{$fname} {$lname} {$suffix}");
                    
                    // Kung may laman ang fullname, yun ang gagamitin. Kung wala, fallback sa default name
                    $releaserName = !empty($fullName) ? $fullName : ($user->name ?? 'Admin');
                }

                $student->update([
                    'status' => 'released',
                    'released_by' => $releaserName,
                    'released_at' => now()
                ]);
                return response()->json(['message' => 'Record marked as Released.']);
            }

            // DEFAULT UPDATE FOR ALL OTHER STATUSES
            $student->update(['status' => $newStatus]);
            return response()->json(['message' => 'Status updated.']);
        });
    }

    // 6. DELETE
    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        $name = "{$student->last_name}, {$student->first_name}";
        
        // Burahin ang files kung meron
        if ($student->{'2x2_picture'}) Storage::disk('public')->delete($student->{'2x2_picture'});
        if ($student->e_sign) Storage::disk('public')->delete($student->e_sign);

        $student->delete();

        ActivityLog::create(['user_id' => Auth::id(), 'action' => 'delete', 'description' => "Deleted student: {$name}", 'ip_address' => request()->ip()]);
        return response()->json(['message' => 'Student record deleted.']);
    }

    // 7. BULK DELETE
    public function bulkDelete(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'exists:students,id']);
        if (empty($request->ids)) return response()->json(['message' => 'No valid students.'], 400);

        $students = Student::whereIn('id', $request->ids)->get();
        foreach($students as $student) {
            if ($student->{'2x2_picture'}) Storage::disk('public')->delete($student->{'2x2_picture'});
            if ($student->e_sign) Storage::disk('public')->delete($student->e_sign);
            $student->delete();
        }

        ActivityLog::create(['user_id' => Auth::id(), 'action' => 'delete', 'description' => "Bulk deleted " . count($request->ids) . " student(s).", 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Selected students deleted.']);
    }

    // 8. IMPORT CSV
    public function importCsv(Request $request)
    {
        $request->validate(['file' => 'required|mimes:csv,txt|max:2048']);
        $file = $request->file('file');
        $csvData = array_filter(array_map('str_getcsv', file($file->getRealPath())));
        array_shift($csvData);
        $count = 0;

        $settings = EnrollmentSetting::first();
        $activeSem = $settings ? $settings->term : '1st Term';
        $activeSY = $settings ? $settings->school_year : date('Y').'-'.(date('Y')+1);

        foreach ($csvData as $row) {
            if (count($row) < 5 || empty(trim($row[0]))) continue;

            $lrn = trim($row[0]);
            $student_number = trim($row[1] ?? '');
            $last_name = trim($row[2] ?? '');
            $first_name = trim($row[3] ?? '');
            $strand_code = trim($row[4] ?? '');
            
            if (empty($lrn) || empty($last_name) || empty($strand_code)) continue;

            $strand = Strand::where('code', 'LIKE', "%{$strand_code}%")->first();
            if (!$strand) continue;

            Student::updateOrCreate(
                ['lrn' => $lrn],
                [
                    'student_number' => empty($student_number) ? null : $student_number,
                    'last_name' => $last_name,
                    'first_name' => $first_name,
                    'strand_id' => $strand->id,
                    'term' => $activeSem,
                    'school_year' => $activeSY,
                    'date_of_birth' => '2000-01-01', // Fallback default
                    'age' => 16,
                    'gender' => 'Male',
                    'place_of_birth' => 'N/A',
                    'citizenship' => 'Filipino',
                    'civil_status' => 'Single',
                    'religion' => 'N/A',
                    'home_address' => 'N/A',
                    'email' => strtolower($first_name.$last_name).rand(10,99).'@example.com',
                    'contact_number' => '09000000000',
                    'grade_level' => '11',
                    'status' => 'pending'
                ]
            );
            $count++;
        }

        if($count === 0) return response()->json(['message' => 'No valid students imported.'], 400);

        ActivityLog::create(['user_id' => Auth::id(), 'action' => 'import', 'description' => "Imported {$count} students via CSV", 'ip_address' => $request->ip()]);
        return response()->json(['message' => "Successfully imported {$count} students."]);
    }
}