<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CORController;
use App\Http\Controllers\EnrollmentSettingController;
use App\Http\Controllers\KeepsController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\RecycleBinController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RequestController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\StrandController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VerificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/** Public */
Route::group(['prefix' => 'public'], function () {
    Route::get('/settings', [PublicController::class, 'getSettings']);
    Route::get('/strands', [PublicController::class, 'getStrands']);

    /** About Enrollments */
    Route::middleware('throttle:30,1')->group(function () {
        Route::post('/check-lrn', [PublicController::class, 'checkLrn']);
        Route::post('/check-status', [PublicController::class, 'checkStatus']);
    });
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/enroll', [PublicController::class, 'enrollNew']);
    });

    /** Request Form */
    Route::middleware('throttle:30,1')->group(function () {
        Route::post('/verify-request', [PublicController::class, 'verifyForRequest']);
    });
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/submit-request', [PublicController::class, 'submitRequest']);
    });
});

/** Authentication */
Route::post('/login', [AuthController::class, 'login']);
Route::post('/email/resend', [AuthController::class, 'resendVerification']);
Route::post('/forgot-password', [AuthController::class, 'sendResetLinkEmail']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

/** Private */
Route::middleware('auth:sanctum')->group(function () {

    // user info who login
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    /** Log Out */
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- ADMIN DASHBOARD ---
    Route::get('/admin/analytics', [AdminController::class, 'getAnalytics']);

    /** User */
    Route::middleware('throttle:15,1')->group(function () {
        Route::post('users/import', [UserController::class, 'importUsers']);
        Route::post('users/bulk-delete', [UserController::class, 'bulkDelete']);
        Route::resource('users', UserController::class);
    });

    /** Strand */
    Route::middleware('throttle:60,1')->group(function () {
        Route::post('strands/bulk-delete', [StrandController::class, 'bulkDelete']);
        Route::get('strands/export-csv', [StrandController::class, 'exportCsv']);
        Route::get('strands/export-pdf', [StrandController::class, 'exportPdf']);
        Route::apiResource('strands', StrandController::class);
    });

    /** Subject */
    Route::middleware('throttle:60,1')->group(function () {
        Route::post('subjects/bulk-delete', [SubjectController::class, 'bulkDelete']);
        Route::post('subjects/import', [SubjectController::class, 'import']);
        Route::apiResource('subjects', SubjectController::class);
    });

    /** Section */
    Route::middleware('throttle:60,1')->group(function () {
        Route::post('sections/bulk-delete', [SectionController::class, 'bulkDelete']);
        Route::get('sections/export-csv', [SectionController::class, 'exportCsv']);
        Route::get('sections/export-pdf', [SectionController::class, 'exportPdf']);
        Route::apiResource('sections', SectionController::class);
    });

    /** Student */
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::post('students/bulk-delete', [StudentController::class, 'bulkDelete']);
        Route::post('students/import', [StudentController::class, 'importStudents']);
        Route::apiResource('students', StudentController::class);
        Route::put('students/{id}/status', [StudentController::class, 'changeStatus']);

        /** COR */
        Route::get('students/{id}/cor-data', [CORController::class, 'getCORData']);
        Route::post('cor/generate-url', [CORController::class, 'generateUrl']);
    });

    /** Keeps */
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('keeps', [KeepsController::class, 'index']);
        Route::get('keeps/{id}', [KeepsController::class, 'show']);
        Route::post('keeps/{id}/download-zip', [KeepsController::class, 'downloadZip']);
        Route::post('keeps/{id}/delete-files', [KeepsController::class, 'deleteFiles']);
    });

    /** Requests */
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::post('staff/requests/bulk-delete', [RequestController::class, 'bulkDelete']);
        Route::get('staff/requests', [RequestController::class, 'index']);
        Route::delete('staff/requests/{id}', [RequestController::class, 'destroy']);
        Route::put('staff/requests/{id}/status', [RequestController::class, 'changeStatus']); // BAGONG ROUTE
    });

    // --- Reports ---
    Route::get('/reports/summary', [ReportController::class, 'generateSummary']);
    Route::get('/reports/masterlist', [ReportController::class, 'exportMasterlist']);

    /** enrollment Setting */
    Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('/settings', [EnrollmentSettingController::class, 'index']);
        Route::post('/settings', [EnrollmentSettingController::class, 'store']);
        Route::put('/settings', [EnrollmentSettingController::class, 'update']);
        Route::delete('/settings/{id?}', [EnrollmentSettingController::class, 'destroy']);

        /** Maintenance Mode */
        Route::put('/settings/maintenance', [MaintenanceController::class, 'toggleMaintenance']);
    });

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

/**
 * Public but Secured by Signatories
 */

/** Print COR */
Route::get('/print/cor/{id}', [CORController::class, 'printCOR'])
    ->name('cor.print')
    ->middleware('signed');

/** Download Strand Masterlist */
Route::get('/download/strand-masterlist/{strand}', [StrandController::class, 'downloadStrandMasterlist'])
    ->name('strand.masterlist.download')
    ->middleware('signed');

/** Download Section Masterlist */
Route::get('/download/section-masterlist/{section}', [SectionController::class, 'downloadSectionMasterlist'])
    ->name('section.masterlist.download')
    ->middleware('signed');

/** Email Verification */
Route::get('/email/verify/{id}/{hash}', [VerificationController::class, 'verify'])
    ->name('verification.verify.api');
