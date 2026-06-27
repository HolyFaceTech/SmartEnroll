<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Status;
use Carbon\Carbon;
use App\Http\Controllers\AdminController;

class SuperAdminDashboardController extends Controller
{
    public function getAnalytics(Request $request)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized Access.'], 403);
        }

        $adminController = new AdminController();
        $adminResponse = $adminController->getAnalytics($request);
        $data = $adminResponse->getData(true); 
        $loginLabels = [];
        $loginCounts = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $loginLabels[] = $date->format('D');
            $count = User::whereDate('login_at', $date->format('Y-m-d'))->count();
            $loginCounts[] = $count;
        }

        $pendingStatuses = Status::where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($status) {
                return [
                    'id' => $status->id,
                    'title' => $status->title,
                    'type' => $status->type ?? 'System Update',
                    'dueDate' => $status->end_at ? Carbon::parse($status->end_at)->format('M d, Y') : 'No Target Date',
                    'isDone' => false 
                ];
            });

        $data['super_admin'] = [
            'login_activity' => [
                'labels' => $loginLabels,
                'data' => $loginCounts
            ],
            'pending_statuses' => $pendingStatuses
        ];

        return response()->json($data);
    }

    public function toggleStatus(Request $request, $id)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $status = Status::findOrFail($id);
        $status->status = $request->isDone ? 'completed' : 'pending';
        $status->save();
        
        return response()->json(['message' => 'Status updated successfully!']);
    }
}