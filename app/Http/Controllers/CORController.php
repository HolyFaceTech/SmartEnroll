<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use Barryvdh\DomPDF\Facade\Pdf;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class CORController extends Controller
{
    public function getCORData($studentId)
    {
        try {
            $student = Student::with(['strand', 'section', 'academic'])->findOrFail($studentId);

            $sections = Section::where('strand_id', $student->academic?->strand_id)
                ->where('grade_level', $student->academic?->grade_level)
                ->withCount(['students as enrolled_count' => function ($query) {
                    $query->where('status', 'enrolled');
                }])
                ->get();

            $semKey = explode(' ', trim($student->academic?->term))[0];

            $subjects = Subject::where(function ($q) use ($student) {
                $q->where('strand_id', $student->academic?->strand_id)
                    ->orWhereNull('strand_id');
            })
                ->where('grade_level', $student->academic?->grade_level)
                ->where('semester', 'LIKE', "%{$semKey}%")
                ->get();

            return response()->json([
                'student' => $student,
                'available_sections' => $sections,
                'suggested_subjects' => $subjects,
                'default_or' => 'OR-'.strtoupper(Str::random(6)), // Automatic OR Generator
            ]);
        } catch (Exception $e) {
            Log::error('CORController getCORData Error: '.$e->getMessage());

            return response()->json(['message' => 'Failed to load COR data.'], 500);
        }
    }

    public function generateUrl(Request $request)
    {
        try {
            return DB::transaction(function () use ($request) {

                $lrn = $request->input('info.lrn');
                $sectionId = $request->input('info.section_id');
                $student = Student::with('academic')->where('lrn', $lrn)->first();

                // SAFETY CHECK FOR SECTION
                if ($student && $sectionId && $student->academic?->section_id != $sectionId) {
                    $section = Section::where('id', $sectionId)->lockForUpdate()->first();

                    if ($section) {
                        $currentEnrolled = $section->students()->where('status', 'enrolled')->count();

                        if ($currentEnrolled >= $section->capacity) {
                            return response()->json([
                                'message' => "FAILED: Section is FULL ({$currentEnrolled}/{$section->capacity}).",
                            ], 422);
                        }

                        $student->academic()->update(['section_id' => $sectionId]);

                        ActivityLog::create([
                            'user_id' => Auth::id(),
                            'action' => 'update',
                            'description' => "Assigned section via COR for: {$student->last_name}",
                            'ip_address' => $request->ip(),
                        ]);
                    }
                }

                $tempId = Str::random(40);
                Cache::put('cor_data_'.$tempId, $request->all(), now()->addMinutes(5));

                $url = URL::temporarySignedRoute(
                    'cor.print',
                    now()->addMinutes(5),
                    ['id' => $tempId]
                );

                return response()->json(['url' => $url]);
            });
        } catch (Exception $e) {
            Log::error('CORController generateUrl Error: '.$e->getMessage());

            return response()->json(['message' => 'Failed to generate document link.'], 500);
        }
    }

    public function printCOR($tempId)
    {
        $data = Cache::get('cor_data_'.$tempId);

        if (! $data) {
            abort(404, 'Link expired or invalid.');
        }

        // Logo Logic
        $data['logo'] = null;
        try {
            $path = public_path('images/logo.png');
            if (file_exists($path)) {
                $data['logo'] = 'data:image/png;base64,'.base64_encode(file_get_contents($path));
            }
        } catch (Exception $e) {
        }

        // Fetch Student for the 2x2 Picture logic
        $student = Student::with('requirement')->where('lrn', $data['info']['lrn'])->first();
        $data['photo_2x2'] = null;

        if ($student && $student->requirement && $student->requirement->photo_2x2) {
            try {
                $photoPath = storage_path('app/public/'.$student->requirement->photo_2x2);
                if (file_exists($photoPath)) {
                    $ext = pathinfo($photoPath, PATHINFO_EXTENSION);
                    $data['photo_2x2'] = 'data:image/'.$ext.';base64,'.base64_encode(file_get_contents($photoPath));
                }
            } catch (Exception $e) {
            }
        }

        $data['printed_at'] = now()->format('F d, Y h:i A');

        $grade = $data['info']['grade_level'] ?? 'N/A';
        $section = $data['info']['section_name'] ?? 'TBA';
        $data['info']['grade_section'] = "$grade / $section";

        $pdf = Pdf::loadView('pdf.cor', $data);
        $pdf->setPaper('a4', 'portrait');

        return $pdf->stream('COR-'.($data['info']['lrn'] ?? 'Student').'.pdf');
    }
}
