<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class UserCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public $password;

    public $verificationUrl;

    /**
     * Create a new message instance.
     */
    public function __construct($user, $password, $verificationUrl)
    {
        $this->user = $user;
        $this->password = $password;
        $this->verificationUrl = $verificationUrl;
    }

    /**
     * Get the message layout.
     */
    public function build()
    {
        return $this->subject('Welcome to SmartEnroll - Account Credentials')
            ->view('emails.user_credentials');
    }
}
