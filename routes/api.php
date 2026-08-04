<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Auth\Events\Verified;

// CONTROLLERS IMPORT
use App\Http\Controllers\Api\PublicEnrollmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SuperAdminDashboardController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\StrandController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\EnrollmentSettingController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\CORController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RecycleBinController;
use App\Models\User;

/*
|--------------------------------------------------------------------------
|  PUBLIC ROUTES (No Login Required)
|--------------------------------------------------------------------------
*/
Route::group(['prefix' => 'public'], function () {
    // 1. Settings & Dropdowns
    Route::get('/settings', [PublicEnrollmentController::class, 'getSettings']);
    Route::get('/strands', [PublicEnrollmentController::class, 'getStrands']);

    // 2. Checkers
    Route::post('/check-lrn', [PublicEnrollmentController::class, 'checkLrn']);
    Route::post('/check-status', [PublicEnrollmentController::class, 'checkStatus']);

    // 3. Enrollment Submission
    Route::post('/enroll-new', [PublicEnrollmentController::class, 'enrollNew']);
    Route::post('/enroll-old/{id}', [PublicEnrollmentController::class, 'enrollOld']);
});

Route::post('/login', [AuthController::class, 'login']);
Route::post('/email/resend', [AuthController::class, 'resendVerification']);
Route::post('/forgot-password', [AuthController::class, 'sendResetLinkEmail']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

/*
|--------------------------------------------------------------------------
|  PROTECTED ROUTES (Requires Login / Sanctum Token)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // --- 👤 USER & AUTH ---
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    // super admin
    Route::middleware(['role:super_admin'])->prefix('super_admin')->group(function () {
        // dashboard
        Route::get('/analytics', [SuperAdminDashboardController::class, 'getAnalytics']);
        Route::put('/statuses/{id}/toggle', [SuperAdminDashboardController::class, 'toggleStatus']);
    });

    // shared - super_admin and admin
    Route::middleware(['role:super_admin,admin'])->group(function () {
        // users
        Route::post('/users/bulk-delete', [UserController::class, 'bulkDelete']);
        Route::apiResource('users', UserController::class);
    });

    // shared - super_admin, admin and staff
    Route::middleware(['role:super_admin,admin,staff'])->group(function () {
        // strands
        Route::post('/strands/bulk-delete', [StrandController::class, 'bulkDelete']); 
        Route::apiResource('strands', StrandController::class);

        // subjects
        Route::post('/subjects/bulk-delete', [SubjectController::class, 'bulkDelete']); 
        Route::post('/subjects/import', [SubjectController::class, 'importCsv']); 
        Route::apiResource('subjects', SubjectController::class);

        // sections & masterlist
        Route::post('/sections/bulk-delete', [SectionController::class, 'bulkDelete']);
        Route::apiResource('sections', SectionController::class);
        Route::get('/sections/{id}/masterlist', [SectionController::class, 'masterList']);
        Route::get('/sections/{id}/masterlist/generate-url', [SectionController::class, 'generatePrintUrl']);

        // students
        Route::post('/students/bulk-delete', [StudentController::class, 'bulkDelete']);
        Route::post('/students/import', [StudentController::class, 'importCsv']);
        Route::apiResource('students', StudentController::class);
        Route::put('/students/{id}/status', [StudentController::class, 'changeStatus']);
    });

    // --- ADMIN DASHBOARD ---
    Route::get('/admin/analytics', [AdminController::class, 'getAnalytics']);
    
    // COR (Certificate of Registration)
    Route::get('/students/{id}/cor-data', [CORController::class, 'getCORData']); 
    Route::post('/cor/generate-url', [CORController::class, 'generateUrl']);

    // --- Reports ---
    Route::get('/reports/summary', [ReportController::class, 'generateSummary']);
    Route::get('/reports/masterlist', [ReportController::class, 'exportMasterlist']);

    // --- SYSTEM SETTINGS & LOGS ---
    Route::get('/settings', [EnrollmentSettingController::class, 'index']);
    Route::post('/settings', [EnrollmentSettingController::class, 'store']);
    Route::put('/settings/maintenance', [EnrollmentSettingController::class, 'toggleMaintenance']);
    Route::delete('/settings/{id}', [EnrollmentSettingController::class, 'destroy']);
    
    // --- ACTIVITY LOGS ---
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    // --- RECYCLE BIN ---
    Route::get('/recycle-bin', [RecycleBinController::class, 'index']);
    Route::post('/recycle-bin/restore', [RecycleBinController::class, 'restore']);
    Route::delete('/recycle-bin/force-delete', [RecycleBinController::class, 'forceDelete']);

    // --- MAINTENANCE MODE GROUP ---
    Route::middleware(['auth:sanctum', \App\Http\Middleware\CheckMaintenanceMode::class])->group(function () {
        // Staff specific routes that are blocked during maintenance
        Route::get('/staff/analytics', [AdminController::class, 'getAnalytics']);

        // Students
        Route::apiResource('staff/students', StudentController::class);
        Route::put('staff/students/{id}/status', [StudentController::class, 'changeStatus']);
        
        // COR
        Route::get('staff/students/{id}/cor-data', [CORController::class, 'getCORData']); 
        Route::post('staff/cor/generate-url', [CORController::class, 'generateUrl']);

        // STRANDS
        Route::apiResource('staff/strands', StrandController::class);

        // SECTIONS
        Route::apiResource('staff/sections', SectionController::class);
        Route::get('staff/sections/{id}/masterlist', [SectionController::class, 'masterList']);
        Route::get('staff/sections/{id}/masterlist/generate-url', [SectionController::class, 'generatePrintUrl']);

        // SUBJECTS
        Route::apiResource('staff/subjects', SubjectController::class);

        // REPORTS
        Route::get('staff/reports/summary', [ReportController::class, 'generateSummary']);
        Route::get('staff/reports/masterlist', [ReportController::class, 'exportMasterlist']);
    });
});

/*
|--------------------------------------------------------------------------
| SIGNED ROUTES (Public but Protected by Signature)
|--------------------------------------------------------------------------
| Ginagamit ito para sa pag-download/print ng PDF mula sa browser.
*/

// Print COR
Route::get('/print/cor/{id}', [CORController::class, 'printCOR'])
    ->name('cor.print')
    ->middleware('signed');

// Print Masterlist
Route::get('/print/masterlist/{section}/{user}', [SectionController::class, 'printMasterList'])
    ->name('masterlist.print')
    ->middleware('signed');

/*
|--------------------------------------------------------------------------
| EMAIL VERIFICATION LOGIC
|--------------------------------------------------------------------------
*/
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id) {
    $user = User::find($id);

    // 1. Validate User Existence
    if (!$user) {
        return redirect(env('FRONTEND_URL', 'http://127.0.0.1:8000') . '/login?status=invalid');
    }

    // 2. Validate Hash
    if (! hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
        return redirect(env('FRONTEND_URL', 'http://127.0.0.1:8000') . '/login?status=invalid');
    }

    // 3. Check if Already Verified
    if ($user->hasVerifiedEmail()) {
        return redirect(env('FRONTEND_URL', 'http://127.0.0.1:8000') . '/login?status=already_verified');
    }

    // 4. Mark as Verified & Activate
    if ($user->markEmailAsVerified()) {
        event(new Verified($user));
        
        // Force Activate Account
        $user->forceFill([
            'status' => 'active'
        ])->save();
    }

    return redirect(env('FRONTEND_URL', 'http://127.0.0.1:8000') . '/login?status=verified');

})->name('verification.verify.api');