<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Strand;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class StrandController extends Controller
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

            $query = Strand::query();

            if ($request->has('search') && $request->search != '') {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('code', 'LIKE', '%'.$searchTerm.'%')
                        ->orWhere('description', 'LIKE', '%'.$searchTerm.'%');
                });
            }

            $query->withCount(['students' => function ($query) {
                $query->where('status', 'enrolled');
            }]);

            $perPage = $request->input('per_page', 10);
            $strands = $query->latest()->paginate($perPage);

            return response()->json($strands);

        } catch (Exception $e) {
            Log::error('StrandController index Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to load strand records. Please check your connection and try again.'], 500);
        }
    }

    // create
    public function store(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $validated = $request->validate([
                'code' => 'required|unique:strands,code|max:20',
                'description' => 'required|string',
            ]);

            $strand = Strand::create($validated);

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'create',
                'description' => "Created new strand: {$strand->code}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Strand created successfully',
                'strand' => $strand,
            ], 201);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('StrandController store Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Unable to create strand record due to a server error. Please try again later.'], 500);
        }
    }

    // update
    public function update(Request $request, $id)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $strand = Strand::find($id);

            if (! $strand) {
                return response()->json(['message' => 'Strand not found'], 404);
            }

            $validated = $request->validate([
                'code' => 'required|max:20|unique:strands,code,'.$id,
                'description' => 'required|string',
            ]);

            $strand->update($validated);

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'update',
                'description' => "Updated strand details: {$strand->code}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Strand updated successfully',
                'strand' => $strand,
            ]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('StrandController update Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Unable to update strand record due to a server problem. Please try again.'], 500);
        }
    }

    // single delete
    public function destroy($id)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $strand = Strand::find($id);

            if ($strand) {
                $code = $strand->code;
                $strand->delete();

                ActivityLog::create([
                    'user_id' => $authUser->id,
                    'action' => 'delete',
                    'description' => "Deleted strand: {$code}",
                    'ip_address' => request()->ip(),
                ]);

                return response()->json(['message' => 'Strand deleted successfully']);
            }

            return response()->json(['message' => 'Deletion Failed: Strand not found or was already removed.'], 404);

        } catch (Exception $e) {
            Log::error('StrandController destroy Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'An error occurred while deleting the strand. Please check your network and try again.'], 500);
        }
    }

    // Bulk Delete
    public function bulkDelete(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $request->validate([
                'ids' => 'required|array|max:50',
                'ids.*' => 'exists:strands,id',
            ], [
                'ids.max' => 'You can only delete up to 50 strands at a single time.',
            ]);

            $strands = Strand::whereIn('id', $request->ids)->get();
            $codes = $strands->pluck('code')->toArray();

            Strand::whereIn('id', $request->ids)->delete();

            $codesString = implode(', ', $codes);
            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'bulk_delete',
                'description' => "Bulk deleted strands: {$codesString}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json(['message' => 'Strands deleted successfully']);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('StrandController bulkDelete Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Unable to process bulk deletion due to a server error. Please try again.'], 500);
        }
    }

    // Export CSV
    public function exportCsv(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $strandId = $request->input('strand_id');

            $strand = Strand::with(['students' => function ($q) {
                $q->where('status', 'enrolled')
                    ->join('student_academics', 'students.id', '=', 'student_academics.student_id')
                    ->join('sections', 'student_academics.section_id', '=', 'sections.id')
                    ->select('students.*', 'sections.name as section_name')
                    ->orderBy('sections.name');
            }])->findOrFail($strandId);

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'export_csv',
                'description' => "Exported CSV Masterlist for strand: {$strand->code}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'strand_code' => $strand->code,
                'students' => $strand->students,
            ]);

        } catch (Exception $e) {
            Log::error('StrandController exportCsv Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to prepare CSV data. Please try again.'], 500);
        }
    }

    // Export PDF
    public function exportPdf(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $strandId = $request->input('strand_id');

            $strand = Strand::with(['students' => function ($q) {
                $q->where('status', 'enrolled')
                    ->select('students.id', 'students.student_number', 'students.lrn', 'students.first_name', 'students.last_name', 'students.middle_name', 'students.suffix')
                    ->orderBy('students.last_name');
            }])->findOrFail($strandId);

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'export_pdf',
                'description' => "Exported PDF Masterlist for strand: {$strand->code}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'strand_code' => $strand->code,
                'students' => $strand->students,
            ]);

        } catch (Exception $e) {
            Log::error('StrandController exportPdf Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to prepare PDF data. Please try again.'], 500);
        }
    }
}
