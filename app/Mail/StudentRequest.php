<?php

namespace App\Mail;

use App\Models\Request as DocumentRequest;
use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentRequest extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $student;

    public $documentRequest;

    /**
     * Create a new message instance.
     */
    public function __construct(Student $student, DocumentRequest $documentRequest)
    {
        $this->student = $student;
        $this->documentRequest = $documentRequest;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Document Request Received - SmartEnroll'
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.student_request'
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
