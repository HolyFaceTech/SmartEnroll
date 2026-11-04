<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Status;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class StatusController extends Controller
{
    /** Security Role: Admin Only */
    private function checkAccess($authUser)
    {
        if ($authUser->role !== 'admin') {
            abort(403, 'Unauthorized Access. Only administrators have permission to manage system statuses.');
        }
    }

    /** DataTable */
    public function index(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $query = Status::query();

            if ($search = $request->search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhere('created_at', 'like', "%{$search}%")
                        ->orWhere('done_at', 'like', "%{$search}%");
                });
            }

            $perPage = $request->per_page ?? 10;
            $statuses = $query->latest()->paginate($perPage);

            return response()->json($statuses);

        } catch (Exception $e) {
            Log::error('StatusController index Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to load statuses. Please check your connection and try again.'], 500);
        }
    }

    /** Create */
    public function store(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $validated = $request->validate([
                'name' => 'required|string',
                'description' => 'required|string',
            ]);

            $validated['status'] = 'processing';

            $status = Status::create($validated);

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'create',
                'description' => "Created new system status: {$status->name}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json(['message' => 'System status successfully created!'], 201);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('StatusController store Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Unable to create status due to a server error. Please try again later.'], 500);
        }
    }

    /** Update */
    public function update(Request $request, $id)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $statusRecord = Status::find($id);
            if (! $statusRecord) {
                return response()->json(['message' => 'Update Failed: Record no longer exists or was already deleted.'], 404);
            }

            $validated = $request->validate([
                'name' => 'required|string',
                'description' => 'required|string',
            ]);

            $statusRecord->fill($validated);
            $changes = $statusRecord->getDirty();

            $statusRecord->save();

            if (! empty($changes)) {
                ActivityLog::create([
                    'user_id' => $authUser->id,
                    'action' => 'update',
                    'description' => "Updated system status details for: {$statusRecord->name}",
                    'ip_address' => $request->ip(),
                ]);

                return response()->json(['message' => 'System status successfully updated!']);
            }

            return response()->json(['message' => 'Saved successfully (No changes were made).']);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('StatusController update Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Unable to update status due to a server problem. Please try again.'], 500);
        }
    }

    /** Change Status */
    public function changeStatus(Request $request, $id)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $request->validate([
                'status' => 'required|string|in:processing,done,reset',
            ]);

            $statusRecord = Status::find($id);

            if (! $statusRecord) {
                return response()->json(['message' => 'Update Failed: Record not found.'], 404);
            }

            if (strtolower($request->status) === 'reset') {
                $statusRecord->status = $statusRecord->previous_status ?? 'processing';

                if ($statusRecord->status === 'processing') {
                    $statusRecord->done_at = null;
                }

                $statusRecord->previous_status = null;
            } else {
                if ($statusRecord->status !== $request->status) {
                    $statusRecord->previous_status = $statusRecord->status;
                }

                $statusRecord->status = $request->status;

                if (strtolower($request->status) === 'done') {
                    $statusRecord->done_at = now();
                } elseif (strtolower($request->status) === 'processing') {
                    $statusRecord->done_at = null;
                }
            }

            $statusRecord->save();

            $actionWord = strtolower($request->status) === 'reset' ? 'RESET' : strtoupper($request->status);

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'update',
                'description' => "Changed system status to {$actionWord} for: {$statusRecord->name}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Status successfully updated.',
                'new_status' => $statusRecord->status,
            ]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('StatusController changeStatus Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'An error occurred while updating status. Please try again.'], 500);
        }
    }

    /** Single Delete */
    public function destroy($id)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $statusRecord = Status::find($id);

            if ($statusRecord) {
                $name = $statusRecord->name;
                $statusRecord->delete();

                ActivityLog::create([
                    'user_id' => $authUser->id,
                    'action' => 'delete',
                    'description' => "Deleted system status: {$name}",
                    'ip_address' => request()->ip(),
                ]);

                return response()->json(['message' => 'System status has been successfully deleted.']);
            }

            return response()->json(['message' => 'Deletion Failed: Status not found or was already removed.'], 404);

        } catch (Exception $e) {
            Log::error('StatusController destroy Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'An error occurred while deleting the status.'], 500);
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
                'ids.*' => 'exists:statuses,id',
            ], [
                'ids.max' => 'You can only delete up to 50 statuses at a single time.',
            ]);

            $ids = $request->ids;
            $statuses = Status::whereIn('id', $ids)->get();
            $deletedCount = 0;

            foreach ($statuses as $statusRecord) {
                $name = $statusRecord->name;
                $statusRecord->delete();
                $deletedCount++;

                ActivityLog::create([
                    'user_id' => $authUser->id,
                    'action' => 'delete',
                    'description' => "Bulk Deleted system status: {$name}",
                    'ip_address' => $request->ip(),
                ]);
            }

            if ($deletedCount === 0) {
                return response()->json(['message' => 'No statuses were deleted.'], 404);
            }

            return response()->json(['message' => "Successfully deleted {$deletedCount} selected statuses."]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('StatusController bulkDelete Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Unable to process bulk deletion due to a server error. Please try again.'], 500);
        }
    }
}
