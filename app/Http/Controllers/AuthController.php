<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    // login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'recaptcha_token' => 'required|string', 
        ]);

        $recaptchaResponse = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => env('RECAPTCHA_SECRET_KEY'),
            'response' => $request->recaptcha_token,
            'remoteip' => $request->ip() 
        ]);

        $recaptchaData = $recaptchaResponse->json();

        if (!$recaptchaData['success']) {
            return response()->json(['message' => 'reCAPTCHA verification failed. Please try again.'], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials. Please try again.'], 401);
        }

        if (!$user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email is not verified.', 'needs_verification' => true], 403);
        }

        if (!in_array($user->role, ['super_admin', 'admin', 'staff'])) {
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'login',
            'description' => "User {$user->name} ({$user->role}) logged in.",
            'ip_address' => $request->ip()
        ]);

        $user->update(['login_at' => now()]);
        
        return response()->json([
            'message' => 'Login successful!',
            'user' => $user,
            'role' => $user->role,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    // logout
    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'logout',
                'description' => "User {$user->name} logged out.",
                'ip_address' => $request->ip()
            ]);
            $user->currentAccessToken()->delete();
        }
        return response()->json(['message' => 'Logged out successfully']);
    }

    // forgot password
    public function sendResetLinkEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'Password reset link sent!']);
        }
        return response()->json(['message' => 'Unable to send reset link.'], 400);
    }

    // reset
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => [
                'required', 
                'confirmed', 
                PasswordRule::min(8)
                    ->mixedCase() 
                    ->numbers() 
                    ->symbols() 
            ],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password) 
                ])->setRememberToken(Str::random(60));
                $user->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            $user = User::where('email', $request->email)->first();
            
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Password reset success', 
                'role' => $user->role, 
                'verified' => $user->hasVerifiedEmail(),
                'token' => $token,    
                'user' => $user
            ]);
        }

        return response()->json(['message' => 'Invalid token or email.'], 400);
    }

    // resend verification
    public function resendVerification(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if (!$user) return response()->json(['message' => 'Verification link sent.']);
        if ($user->hasVerifiedEmail()) return response()->json(['message' => 'Email is already verified.']);

        $user->sendEmailVerificationNotification();
        return response()->json(['message' => 'Verification link sent to your email!']);
    }
}