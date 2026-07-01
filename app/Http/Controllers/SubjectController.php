<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\Strand;
use App\Models\ActivityLog; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; 

class SubjectController extends Controller
{
    // view
    public function index(Request $request)
    {
        $limit = $request->input('limit', 10);
        $search = $request->input('search', '');
        $query = Subject::with('strand')->orderBy('grade_level', 'asc')->orderBy('term', 'asc');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('strand', function($subQuery) use ($search) {
                      $subQuery->where('code', 'like', "%{$search}%");
                  });
            });
        }

        return response()->json($query->paginate($limit));
    }

    // create
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:subjects,code',
            'description' => 'required|string',
            'strand_id' => 'required|exists:strands,id', 
            'grade_level' => 'required|in:11,12',
            'term' => 'required|in:1st,2nd,3rd',
        ]);

        $subject = Subject::create($validated);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'create',
            'description' => "Created new subject: {$subject->code}",
            'ip_address' => $request->ip()
        ]);

        return response()->json(['message' => 'Subject created successfully', 'subject' => $subject]);
    }

    // update
    public function update(Request $request, $id)
    {
        $subject = Subject::find($id);
        if (!$subject) return response()->json(['message' => 'Not found'], 404);

        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:subjects,code,' . $id,
            'description' => 'required|string',
            'strand_id' => 'required|exists:strands,id',
            'grade_level' => 'required|in:11,12',
            'term' => 'required|in:1st,2nd,3rd',
        ]);

        $subject->update($validated);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'update',
            'description' => "Updated subject details: {$subject->code}",
            'ip_address' => $request->ip()
        ]);

        return response()->json(['message' => 'Subject updated successfully', 'subject' => $subject]);
    }

    // delete
    public function destroy($id)
    {
        $subject = Subject::find($id);
        if ($subject) {
            $code = $subject->code; 
            $subject->delete();

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'delete',
                'description' => "Deleted subject: {$code}",
                'ip_address' => request()->ip()
            ]);

            return response()->json(['message' => 'Subject deleted successfully']);
        }
        return response()->json(['message' => 'Not found'], 404);
    }

    // bulk delete
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:subjects,id'
        ]);

        if (empty($request->ids)) {
            return response()->json(['message' => 'No valid subjects to delete.'], 400);
        }

        Subject::whereIn('id', $request->ids)->delete();

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'delete',
            'description' => "Bulk deleted " . count($request->ids) . " subject(s).",
            'ip_address' => $request->ip()
        ]);

        return response()->json(['message' => 'Selected subjects deleted successfully.']);
    }

    // import csv
    public function importCsv(Request $request)
    {
        $request->validate(['file' => 'required|mimes:csv,txt|max:2048']);
        $file = $request->file('file');
        $csvData = array_map('str_getcsv', file($file->getRealPath()));
        array_shift($csvData);
        $count = 0;

        foreach ($csvData as $row) {
            if (count($row) < 5 || empty(trim($row[0]))) continue;

            $code = trim($row[0]);
            $description = trim($row[1]);
            $strand_code = isset($row[2]) ? trim($row[2]) : '';
            $grade_level = trim($row[3]);
            $term = trim($row[4]);

            if (empty($strand_code)) continue; 
            
            $strand = Strand::where('code', 'LIKE', "%{$strand_code}%")->first();
            if (!$strand) continue;

            Subject::updateOrCreate(
                ['code' => $code],
                [
                    'description' => $description,
                    'strand_id' => $strand->id,
                    'grade_level' => in_array($grade_level, ['11', '12']) ? $grade_level : '11',
                    'term' => in_array($term, ['1st', '2nd', '3rd']) ? $term : '1st'
                ]
            );
            $count++;
        }

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'import',
            'description' => "Imported {$count} subjects via CSV",
            'ip_address' => $request->ip()
        ]);

        return response()->json(['message' => "Successfully imported {$count} subjects."]);
    }
}