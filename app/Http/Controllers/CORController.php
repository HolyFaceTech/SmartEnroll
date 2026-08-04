<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Section;
use App\Models\Subject;
use App\Models\ActivityLog; 
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth; 
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class CORController extends Controller
{
    // 1. GET DATA FOR MODAL (Populate Dropdowns & Inputs)
    public function getCORData($studentId)
    {
        $student = Student::with(['strand', 'section'])->findOrFail($studentId);

        // Kukunin ang available sections base sa strand at grade level
        $sections = Section::where('strand_id', $student->strand_id)
            ->where('grade_level', $student->grade_level)
            ->withCount(['students as enrolled_count' => function ($query) {
                $query->where('status', 'enrolled'); 
            }])
            ->get();

        // FIX: Gamitin ang 'term' imbes na 'semester'
        // Kung ang value ay "1st Term", ang $semKey ay magiging "1st"
        $termValue = $student->term ?? '1st';
        $semKey = explode(' ', trim($termValue))[0]; 

        // Kunin ang mga subjects
        $subjects = Subject::where(function($q) use ($student) {
                $q->where('strand_id', $student->strand_id)
                  ->orWhereNull('strand_id');
            })
            ->where('grade_level', $student->grade_level)
            // Gamitin natin ang 'term' dito. 
            // NOTE: Kung 'semester' pa rin ang column name sa 'subjects' table, 
            // ibalik ito sa ->where('semester', 'LIKE', "%{$semKey}%")
            ->where('term', 'LIKE', "%{$semKey}%") 
            ->get();

        return response()->json([
            'student' => $student,
            'available_sections' => $sections,
            'suggested_subjects' => $subjects
        ]);
    }

    // 2. GENERATE SIGNED URL
    public function generateUrl(Request $request)
    {
        return DB::transaction(function () use ($request) {
            
            // Diretso na tayo sa pag-generate ng URL dahil read-only na ang section sa frontend
            $tempId = Str::random(40);
            
            // I-save ang data sa cache para makuha ng PDF generator (valid for 5 mins)
            Cache::put('cor_data_' . $tempId, $request->all(), now()->addMinutes(5));

            $studentName = $request->input('info.name') ?? 'Student';
            
            // I-log natin na nag-print/download ng COR
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'download',
                'description' => "Downloaded COR for student: {$studentName}",
                'ip_address' => $request->ip()
            ]);

            $url = URL::temporarySignedRoute(
                'cor.print', 
                now()->addMinutes(5), 
                ['id' => $tempId]
            );

            return response()->json(['url' => $url]);
        });
    }

    // 3. PRINT PDF
    public function printCOR($tempId)
    {
        $data = Cache::get('cor_data_' . $tempId);

        if (!$data) {
            abort(404, 'Link expired or invalid.');
        }

        // Logo Logic
        $logoData = null;
        try {
            $path = public_path('images/logo.png');
            if (file_exists($path)) {
                $img = file_get_contents($path);
                $logoData = 'data:image/png;base64,' . base64_encode($img);
            }
        } catch (\Exception $e) {}

        $data['logo'] = $logoData;
        $data['printed_at'] = now()->format('F d, Y h:i A');

        // Grade & Section Display
        $grade = $data['info']['grade_level'] ?? 'N/A';
        $section = $data['info']['section_name'] ?? 'TBA';
        $data['info']['grade_section'] = "$grade / $section"; 

        $pdf = Pdf::loadView('pdf.cor', $data);
        $pdf->setPaper('a4', 'portrait');

        return $pdf->stream('COR-' . ($data['info']['lrn'] ?? 'Student') . '.pdf');
    }
}