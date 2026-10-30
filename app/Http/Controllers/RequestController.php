<?php

namespace App\Http\Controllers;

use App\Mail\StudentRequest;
use App\Models\ActivityLog;
use App\Models\Request as DocumentRequest;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class RequestController extends Controller
{
    /** Security Role */
    private function checkAccess($authUser)
    {
        if (! in_array($authUser->role, ['head', 'staff'])) {
            abort(403, 'Unauthorized Access. You do not have permission to perform this action.');
        }
    }

    /** DataTable */
    public function index(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $query = DocumentRequest::with([
                'student',
                'student.academic.strand',
                'student.requirement',
                'user',
            ]);

            if ($search = $request->search) {
                $query->where(function ($q) use ($search) {
                    $q->where('type', 'like', "%{$search}%")
                        ->orWhere('purpose', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhere('claimed_by', 'like', "%{$search}%")
                        ->orWhereHas('student', function ($studentQuery) use ($search) {
                            $studentQuery->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('lrn', 'like', "%{$search}%")
                                ->orWhere('student_number', 'like', "%{$search}%");
                        });
                });
            }

            $perPage = $request->per_page ?? 10;
            $requests = $query->latest()->paginate($perPage);

            return response()->json($requests);

        } catch (Exception $e) {
            Log::error('RequestController index Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to load request records. Please try again.'], 500);
        }
    }

    /** Change Status and Process Release */
    public function changeStatus(Request $request, $id)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $request->validate([
                'status' => 'required|string',
                'claimed_by' => 'nullable|string',
            ]);

            $docRequest = DocumentRequest::with('student')->find($id);

            if (! $docRequest) {
                return response()->json(['message' => 'Update Failed: Request not found.'], 404);
            }

            if (strtolower($request->status) === 'reset') {
                $docRequest->status = $docRequest->previous_status ?? 'pending';

                $docRequest->released_at = null;
                $docRequest->claimed_at = null;
                $docRequest->user_id = null;
                $docRequest->claimed_by = null;
                $docRequest->previous_status = null;
            } else {
                if ($docRequest->status !== $request->status) {
                    $docRequest->previous_status = $docRequest->status;
                }

                $docRequest->status = $request->status;

                if (strtolower($request->status) === 'released') {
                    $docRequest->released_at = now();
                    $docRequest->claimed_at = now();
                    $docRequest->user_id = $authUser->id;
                    $docRequest->claimed_by = $request->claimed_by;
                } elseif (strtolower($request->status) === 'pending') {
                    $docRequest->released_at = null;
                    $docRequest->claimed_at = null;
                    $docRequest->user_id = null;
                    $docRequest->claimed_by = null;
                }
            }

            $docRequest->save();

            $studentName = trim("{$docRequest->student->first_name} {$docRequest->student->last_name}");
            $actionWord = strtolower($request->status) === 'reset' ? 'RESET' : strtoupper($request->status);

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'update',
                'description' => "Changed document request status to {$actionWord} for student: {$studentName}",
                'ip_address' => $request->ip(),
            ]);

            if (strtolower($request->status) !== 'reset') {
                try {
                    if (! empty($docRequest->student->email)) {
                        Mail::to($docRequest->student->email)
                            ->queue(new StudentRequest($docRequest->student, $docRequest));
                    }
                } catch (\Throwable $mailError) {
                    Log::warning('Document Request Status Email Failed: '.$mailError->getMessage());
                }
            }

            return response()->json([
                'message' => 'Status successfully updated.',
                'new_status' => $docRequest->status,
            ]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('RequestController changeStatus Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'An error occurred while updating status. Please try again.'], 500);
        }
    }

    /** Single Delete */
    public function destroy($id)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $docRequest = DocumentRequest::with('student')->find($id);

            if (! $docRequest) {
                return response()->json(['message' => 'Deletion Failed: Request not found or already removed.'], 404);
            }

            $studentName = trim("{$docRequest->student->first_name} {$docRequest->student->last_name}");
            $docType = strtoupper($docRequest->type);

            $docRequest->delete();

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'delete',
                'description' => "Deleted document request ({$docType}) for student: {$studentName}",
                'ip_address' => request()->ip(),
            ]);

            return response()->json(['message' => 'Document request has been successfully deleted.']);

        } catch (Exception $e) {
            Log::error('RequestController destroy Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'An error occurred while deleting the request. Please try again.'], 500);
        }
    }

    /** Bulk Delete */
    public function bulkDelete(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $request->validate([
                'ids' => 'required|array|max:50',
                'ids.*' => 'exists:requests,id',
            ], [
                'ids.max' => 'You can only delete up to 50 requests at a single time.',
            ]);

            $ids = $request->ids;
            $deletedCount = DocumentRequest::whereIn('id', $ids)->delete();

            if ($deletedCount > 0) {
                ActivityLog::create([
                    'user_id' => $authUser->id,
                    'action' => 'delete',
                    'description' => "Bulk Deleted {$deletedCount} document request(s).",
                    'ip_address' => $request->ip(),
                ]);
            }

            return response()->json(['message' => "Successfully deleted {$deletedCount} selected request(s)."]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('RequestController bulkDelete Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Unable to process bulk deletion due to a server error. Please try again.'], 500);
        }
    }
}
