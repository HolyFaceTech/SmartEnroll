<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use ZipArchive;

class KeepsController extends Controller
{
    /** Security Role */
    private function checkAccess($authUser)
    {
        if (! in_array($authUser->role, ['admin', 'head', 'staff'])) {
            abort(403, 'Unauthorized Access. You do not have permission to manage keeps.');
        }
    }

    /** Folders Grid */
    public function index(Request $request)
    {
        try {
            $this->checkAccess(Auth::user());

            $query = Student::with('requirement');

            if ($search = $request->search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('lrn', 'like', "%{$search}%")
                        ->orWhere('student_number', 'like', "%{$search}%");
                });
            }

            $perPage = $request->per_page ?? 10;

            return response()->json($query->latest()->paginate($perPage));

        } catch (\Throwable $e) {
            Log::error('KeepsController index Error: '.$e->getMessage());

            return response()->json(['message' => 'Failed to load folders: '.$e->getMessage()], 500);
        }
    }

    /** Files Grid */
    public function show(Request $request, $id)
    {
        try {
            $this->checkAccess(Auth::user());
            $student = Student::with('requirement')->findOrFail($id);

            $files = [];
            $fileCols = ['psa', 'form_137', 'good_moral', 'diploma', 'form_138', 'photo_2x2'];

            $searchTerm = $request->search ? strtolower($request->search) : null;

            if ($student->requirement) {
                foreach ($fileCols as $col) {
                    if (! empty($student->requirement->$col)) {
                        $cleanPath = ltrim($student->requirement->$col, '/');
                        $fullPath = storage_path('app/public/'.str_replace('/', DIRECTORY_SEPARATOR, $cleanPath));

                        if (file_exists($fullPath)) {
                            $category = strtoupper(str_replace('_', ' ', $col));
                            $name = basename($fullPath);

                            if ($searchTerm) {
                                if (! str_contains(strtolower($category), $searchTerm) && ! str_contains(strtolower($name), $searchTerm)) {
                                    continue;
                                }
                            }

                            $files[] = [
                                'id' => $col,
                                'category' => $category,
                                'name' => $name,
                                'path' => asset('storage/'.$cleanPath),
                                'size' => filesize($fullPath),
                                'extension' => pathinfo($fullPath, PATHINFO_EXTENSION),
                            ];
                        }
                    }
                }
            }

            return response()->json([
                'student' => $student,
                'files' => $files,
            ]);

        } catch (\Throwable $e) {
            Log::error('KeepsController show Error: '.$e->getMessage());

            return response()->json(['message' => 'Failed to load files: '.$e->getMessage()], 500);
        }
    }

    /** Download ZIP */
    public function downloadZip(Request $request, $id)
    {
        try {
            $this->checkAccess(Auth::user());
            $request->validate(['files' => 'required|array']);

            $student = Student::with('requirement')->findOrFail($id);
            $lrn = trim($student->lrn);

            $requestedFiles = $request->input('files', []);

            $zip = new ZipArchive;
            $zipFileName = $lrn.'_files_'.time().'.zip';
            $zipPath = storage_path('app/temp/'.$zipFileName);

            if (! File::isDirectory(storage_path('app/temp'))) {
                File::makeDirectory(storage_path('app/temp'), 0755, true, true);
            }

            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
                $hasFiles = false;

                if ($student->requirement) {
                    foreach ($requestedFiles as $col) {
                        if (in_array($col, ['psa', 'form_137', 'good_moral', 'diploma', 'form_138', 'photo_2x2']) && ! empty($student->requirement->$col)) {
                            $cleanPath = ltrim($student->requirement->$col, '/');
                            $fullPath = storage_path('app/public/'.str_replace('/', DIRECTORY_SEPARATOR, $cleanPath));

                            if (file_exists($fullPath)) {
                                $cleanFileName = preg_replace('/^[0-9]+_/', '', basename($fullPath));
                                $zip->addFile($fullPath, $cleanFileName);
                                $hasFiles = true;
                            }
                        }
                    }
                }
                $zip->close();

                if (! $hasFiles) {
                    if (file_exists($zipPath)) {
                        @unlink($zipPath);
                    }

                    return response()->json(['message' => 'No physical files found to ZIP.'], 404);
                }

                return response()->download($zipPath)->deleteFileAfterSend(true);
            }

            return response()->json(['message' => 'Failed to create ZIP file on the server.'], 500);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('KeepsController downloadZip Error: '.$e->getMessage());

            return response()->json(['message' => 'Backend Error: '.$e->getMessage()], 500);
        }
    }

    /** Delete File/s (Single & Bulk) */
    public function deleteFiles(Request $request, $id)
    {
        try {
            $this->checkAccess(Auth::user());
            $request->validate(['files' => 'required|array']);

            $student = Student::with('requirement')->findOrFail($id);
            $deletedCount = 0;
            $reqUpdate = [];

            $requestedFiles = $request->input('files', []);

            if ($student->requirement) {
                foreach ($requestedFiles as $col) {
                    if (in_array($col, ['psa', 'form_137', 'good_moral', 'diploma', 'form_138', 'photo_2x2'])) {
                        if (! empty($student->requirement->$col)) {
                            $cleanPath = ltrim($student->requirement->$col, '/');
                            $fullPath = storage_path('app/public/'.str_replace('/', DIRECTORY_SEPARATOR, $cleanPath));

                            if (file_exists($fullPath)) {
                                @chmod($fullPath, 0777);
                                @unlink($fullPath);
                            }

                            $reqUpdate[$col] = null;
                            $deletedCount++;
                        }
                    }
                }

                if (! empty($reqUpdate)) {
                    $student->requirement->update($reqUpdate);
                }
            }

            if ($deletedCount === 0) {
                return response()->json(['message' => 'No files were deleted. They might have been removed already.'], 404);
            }

            return response()->json(['message' => "Successfully deleted {$deletedCount} file(s)."]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('KeepsController deleteFiles Error: '.$e->getMessage());

            return response()->json(['message' => 'Backend Error: '.$e->getMessage()], 500);
        }
    }
}
