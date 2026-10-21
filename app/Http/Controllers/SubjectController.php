<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Strand;
use App\Models\Subject;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class SubjectController extends Controller
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

            $query = Subject::with('strand');

            if ($request->has('search') && $request->search != '') {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('code', 'LIKE', '%'.$searchTerm.'%')
                        ->orWhere('description', 'LIKE', '%'.$searchTerm.'%');
                });
            }

            if ($request->has('strand_id') && $request->strand_id != '') {
                $query->where('strand_id', $request->strand_id);
            }

            if ($request->has('grade_level') && $request->grade_level != '') {
                $query->where('grade_level', $request->grade_level);
            }

            if ($request->has('term') && $request->term != '') {
                $query->where('term', $request->term);
            }

            $perPage = $request->input('per_page', 10);
            $subjects = $query->latest()->paginate($perPage);

            return response()->json($subjects);

        } catch (Exception $e) {
            Log::error('SubjectController index Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to load subject records.'], 500);
        }
    }

    /** Create */
    public function store(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $validated = $request->validate([
                'code' => 'required|string|max:20|unique:subjects,code',
                'description' => 'required|string',
                'strand_id' => 'required|exists:strands,id',
                'grade_level' => 'required|in:11,12',
                'term' => 'required|in:1st,2nd,3rd',
            ]);

            $subject = Subject::create($validated);

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'create',
                'description' => "Created new subject: {$subject->code}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json(['message' => 'Subject created successfully', 'subject' => $subject], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('SubjectController store Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to create subject due to server error.'], 500);
        }
    }

    /** Update */
    public function update(Request $request, $id)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $subject = Subject::findOrFail($id);

            $validated = $request->validate([
                'code' => 'required|string|max:20|unique:subjects,code,'.$id,
                'description' => 'required|string',
                'strand_id' => 'required|exists:strands,id',
                'grade_level' => 'required|in:11,12',
                'term' => 'required|in:1st,2nd,3rd',
            ]);

            $subject->update($validated);

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'update',
                'description' => "Updated subject details: {$subject->code}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json(['message' => 'Subject updated successfully', 'subject' => $subject]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('SubjectController update Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to update subject due to server error.'], 500);
        }
    }

    /** Single Delete */
    public function destroy($id)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $subject = Subject::findOrFail($id);
            $code = $subject->code;

            $subject->delete();

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'delete',
                'description' => "Deleted subject: {$code}",
                'ip_address' => request()->ip(),
            ]);

            return response()->json(['message' => 'Subject deleted successfully']);
        } catch (Exception $e) {
            Log::error('SubjectController destroy Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to delete subject.'], 500);
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
                'ids.*' => 'exists:subjects,id',
            ], [
                'ids.max' => 'You can only delete up to 50 subjects at a single time.',
            ]);

            $count = count($request->ids);
            Subject::whereIn('id', $request->ids)->delete();

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'bulk_delete',
                'description' => "Bulk deleted {$count} subjects",
                'ip_address' => $request->ip(),
            ]);

            return response()->json(['message' => "Successfully deleted {$count} subjects."]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('SubjectController bulkDelete Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to execute bulk delete.'], 500);
        }
    }

    /** Imports Subjects */
    public function import(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $request->validate([
                'file' => 'required|file|mimes:csv|max:2048',
            ], [
                'file.mimes' => 'Invalid file format. Please upload a strictly .csv file.',
                'file.max' => 'The uploaded file exceeds the 2MB size limit.',
            ]);

            $file = $request->file('file');
            $csvData = file_get_contents($file);
            $rows = array_map('str_getcsv', explode("\n", trim($csvData)));

            if (count($rows) < 2) {
                return response()->json(['message' => 'Import Failed: The CSV file appears to be empty or lacks data rows.'], 422);
            }

            $header = array_map('trim', array_shift($rows));
            $requiredHeaders = ['code', 'description', 'grade_level', 'term', 'strand_code'];

            $missingHeaders = array_diff($requiredHeaders, $header);
            if (! empty($missingHeaders)) {
                $missingStr = implode(', ', $missingHeaders);

                return response()->json(['message' => "Import Failed: Your CSV is missing required columns ({$missingStr})."], 422);
            }

            $importedCount = 0;

            DB::transaction(function () use ($rows, $header, &$importedCount, $authUser, $request) {
                $rowNumber = 2;

                foreach ($rows as $row) {
                    if (count($header) !== count($row)) {
                        throw new \Exception("Row {$rowNumber}: Missing or extra columns in this row.");
                    }

                    $data = array_combine($header, array_map('trim', $row));

                    $data = array_map(function ($value) {
                        return $value === '' ? null : $value;
                    }, $data);

                    $validator = Validator::make($data, [
                        'code' => 'required|string|max:20|unique:subjects,code',
                        'description' => 'required|string',
                        'grade_level' => 'required|in:11,12',
                        'term' => 'required|in:1st,2nd,3rd',
                        'strand_code' => 'required|string',
                    ], [
                        'code.unique' => "The subject code '{$data['code']}' is already taken in the system.",
                    ]);

                    if ($validator->fails()) {
                        throw new \Exception("Row {$rowNumber}: ".implode(', ', $validator->errors()->all()));
                    }

                    $strand = Strand::where('code', $data['strand_code'])->first();
                    if (! $strand) {
                        throw new \Exception("Row {$rowNumber}: Strand Code '{$data['strand_code']}' not found in the database.");
                    }

                    Subject::create([
                        'code' => $data['code'],
                        'description' => $data['description'],
                        'grade_level' => $data['grade_level'],
                        'term' => $data['term'],
                        'strand_id' => $strand->id,
                    ]);

                    $importedCount++;
                    $rowNumber++;
                }

                if ($importedCount > 0) {
                    ActivityLog::create([
                        'user_id' => $authUser->id,
                        'action' => 'import',
                        'description' => "Imported {$importedCount} subjects via CSV",
                        'ip_address' => $request->ip(),
                    ]);
                }
            });

            return response()->json(['message' => "Success! {$importedCount} subject(s) imported without errors."]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('SubjectController import Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
