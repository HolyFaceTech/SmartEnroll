<?php

namespace App\Http\Controllers;

use App\Models\Strand;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; 

class StrandController extends Controller
{
    // view
    public function index(Request $request)
    {
        $limit = $request->input('limit', 10);
        $search = $request->input('search', '');
        
        $query = Strand::orderBy('created_at', 'desc');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($limit));
    }

    // create
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|unique:strands,code|max:20', 
            'description' => 'required|string',
        ]);

        $strand = Strand::create($validated);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'create',
            'description' => "Created new strand: {$strand->code}",
            'ip_address' => $request->ip()
        ]);

        return response()->json([
            'message' => 'Strand created successfully',
            'strand' => $strand
        ]);
    }

    // update
    public function update(Request $request, $id)
    {
        $strand = Strand::find($id);

        if (!$strand) {
            return response()->json(['message' => 'Strand not found'], 404);
        }

        $validated = $request->validate([
            'code' => 'required|max:20|unique:strands,code,' . $id,
            'description' => 'required|string',
        ]);

        $strand->update($validated);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'update',
            'description' => "Updated strand details: {$strand->code}",
            'ip_address' => $request->ip()
        ]);

        return response()->json([
            'message' => 'Strand updated successfully',
            'strand' => $strand
        ]);
    }

    // delete
    public function destroy($id)
    {
        $strand = Strand::find($id);

        if ($strand) {
            $code = $strand->code; 
            $strand->delete();

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'delete',
                'description' => "Deleted strand: {$code}",
                'ip_address' => request()->ip()
            ]);

            return response()->json(['message' => 'Strand deleted successfully']);
        }

        return response()->json(['message' => 'Strand not found'], 404);
    }

    // bilk delete
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:strands,id'
        ]);

        if (empty($request->ids)) {
            return response()->json(['message' => 'No valid strands to delete.'], 400);
        }

        Strand::whereIn('id', $request->ids)->delete();

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'delete',
            'description' => "Bulk deleted " . count($request->ids) . " strand(s).",
            'ip_address' => $request->ip()
        ]);

        return response()->json(['message' => 'Selected strands deleted successfully.']);
    }
}