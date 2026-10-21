<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\EnrollmentSetting;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class EnrollmentSettingController extends Controller
{
    /** Security Role */
    private function checkAccess($authUser)
    {
        if ($authUser->role !== 'head') {
            abort(403, 'Unauthorized Access. You do not have permission to perform this action.');
        }
    }

    /** Calendar Data */
    public function index()
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            return response()->json(EnrollmentSetting::first(), 200);
        } catch (Exception $e) {
            Log::error('EnrollmentSettingController index Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to fetch settings.'], 500);
        }
    }

    /** Create */
    public function store(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            if (EnrollmentSetting::exists()) {
                return response()->json(['message' => 'Settings already exist. Please update instead.'], 400);
            }

            $validated = $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'school_year' => ['required', 'string', 'regex:/^\d{4}-\d{4}$/'],
                'term' => 'required|string',
            ]);

            $setting = EnrollmentSetting::create($validated);

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'create',
                'description' => "Created new Enrollment Schedule for SY {$setting->school_year} - {$setting->term}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json(['message' => 'Settings created successfully!', 'data' => $setting], 201);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('EnrollmentSettingController store Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to create settings due to server error.'], 500);
        }
    }

    /** Update */
    public function update(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $setting = EnrollmentSetting::first();

            if (! $setting) {
                return response()->json(['message' => 'No settings found to update. Please create one first.'], 404);
            }

            $validated = $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'school_year' => ['required', 'string', 'regex:/^\d{4}-\d{4}$/'],
                'term' => 'required|string',
            ]);

            $setting->update($validated);

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'update',
                'description' => "Updated Enrollment Schedule for SY {$setting->school_year} - {$setting->term}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json(['message' => 'Settings updated successfully!', 'data' => $setting], 200);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('EnrollmentSettingController update Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to update settings due to server error.'], 500);
        }
    }

    /** Delete */
    public function destroy($id = null)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $setting = EnrollmentSetting::first();

            if ($setting) {
                $sy = $setting->school_year;
                $setting->delete();

                ActivityLog::create([
                    'user_id' => $authUser->id,
                    'action' => 'delete',
                    'description' => "Reset Enrollment Schedule (Previously: SY $sy)",
                    'ip_address' => request()->ip(),
                ]);

                return response()->json(['message' => 'Schedule removed successfully.'], 200);
            }

            return response()->json(['message' => 'Nothing to delete.'], 404);

        } catch (Exception $e) {
            Log::error('EnrollmentSettingController destroy Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to reset schedule.'], 500);
        }
    }
}
