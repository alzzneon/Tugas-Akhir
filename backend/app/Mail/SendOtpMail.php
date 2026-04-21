<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SendOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public string $titleText;

    public function __construct(string $otp, string $titleText = 'Kode OTP')
    {
        $this->otp = $otp;
        $this->titleText = $titleText;
    }

    public function build(): self
    {
        return $this->subject($this->titleText)
            ->view('emails.otp');
    }
}