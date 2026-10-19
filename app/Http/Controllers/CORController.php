<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Student;
use App\Models\Subject;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CORController extends Controller
{
    // Security
    private function checkAccess($authUser)
    {
        if (! in_array($authUser->role, ['head', 'staff'])) {
            abort(403, 'Unauthorized Access. You do not have permission to manage CORs.');
        }
    }

    // Fetching Student Data
    public function getCORData($studentId)
    {
        try {
            $this->checkAccess(Auth::user());

            $student = Student::with(['academic.strand', 'academic.section', 'requirement', 'family'])->findOrFail($studentId);

            $semKey = explode(' ', trim($student->academic?->term))[0];

            $subjects = Subject::where(function ($q) use ($student) {
                $q->where('strand_id', $student->academic?->strand_id)
                    ->orWhereNull('strand_id');
            })
                ->where('grade_level', $student->academic?->grade_level)
                ->where('term', 'LIKE', "%{$semKey}%")
                ->get();

            $photoUrl = null;
            if ($student->requirement && ! empty($student->requirement->photo_2x2)) {
                $photoUrl = asset('storage/'.$student->requirement->photo_2x2);
            }

            $yy = now()->format('y');
            $g = preg_replace('/\D/', '', (string) ($student->academic?->grade_level ?? '0')) ?: '0';
            $t = preg_replace('/\D/', '', (string) ($student->academic?->term ?? '1')) ?: '1';
            $stDigits = preg_replace('/\D/', '', (string) ($student->student_number ?? ''));
            $nnnnn = $stDigits ? str_pad(substr($stDigits, -5), 5, '0', STR_PAD_LEFT) : (string) random_int(10000, 99999);
            $defaultAssessmentNo = "HF-{$yy}{$g}{$t}{$nnnnn}";

            return response()->json([
                'student' => $student,
                'suggested_subjects' => $subjects,
                'default_or' => $defaultAssessmentNo,
                'photo_url' => $photoUrl,
            ]);

        } catch (\Exception $e) {
            Log::error('CORController getCORData Error: '.$e->getMessage());

            return response()->json(['message' => 'Backend Error: '.$e->getMessage()], 500);
        }
    }

    // URL for Print
    public function generateUrl(Request $request)
    {
        try {
            $this->checkAccess(Auth::user());

            $tempId = Str::random(40);
            Cache::put('cor_data_'.$tempId, $request->all(), now()->addMinutes(5));

            $url = URL::temporarySignedRoute(
                'cor.print',
                now()->addMinutes(5),
                ['id' => $tempId]
            );

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'read',
                'description' => "Generated COR preview for LRN: {$request->input('info.lrn')}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json(['url' => $url]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('CORController generateUrl Error: '.$e->getMessage());

            return response()->json(['message' => 'Backend Error: '.$e->getMessage()], 500);
        }
    }

    // Print COR
    public function printCOR($tempId)
    {
        $data = Cache::get('cor_data_'.$tempId);

        if (! $data) {
            abort(404, 'Link expired or invalid.');
        }

        $data['logo'] = null;
        try {
            $path = public_path('images/logo.png');
            if (file_exists($path)) {
                $data['logo'] = 'data:image/png;base64,'.base64_encode(file_get_contents($path));
            }
        } catch (\Exception $e) {
        }

        $student = Student::with('requirement')->where('lrn', $data['info']['lrn'])->first();
        $data['photo_2x2'] = null;

        if ($student && $student->requirement && $student->requirement->photo_2x2) {
            try {
                $photoPath = storage_path('app/public/'.$student->requirement->photo_2x2);
                if (file_exists($photoPath)) {
                    $ext = pathinfo($photoPath, PATHINFO_EXTENSION);
                    $data['photo_2x2'] = 'data:image/'.$ext.';base64,'.base64_encode(file_get_contents($photoPath));
                }
            } catch (\Exception $e) {
            }
        }

        $data['printed_at'] = now()->format('F d, Y h:i A');

        $grade = $data['info']['grade_level'] ?? 'N/A';
        $section = $data['info']['section_name'] ?? 'TBA';
        $data['info']['grade_section'] = "$grade / $section";

        $pdf = Pdf::loadView('pdf.cor', $data);

        $pdf->setPaper('legal', 'portrait');

        $studentName = $data['info']['name'] ?? 'Student';
        $studentGrade = $data['info']['grade_level'] ?? '';
        $studentTerm = $data['info']['term'] ?? '';

        $fileName = "COR - {$studentName} - {$studentGrade}{$studentTerm}.pdf";

        return $pdf->stream($fileName);
    }
}
