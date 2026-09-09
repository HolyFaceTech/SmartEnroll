<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\EnrollmentSetting;
use App\Models\Section;
use Barryvdh\DomPDF\Facade\Pdf;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;

class SectionController extends Controller
{
    // security
    private function checkAccess($authUser)
    {
        if (! in_array($authUser->role, ['head', 'staff'])) {
            abort(403, 'Unauthorized Access. You do not have permission to perform this action.');
        }
    }

    // read
    public function index(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $query = Section::with('strand');

            if ($request->has('search') && $request->search != '') {
                $searchTerm = $request->search;
                $query->where('name', 'LIKE', '%'.$searchTerm.'%');
            }

            $query->withCount(['students as enrolled_count' => function ($query) {
                $query->where('students.status', 'enrolled');
            }]);

            $perPage = $request->input('per_page', 10);
            $sections = $query->latest()->paginate($perPage);

            return response()->json($sections);

        } catch (Exception $e) {
            Log::error('SectionController index Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to load section records.'], 500);
        }
    }

    // create
    public function store(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $validated = $request->validate([
                'name' => 'required|string|max:50|unique:sections,name',
                'strand_id' => 'required|exists:strands,id',
                'grade_level' => 'required|in:11,12',
                'capacity' => 'required|integer|min:1',
            ]);

            $section = Section::create($validated);

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'create',
                'description' => "Created new section: {$section->name}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json(['message' => 'Section Created successfully', 'section' => $section], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('SectionController store Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to create section due to server error.'], 500);
        }
    }

    // update
    public function update(Request $request, $id)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $section = Section::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:50|unique:sections,name,'.$id,
                'strand_id' => 'required|exists:strands,id',
                'grade_level' => 'required|in:11,12',
                'capacity' => 'required|integer|min:1',
            ]);

            $section->update($validated);

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'update',
                'description' => "Updated section details: {$section->name}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json(['message' => 'Section Updated successfully', 'section' => $section]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('SectionController update Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to update section due to server error.'], 500);
        }
    }

    // single delete
    public function destroy($id)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $section = Section::findOrFail($id);
            $name = $section->name;

            $section->delete();

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'delete',
                'description' => "Deleted section: {$name}",
                'ip_address' => request()->ip(),
            ]);

            return response()->json(['message' => 'Section Deleted successfully']);
        } catch (Exception $e) {
            Log::error('SectionController destroy Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to delete section.'], 500);
        }
    }

    // bulk delete
    public function bulkDelete(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $request->validate([
                'ids' => 'required|array|max:50',
                'ids.*' => 'exists:sections,id',
            ], [
                'ids.max' => 'You can only delete up to 50 sections at a single time.',
            ]);

            $sections = Section::whereIn('id', $request->ids)->get();
            $names = $sections->pluck('name')->toArray();

            Section::whereIn('id', $request->ids)->delete();

            $namesString = implode(', ', $names);
            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'bulk_delete',
                'description' => "Bulk deleted sections: {$namesString}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json(['message' => 'Sections deleted successfully.']);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('SectionController bulkDelete Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to process bulk deletion.'], 500);
        }
    }

    // export CSV
    public function exportCsv(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $sectionId = $request->input('section_id');
            $section = Section::findOrFail($sectionId);

            $students = $section->students()
                ->where('students.status', 'enrolled')
                ->with(['profile', 'family', 'academic'])
                ->get()
                ->sortBy('last_name')
                ->values();

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'export_csv',
                'description' => "Exported CSV Full Data for section: {$section->name}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'section_name' => $section->name,
                'students' => $students,
            ]);
        } catch (Exception $e) {
            Log::error('SectionController exportCsv Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to prepare CSV data.'], 500);
        }
    }

    // export PDF
    public function exportPdf(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $sectionId = $request->input('section_id');
            $section = Section::findOrFail($sectionId);

            if ($request->boolean('log')) {
                ActivityLog::create([
                    'user_id' => $authUser->id,
                    'action' => 'export_pdf',
                    'description' => "Exported PDF Masterlist for section: {$section->name}",
                    'ip_address' => $request->ip(),
                ]);

                $url = URL::temporarySignedRoute(
                    'section.masterlist.download',
                    now()->addMinutes(30),
                    [
                        'section' => $section->id,
                        'pb' => $authUser->first_name.' '.$authUser->last_name,
                    ]
                );

                return response()->json([
                    'message' => 'Export logged successfully.',
                    'url' => $url,
                ]);
            }

            $students = $section->students()
                ->where('students.status', 'enrolled')
                ->leftJoin('student_profiles', 'students.id', '=', 'student_profiles.student_id')
                ->select(
                    'students.id', 'students.student_number', 'students.lrn',
                    'students.first_name', 'students.last_name', 'students.middle_name', 'students.suffix',
                    'student_profiles.gender',
                    'student_academics.learning_modality'
                )
                ->orderBy('student_profiles.gender', 'desc')
                ->orderBy('students.last_name')
                ->get();

            return response()->json([
                'section_name' => $section->name,
                'grade_level' => $section->grade_level,
                'students' => $students,
            ]);

        } catch (Exception $e) {
            Log::error('SectionController exportPdf Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to prepare PDF data.'], 500);
        }
    }

    // download PDF
    public function downloadSectionMasterlist(Request $request, $id)
    {
        if (! $request->hasValidSignature()) {
            abort(401, 'Invalid or expired download link. Please generate a new PDF request.');
        }

        $section = Section::with('strand')->findOrFail($id);
        $settings = EnrollmentSetting::first();
        $schoolYear = $settings ? $settings->school_year : date('Y').'-'.(date('Y') + 1);

        $students = $section->students()
            ->where('students.status', 'enrolled')
            ->leftJoin('student_profiles', 'students.id', '=', 'student_profiles.student_id')
            ->select(
                'students.*',
                'student_profiles.gender',
                'student_academics.learning_modality'
            )
            ->orderBy('student_profiles.gender', 'desc')
            ->orderBy('students.last_name')
            ->get();

        $pdf = Pdf::loadView('pdf.section_masterlist', [
            'section' => $section,
            'students' => $students,
            'schoolYear' => $schoolYear,
            'printedBy' => $request->query('pb', 'System Admin'),
        ]);

        $currentYear = date('Y');
        $fileName = strtoupper($section->name).'MasterList'.$currentYear.'.pdf';

        return $pdf->download($fileName);
    }
}
