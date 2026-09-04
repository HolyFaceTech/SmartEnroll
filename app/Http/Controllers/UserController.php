<?php

namespace App\Http\Controllers;

use App\Mail\UserCredentialsMail;
use App\Mail\UserUpdatedMail;
use App\Models\ActivityLog;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    // security
    private function checkAccess($authUser)
    {
        if (! in_array($authUser->role, ['admin', 'head'])) {
            abort(403, 'Unauthorized Access. You do not have permission to perform this action.');
        }
    }

    // read
    public function index(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $query = User::query();

            if ($authUser->role === 'head') {
                $query->whereIn('role', ['head', 'staff']);
            }

            if ($search = $request->search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('role', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhere('contact_number', 'like', "%{$search}%")
                        ->orWhere('birthday', 'like', "%{$search}%")
                        ->orWhere('gender', 'like', "%{$search}%");
                });
            }

            $perPage = $request->per_page ?? 10;
            $users = $query->latest()->paginate($perPage);

            return response()->json($users);

        } catch (Exception $e) {
            Log::error('UserController index Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Failed to load user records. Please check your connection and try again.'], 500);
        }
    }

    // create
    public function store(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            if ($authUser->role === 'head' && $request->role !== 'staff') {
                return response()->json(['message' => 'Unauthorized Action: You only have permission to create staff accounts.'], 403);
            }

            $customMessages = [
                'email.unique' => 'This email address is already registered to another user.',
                'password.min' => 'The password is too short. It must be at least 8 characters long.',
                'role.in' => 'Please select a valid user role (Admin, Head, or Staff).',
                'gender.in' => 'Please select a valid gender option.',
            ];

            $validated = $request->validate([
                'first_name' => 'required|string',
                'last_name' => 'required|string',
                'middle_name' => 'nullable|string',
                'suffix' => 'nullable|string',
                'email' => 'required|email|unique:users,email',
                'password' => [
                    'required',
                    Password::min(8)->mixedCase()->numbers()->symbols(),
                ],
                'role' => 'required|in:admin,head,staff',
                'status' => 'required|in:active,inactive',
                'contact_number' => 'required',
                'birthday' => 'required|date',
                'gender' => 'required|in:Male,Female',
            ], $customMessages);

            $userData = $validated;
            $userData['password'] = Hash::make($validated['password']);

            $user = User::create($userData);
            $fullName = trim("{$user->first_name} {$user->last_name}");

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'create',
                'description' => "Created new user account: {$fullName} ({$user->role})",
                'ip_address' => $request->ip(),
            ]);

            try {
                $verificationUrl = URL::temporarySignedRoute(
                    'verification.verify.api',
                    Carbon::now()->addHours(24),
                    ['id' => $user->id, 'hash' => sha1($user->email)]
                );
                Mail::to($user->email)->send(new UserCredentialsMail($user, $validated['password'], $verificationUrl));
            } catch (Exception $mailError) {
                Log::warning('UserController store Mail Error: '.$mailError->getMessage());
            }

            return response()->json(['message' => 'User account successfully created!'], 201);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('UserController store Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Unable to create user account due to a server error. Please try again later.'], 500);
        }
    }

    // update
    public function update(Request $request, $id)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $user = User::find($id);
            if (! $user) {
                return response()->json(['message' => 'Update Failed: User record no longer exists or was already deleted.'], 404);
            }

            if ($authUser->role === 'head') {
                if (in_array($user->role, ['admin', 'head'])) {
                    return response()->json(['message' => 'Permission Denied: You cannot modify Administrator or Head accounts.'], 403);
                }
                if ($request->role !== 'staff') {
                    return response()->json(['message' => 'Permission Denied: You can only assign the "Staff" role.'], 403);
                }
            }

            $customMessages = [
                'email.unique' => 'This email address is already in use by another user account.',
                'password.min' => 'The new password must be at least 8 characters long.',
            ];

            $validated = $request->validate([
                'first_name' => 'required|string',
                'last_name' => 'required|string',
                'middle_name' => 'nullable|string',
                'suffix' => 'nullable|string',
                'email' => 'required|email|unique:users,email,'.$id,
                'role' => 'required|in:admin,head,staff',
                'status' => 'required|in:active,inactive',
                'contact_number' => 'required',
                'birthday' => 'required|date',
                'gender' => 'required|in:Male,Female',
            ], $customMessages);

            $plainPassword = null;
            if ($request->filled('password')) {
                $request->validate([
                    'password' => [Password::min(8)->mixedCase()->numbers()->symbols()],
                ]);
                $plainPassword = $request->password;
                $validated['password'] = Hash::make($plainPassword);
            }

            $incomingBirthday = Carbon::parse($validated['birthday'])->format('Y-m-d');
            $existingBirthday = $user->birthday ? Carbon::parse($user->birthday)->format('Y-m-d') : null;

            if ($existingBirthday === $incomingBirthday) {
                unset($validated['birthday']);
            } else {
                $validated['birthday'] = $incomingBirthday;
            }

            $user->fill($validated);

            if ($request->status === 'inactive') {
                $user->email_verified_at = null;
            }

            $changes = $user->getDirty();
            unset($changes['updated_at']);
            unset($changes['email_verified_at']);

            if (array_key_exists('birthday', $changes)) {
                $changes['birthday'] = Carbon::parse($changes['birthday'])->format('Y-m-d');
            }

            if ($plainPassword && array_key_exists('password', $changes)) {
                $changes['password'] = $plainPassword;
            }

            $user->save();
            $fullName = trim("{$user->first_name} {$user->last_name}");

            ActivityLog::create([
                'user_id' => $authUser->id,
                'action' => 'update',
                'description' => "Updated user account details for: {$fullName}",
                'ip_address' => $request->ip(),
            ]);

            $emailStatusMessage = '';

            if (! empty($changes)) {
                try {
                    Mail::to($user->email)->send(new UserUpdatedMail($user, $changes));
                    $emailStatusMessage = 'User successfully updated & notification email sent!';
                } catch (Exception $mailError) {
                    Log::warning('UserController update Mail Error: '.$mailError->getMessage());
                    $emailStatusMessage = 'User successfully updated, but the notification email failed to send.';
                }
            } else {
                $emailStatusMessage = 'Saved successfully (No changes were made).';
            }

            return response()->json([
                'message' => $emailStatusMessage,
                'user' => $user,
            ]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('UserController update Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Unable to update user account due to a server problem. Please try again.'], 500);
        }
    }

    // single delete
    public function destroy($id)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            if ($authUser->id == $id) {
                return response()->json(['message' => 'Action Blocked: You cannot delete your currently active account.'], 403);
            }

            $user = User::find($id);

            if ($user) {
                if ($authUser->role === 'head' && in_array($user->role, ['admin', 'head'])) {
                    return response()->json(['message' => 'Permission Denied: You are not authorized to delete this account level.'], 403);
                }

                $fullName = trim("{$user->first_name} {$user->last_name}");
                $user->delete();

                ActivityLog::create([
                    'user_id' => $authUser->id,
                    'action' => 'delete',
                    'description' => "Deleted user account: {$fullName}",
                    'ip_address' => request()->ip(),
                ]);

                return response()->json(['message' => 'User account has been successfully deleted.']);
            }

            return response()->json(['message' => 'Deletion Failed: User not found or was already removed.'], 404);

        } catch (Exception $e) {
            Log::error('UserController destroy Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'An error occurred while deleting the user. Please check your network and try again.'], 500);
        }
    }

    // bulk delete
    public function bulkDelete(Request $request)
    {
        try {
            $authUser = Auth::user();
            $this->checkAccess($authUser);

            $request->validate([
                'ids' => 'required|array|max:50',
                'ids.*' => 'exists:users,id',
            ], [
                'ids.max' => 'You can only delete up to 50 users at a single time.',
            ]);

            $ids = $request->ids;
            $ids = array_diff($ids, [$authUser->id]);

            $users = User::whereIn('id', $ids)->get();
            $deletedCount = 0;

            foreach ($users as $user) {
                if ($authUser->role === 'head' && in_array($user->role, ['admin', 'head'])) {
                    continue;
                }

                $fullName = trim("{$user->first_name} {$user->last_name}");
                $user->delete();
                $deletedCount++;

                ActivityLog::create([
                    'user_id' => $authUser->id,
                    'action' => 'delete',
                    'description' => "Bulk Deleted user account: {$fullName}",
                    'ip_address' => $request->ip(),
                ]);
            }

            if ($deletedCount === 0) {
                return response()->json(['message' => 'No accounts were deleted. You may lack permission for the selected users.'], 403);
            }

            return response()->json(['message' => "Successfully deleted {$deletedCount} selected user(s)."]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('UserController bulkDelete Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'Unable to process bulk deletion due to a server error. Please try again.'], 500);
        }
    }

    // import
    public function importUsers(Request $request)
    {
        try {
            $authUser = Auth::user();

            if ($authUser->role !== 'admin') {
                return response()->json(['message' => 'Permission Denied: Only Administrators are allowed to import users.'], 403);
            }

            $request->validate([
                'file' => 'required|file|mimes:csv,txt|max:2048',
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
            $requiredHeaders = ['first_name', 'last_name', 'email', 'role', 'status', 'contact_number', 'birthday', 'gender'];

            $missingHeaders = array_diff($requiredHeaders, $header);
            if (! empty($missingHeaders)) {
                $missingStr = implode(', ', $missingHeaders);

                return response()->json(['message' => "Import Failed: Your CSV is missing required columns ({$missingStr})."], 422);
            }

            $importedCount = 0;
            $skippedCount = 0;
            $errorMessages = [];
            $safeSymbols = '!@#$%^&*()_+';

            foreach ($rows as $index => $row) {
                $rowNum = $index + 2;

                if (count($header) !== count($row)) {
                    $skippedCount++;
                    $errorMessages[] = "Row {$rowNum}: Incomplete data or empty row.";

                    continue;
                }
                $data = array_combine($header, $row);

                $validator = Validator::make($data, [
                    'first_name' => 'required|string',
                    'last_name' => 'required|string',
                    'email' => 'required|email',
                    'role' => 'required|in:admin,head,staff',
                    'status' => 'required|in:active,inactive',
                    'contact_number' => 'required',
                    'birthday' => 'required|date',
                    'gender' => 'required|in:Male,Female',
                ]);

                if ($validator->fails()) {
                    $skippedCount++;
                    $errorMessages[] = "Row {$rowNum} ({$data['first_name']}): ".$validator->errors()->first();

                    continue;
                }

                if (User::where('email', $data['email'])->exists()) {
                    $skippedCount++;
                    $errorMessages[] = "Row {$rowNum}: Email ({$data['email']}) is already in use.";

                    continue;
                }

                $plainPassword = str_shuffle(
                    Str::random(8).
                    $safeSymbols[rand(0, strlen($safeSymbols) - 1)].
                    rand(0, 9).
                    strtoupper(Str::random(1)).
                    strtolower(Str::random(1))
                );

                $user = User::create([
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'middle_name' => $data['middle_name'] ?? null,
                    'suffix' => $data['suffix'] ?? null,
                    'email' => $data['email'],
                    'password' => Hash::make($plainPassword),
                    'role' => strtolower($data['role']),
                    'status' => strtolower($data['status']),
                    'contact_number' => $data['contact_number'],
                    'birthday' => $data['birthday'],
                    'gender' => $data['gender'],
                ]);

                $fullName = trim("{$user->first_name} {$user->last_name}");

                ActivityLog::create([
                    'user_id' => $authUser->id,
                    'action' => 'create',
                    'description' => "Imported user account: {$fullName} ({$user->role})",
                    'ip_address' => $request->ip(),
                ]);

                try {
                    $verificationUrl = URL::temporarySignedRoute(
                        'verification.verify.api',
                        Carbon::now()->addHours(24),
                        ['id' => $user->id, 'hash' => sha1($user->email)]
                    );
                    Mail::to($user->email)->send(new UserCredentialsMail($user, $plainPassword, $verificationUrl));
                } catch (Exception $mailError) {
                    Log::warning('UserController importUsers Mail Error for '.$data['email'].': '.$mailError->getMessage());
                }

                $importedCount++;
            }

            if ($importedCount > 0 && $skippedCount == 0) {
                return response()->json(['message' => "Success! {$importedCount} user(s) imported without errors."]);
            } elseif ($importedCount > 0 && $skippedCount > 0) {
                $errStr = implode(' | ', array_slice($errorMessages, 0, 2));
                $more = count($errorMessages) > 2 ? ' (and more...)' : '';

                return response()->json(['message' => "Imported {$importedCount} user(s), but skipped {$skippedCount} row(s). Details: {$errStr}{$more}"]);
            } else {
                $errStr = implode(' | ', array_slice($errorMessages, 0, 2));
                $more = count($errorMessages) > 2 ? ' (and more...)' : '';

                return response()->json(['message' => "Import Failed: All rows contained errors. Details: {$errStr}{$more}"], 422);
            }

        } catch (Exception $e) {
            Log::error('UserController importUsers Error: '.$e->getMessage().' on line '.$e->getLine());

            return response()->json(['message' => 'A server error interrupted the import process. Please try again.'], 500);
        }
    }
}
