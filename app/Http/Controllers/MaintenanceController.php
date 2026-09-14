<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\EnrollmentSetting;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class MaintenanceController extends Controller
{
    // security: strictly for head role
    private function checkAccess($authUser)
    {
        if ($authUser->role !== 'head') {
            abort(403, 'Unauthorized Access. You do not have permission to perform this action.');
        }
    }

    // toggle
    public function toggleMaintenance(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $validated = $request->validate([
                'maintenance_mode' => 'required|boolean',
            ]);

            $setting = EnrollmentSetting::first();

            if (! $setting) {
                return response()->json(['message' => 'No settings found to update.'], 404);
            }

            $setting->update(['maintenance_mode' => $validated['maintenance_mode']]);

            $status = $validated['maintenance_mode'] ? 'ENABLED' : 'DISABLED';

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'maintenance',
                'description' => "System Maintenance Mode was $status",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Maintenance mode updated successfully!',
                'status' => $setting->maintenance_mode,
            ], 200);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('MaintenanceController toggle Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'An unexpected error occurred while updating maintenance mode.'], 500);
        }
    }
}
