<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password as PasswordBroker;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    // login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'recaptcha_token' => 'required',
        ]);

        try {
            $throttleKey = Str::transliterate(Str::lower($request->email).'|login');

            if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
                $seconds = RateLimiter::availableIn($throttleKey);

                return response()->json([
                    'message' => "Too many login attempts. Please try again in {$seconds} seconds.",
                ], 429);
            }

            $recaptcha = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => env('RECAPTCHA_SECRET_KEY'),
                'response' => $request->recaptcha_token,
                'remoteip' => $request->ip(),
            ]);

            if (! $recaptcha->json('success')) {
                RateLimiter::hit($throttleKey);

                return response()->json(['message' => 'ReCAPTCHA verification failed. Please try again.'], 403);
            }

            $user = User::where('email', $request->email)->first();

            if (! $user || ! Hash::check($request->password, $user->password)) {
                RateLimiter::hit($throttleKey);

                return response()->json(['message' => 'Invalid credentials. Please try again.'], 401);
            }

            if (! $user->hasVerifiedEmail()) {
                return response()->json(['message' => 'Email is not verified.', 'needs_verification' => true], 403);
            }

            if (! in_array($user->role, ['admin', 'head', 'staff'])) {
                RateLimiter::hit($throttleKey);

                return response()->json(['message' => 'Unauthorized access.'], 403);
            }

            RateLimiter::clear($throttleKey);
            $token = $user->createToken('auth_token')->plainTextToken;

            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'login',
                'description' => "User {$user->name} ({$user->role}) logged in.",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Login successful!',
                'user' => $user,
                'role' => $user->role,
                'access_token' => $token,
                'token_type' => 'Bearer',
            ]);

        } catch (Exception $e) {
            Log::error('AuthController login Error: '.$e->getMessage().' on line '.$e->getLine().' in '.$e->getFile());

            return response()->json(['message' => 'An unexpected error occurred during login. Please try again later.'], 500);
        }
    }

    // logout
    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            if ($user) {
                ActivityLog::create([
                    'user_id' => $user->id,
                    'action' => 'logout',
                    'description' => "User {$user->name} logged out.",
                    'ip_address' => $request->ip(),
                ]);
                $user->currentAccessToken()->delete();
            }

            return response()->json(['message' => 'Logged out successfully']);

        } catch (Exception $e) {
            Log::error('AuthController logout Error: '.$e->getMessage().' on line '.$e->getLine().' in '.$e->getFile());

            return response()->json(['message' => 'An unexpected error occurred during logout. Please try again later.'], 500);
        }
    }

    // forgot password
    public function sendResetLinkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'recaptcha_token' => 'required',
        ]);

        try {
            $throttleKey = Str::transliterate(Str::lower($request->email).'|forgot-password');

            if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
                $seconds = RateLimiter::availableIn($throttleKey);

                return response()->json([
                    'message' => "Too many requests. Please try again in {$seconds} seconds.",
                ], 429);
            }

            $recaptcha = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => env('RECAPTCHA_SECRET_KEY'),
                'response' => $request->recaptcha_token,
            ]);

            if (! $recaptcha->json('success')) {
                RateLimiter::hit($throttleKey);

                return response()->json(['message' => 'ReCAPTCHA verification failed.'], 403);
            }

            $status = PasswordBroker::sendResetLink($request->only('email'));

            if ($status === PasswordBroker::RESET_LINK_SENT) {
                RateLimiter::hit($throttleKey);

                return response()->json(['message' => 'Password reset link sent!']);
            }

            RateLimiter::hit($throttleKey);

            return response()->json(['message' => 'Unable to send reset link.'], 400);

        } catch (Exception $e) {
            Log::error('AuthController sendResetLinkEmail Error: '.$e->getMessage().' on line '.$e->getLine().' in '.$e->getFile());

            return response()->json(['message' => 'An unexpected error occurred during password reset request. Please try again later.'], 500);
        }
    }

    // reset password
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ]);

        try {
            $status = PasswordBroker::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function ($user, $password) {
                    $user->forceFill([
                        'password' => Hash::make($password),
                    ])->setRememberToken(Str::random(60));
                    $user->save();
                }
            );

            if ($status === PasswordBroker::PASSWORD_RESET) {
                $user = User::where('email', $request->email)->first();
                $token = $user->createToken('auth_token')->plainTextToken;

                return response()->json([
                    'message' => 'Password reset success',
                    'role' => $user->role,
                    'verified' => $user->hasVerifiedEmail(),
                    'token' => $token,
                    'user' => $user,
                ]);
            }

            return response()->json(['message' => 'Invalid token or email.'], 400);

        } catch (Exception $e) {
            Log::error('AuthController resetPassword Error: '.$e->getMessage().' on line '.$e->getLine().' in '.$e->getFile());

            return response()->json(['message' => 'An unexpected error occurred during password reset. Please try again later.'], 500);
        }
    }

    // resend verification
    public function resendVerification(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        try {
            $throttleKey = Str::transliterate(Str::lower($request->email).'|resend-verification');

            if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
                $seconds = RateLimiter::availableIn($throttleKey);

                return response()->json([
                    'message' => "Too many requests. Please try again in {$seconds} seconds.",
                ], 429);
            }

            $user = User::where('email', $request->email)->first();

            if (! $user) {
                RateLimiter::hit($throttleKey);

                return response()->json(['message' => 'Verification link sent.']);
            }

            if ($user->hasVerifiedEmail()) {
                return response()->json(['message' => 'Email is already verified.']);
            }

            $user->sendEmailVerificationNotification();
            RateLimiter::hit($throttleKey);

            return response()->json(['message' => 'Verification link sent to your email!']);

        } catch (Exception $e) {
            Log::error('AuthController resendVerification Error: '.$e->getMessage().' on line '.$e->getLine().' in '.$e->getFile());

            return response()->json(['message' => 'An unexpected error occurred during verification resend. Please try again later.'], 500);
        }
    }
}
