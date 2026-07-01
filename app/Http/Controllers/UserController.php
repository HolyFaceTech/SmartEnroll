<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\UserCredentialsMail;
use App\Mail\UserUpdatedMail;     
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password as PasswordRule;

class UserController extends Controller
{
    // view
    public function index(Request $request)
    {
        $limit = $request->input('limit', 10);
        $search = $request->input('search', '');
        $query = User::orderBy('created_at', 'desc');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('middle_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('contact_number', 'like', "%{$search}%")
                  ->orWhere('role', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%")
                  ->orWhere('gender', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($limit));
    }

    // create
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string',
            'middle_name' => 'nullable|string',
            'last_name' => 'required|string',
            'suffix' => 'nullable|string',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', PasswordRule::min(8)->mixedCase()->numbers()->symbols()],
            'role' => 'required',
            'status' => 'required|in:active,inactive',
            'contact_number' => 'nullable|string',
            'birthday' => 'nullable|date',
            'gender' => 'nullable|string',
        ]);

        $userData = $validated;
        $userData['password'] = Hash::make($validated['password']);
        $user = User::create($userData);

        $fullName = trim("{$user->first_name} {$user->last_name}");

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'create',
            'description' => "Created new user account: {$fullName} ({$user->role})",
            'ip_address' => $request->ip()
        ]);

        try {
            $verificationUrl = URL::temporarySignedRoute(
                'verification.verify.api', 
                Carbon::now()->addHours(24),
                ['id' => $user->id, 'hash' => sha1($user->email)]
            );

            Mail::to($user->email)->send(new UserCredentialsMail($user, $validated['password'], $verificationUrl));

        } catch (\Exception $e) {
        }

        return response()->json(['message' => 'User created! Credentials sent via email.', 'user' => $user]);
    }

    // update
    public function update(Request $request, $id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $validated = $request->validate([
            'first_name' => 'required|string',
            'middle_name' => 'nullable|string',
            'last_name' => 'required|string',
            'suffix' => 'nullable|string',
            'email' => 'required|email|unique:users,email,' . $id,
            'role' => 'required',
            'status' => 'required|in:active,inactive',
            'contact_number' => 'nullable|string',
            'birthday' => 'nullable|date',
            'gender' => 'nullable|string',
            'password' => ['nullable', PasswordRule::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        $plainPassword = null;

        if ($request->filled('password')) {
            $plainPassword = $request->password; 
            $validated['password'] = Hash::make($plainPassword); 
        } else {
            unset($validated['password']);
        }

        $user->fill($validated);

        if ($request->status === 'inactive') {
            $user->email_verified_at = null;
        }

        $changes = $user->getDirty(); 

        unset($changes['updated_at']);
        unset($changes['email_verified_at']); 

        if ($plainPassword && array_key_exists('password', $changes)) {
            $changes['password'] = $plainPassword; 
        }

        $user->save();
        $fullName = trim("{$user->first_name} {$user->last_name}");

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'update',
            'description' => "Updated user account details for: {$fullName}",
            'ip_address' => $request->ip()
        ]);

        if (!empty($changes)) {
            try {
                Mail::to($user->email)->send(new UserUpdatedMail($user, $changes));
            } catch (\Exception $e) {
            }
        }

        return response()->json(['message' => 'User updated successfully!', 'user' => $user]);
    }

    // delete
    public function destroy($id)
    {
        if (auth()->id() == $id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        $user = User::find($id);
        
        if($user) {
            $userName = $user->name; 
            $user->delete();

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'delete',
                'description' => "Deleted user account: {$userName}",
                'ip_address' => request()->ip()
            ]);

            return response()->json(['message' => 'User deleted successfully']);
        }
        
        return response()->json(['message' => 'User not found'], 404);
    }

    // bulk delete
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id'
        ]);

        $idsToDelete = array_diff($request->ids, [auth()->id()]);

        if (empty($idsToDelete)) {
            return response()->json(['message' => 'No valid users to delete.'], 400);
        }

        User::whereIn('id', $idsToDelete)->delete();

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'delete',
            'description' => "Bulk deleted " . count($idsToDelete) . " user account(s).",
            'ip_address' => $request->ip()
        ]);

        return response()->json(['message' => 'Selected users deleted successfully.']);
    }
}