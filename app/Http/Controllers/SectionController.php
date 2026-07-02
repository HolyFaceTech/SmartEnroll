<?php

namespace App\Http\Controllers;

use App\Models\Section;
use App\Models\User;
use App\Models\EnrollmentSetting;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;

class SectionController extends Controller
{
    // view
    public function index(Request $request)
    {
        $limit = $request->input('limit', 10);
        $search = $request->input('search', '');

        $query = Section::with('strand')
            ->withCount(['students as enrolled_count' => function ($query) {
                $query->where('status', 'enrolled');
            }])
            ->orderBy('grade_level', 'asc')
            ->orderBy('name', 'asc');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhereHas('strand', function($subQuery) use ($search) {
                      $subQuery->where('code', 'like', "%{$search}%");
                  });
            });
        }

        return response()->json($query->paginate($limit));
    }

    // master list
    public function masterList($id)
    {
        $section = Section::with('strand')->findOrFail($id);

        $students = $section->students()
            ->where('status', 'enrolled')
            ->orderBy('last_name', 'asc')
            ->get();

        $males = $students->where('gender', 'Male')->values();
        $females = $students->where('gender', 'Female')->values();
        $settings = EnrollmentSetting::first();
        $schoolYear = $settings ? $settings->school_year : date('Y') . '-' . (date('Y') + 1);
        $term = $settings ? $settings->term : '1st';

        return response()->json([
            'section' => $section,
            'males' => $males,
            'females' => $females,
            'school_year' => $schoolYear,
            'term' => $term      
        ]);
    }

    // generate url master list
    public function generatePrintUrl($id)
    {
        $section = Section::findOrFail($id);
        $user = auth()->user()->id; 

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'download',
            'description' => "Downloaded Masterlist for section: {$section->name}",
            'ip_address' => request()->ip()
        ]);

        $url = URL::temporarySignedRoute(
            'masterlist.print', 
            now()->addMinute(), 
            [
                'section' => $section->id, 
                'user' => $user
            ]
        );

        return response()->json(['url' => $url]);
    }

    // print master list
    public function printMasterList($sectionId, $userId)
    {
        if (ob_get_length()) ob_end_clean(); 

        try {
            $section = Section::with('strand')->findOrFail($sectionId);
            $userObj = User::find($userId);

            $printedBy = 'Administrator';
            if ($userObj) {
                $printedBy = $userObj->name ?? trim($userObj->first_name . ' ' . $userObj->last_name . ' ' . $userObj->suffix);
                if (empty(trim($printedBy))) $printedBy = 'Administrator';
            }

            $settings = EnrollmentSetting::first(); 
            $schoolYear = $settings ? $settings->school_year : date('Y') . '-' . (date('Y') + 1);
            $term = $settings ? $settings->term : '1st';

            $students = $section->students()
                ->where('status', 'enrolled')
                ->orderBy('last_name', 'asc')
                ->get();

            $males = $students->where('gender', 'Male')->values();
            $females = $students->where('gender', 'Female')->values();

            $data = [
                'section' => $section,
                'males' => $males,
                'females' => $females,
                'schoolYear' => $schoolYear,
                'term' => $term,    
                'printedBy' => $printedBy
            ];

            $pdf = Pdf::loadView('pdf.masterlist', $data);
            $pdf->setPaper('a4', 'portrait');

            return $pdf->stream('MasterList-' . $section->name . '.pdf');

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // create
    public function store(Request $request) 
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:sections,name',
            'strand_id' => 'required|exists:strands,id',
            'grade_level' => 'required|in:11,12',
            'capacity' => 'required|integer|min:1',
        ]);

        $section = Section::create($validated);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'create',
            'description' => "Created new section: {$section->name} (G{$section->grade_level})",
            'ip_address' => $request->ip()
        ]);

        return response()->json(['message' => 'Created', 'section' => $section]);
    }

    // update
    public function update(Request $request, $id) 
    {
        $section = Section::find($id);

        if(!$section) return response()->json(['message'=>'Not found'], 404);

        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:sections,name,' . $id, 
            'strand_id' => 'required|exists:strands,id',
            'grade_level' => 'required|in:11,12',
            'capacity' => 'required|integer|min:1',
        ]);

        $section->update($validated);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'update',
            'description' => "Updated section details: {$section->name}",
            'ip_address' => $request->ip()
        ]);

        return response()->json(['message' => 'Updated', 'section' => $section]);
    }

    // delete
    public function destroy($id) 
    {
        $section = Section::find($id);

        if($section) { 
            $name = $section->name;
            $section->delete(); 

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'delete',
                'description' => "Deleted section: {$name}",
                'ip_address' => request()->ip()
            ]);

            return response()->json(['message'=>'Deleted']); 
        }
        
        return response()->json(['message'=>'Not found'], 404);
    }

    // bulk delete
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:sections,id'
        ]);

        if (empty($request->ids)) {
            return response()->json(['message' => 'No valid sections to delete.'], 400);
        }

        Section::whereIn('id', $request->ids)->delete();

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'delete',
            'description' => "Bulk deleted " . count($request->ids) . " section(s).",
            'ip_address' => $request->ip()
        ]);

        return response()->json(['message' => 'Selected sections deleted successfully.']);
    }
}