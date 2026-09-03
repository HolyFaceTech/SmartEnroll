<?php

namespace App\Http\Controllers;

use App\Models\User;
use Exception;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VerificationController extends Controller
{
    public function verify(Request $request, $id, $hash)
    {
        try {
            $user = User::find($id);
            $frontendUrl = env('FRONTEND_URL', 'http://127.0.0.1:8000');

            if (! $user) {
                return redirect($frontendUrl.'/login?status=invalid');
            }

            if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
                return redirect($frontendUrl.'/login?status=invalid');
            }

            if ($user->hasVerifiedEmail()) {
                return redirect($frontendUrl.'/login?status=already_verified');
            }

            if ($user->markEmailAsVerified()) {
                event(new Verified($user));
            }

            return redirect($frontendUrl.'/login?status=verified');

        } catch (Exception $e) {
            Log::error('VerificationController verify Error: '.$e->getMessage().' on line '.$e->getLine().' in '.$e->getFile());

            $frontendUrl = env('FRONTEND_URL', 'http://127.0.0.1:8000');

            return redirect($frontendUrl.'/login?status=error');
        }
    }
}
