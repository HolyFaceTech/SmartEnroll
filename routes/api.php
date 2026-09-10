<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\Api\PublicEnrollmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CORController;
use App\Http\Controllers\EnrollmentSettingController;
use App\Http\Controllers\RecycleBinController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\StrandController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VerificationController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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

// Authentication
Route::post('/login', [AuthController::class, 'login']);
Route::post('/email/resend', [AuthController::class, 'resendVerification']);
Route::post('/forgot-password', [AuthController::class, 'sendResetLinkEmail']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Private routes
Route::middleware('auth:sanctum')->group(function () {

    // user info who login
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- ADMIN DASHBOARD ---
    Route::get('/admin/analytics', [AdminController::class, 'getAnalytics']);

    // user
    Route::middleware('throttle:15,1')->group(function () {
        Route::post('users/import', [UserController::class, 'importUsers']);
        Route::post('users/bulk-delete', [UserController::class, 'bulkDelete']);
        Route::resource('users', UserController::class);
    });

    // strand
    Route::middleware('throttle:60,1')->group(function () {
        Route::post('strands/bulk-delete', [StrandController::class, 'bulkDelete']);
        Route::get('strands/export-csv', [StrandController::class, 'exportCsv']);
        Route::get('strands/export-pdf', [StrandController::class, 'exportPdf']);
        Route::apiResource('strands', StrandController::class);
    });

    // Subjects
    Route::middleware('throttle:60,1')->group(function () {
        Route::post('subjects/bulk-delete', [SubjectController::class, 'bulkDelete']);
        Route::post('subjects/import', [SubjectController::class, 'import']);
        Route::apiResource('subjects', SubjectController::class);
    });

    // Sections
    Route::middleware('throttle:60,1')->group(function () {
        Route::post('sections/bulk-delete', [SectionController::class, 'bulkDelete']);
        Route::get('sections/export-csv', [SectionController::class, 'exportCsv']);
        Route::get('sections/export-pdf', [SectionController::class, 'exportPdf']);
        Route::apiResource('sections', SectionController::class);
    });

    // --- STUDENT MANAGEMENT ---
    Route::apiResource('students', StudentController::class);
    Route::put('/students/{id}/status', [StudentController::class, 'changeStatus']); // Change Status (Passed, Released, etc.)

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

// download strand masterlist
Route::get('/download/strand-masterlist/{strand}', [StrandController::class, 'downloadStrandMasterlist'])
    ->name('strand.masterlist.download')
    ->middleware('signed');

// download section masterlist
Route::get('/download/section-masterlist/{section}', [SectionController::class, 'downloadSectionMasterlist'])
    ->name('section.masterlist.download')
    ->middleware('signed');

// emails
Route::get('/email/verify/{id}/{hash}', [VerificationController::class, 'verify'])
    ->name('verification.verify.api');
