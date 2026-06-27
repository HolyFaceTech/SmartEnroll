<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Email Address | SmartEnroll</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; background-color: #eeeeee;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
        <tr>
            <td style="padding: 20px 0; text-align: center;">
                
                <div style="max-width: 600px; margin: 0 auto; background-color: #fcfbf4; border: 3px solid #2d3436; padding: 0; box-shadow: 8px 8px 0px #2d3436; text-align: left;">
                    
                    <div style="background-color: #F4D03F; padding: 20px; border-bottom: 3px solid #2d3436; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; color: #2d3436;">
                            🎓 SmartEnroll
                        </h1>
                        <span style="font-size: 12px; font-weight: bold; background-color: #2d3436; color: #fff; padding: 2px 8px; margin-top: 5px; display: inline-block;">ACCOUNT VERIFICATION</span>
                    </div>

                    <div style="padding: 30px;">
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            Hello <strong>{{ strtoupper($user->first_name) }} {{ strtoupper($user->last_name) }}</strong>,
                        </p>

                        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
                            Thank you for registering with the SmartEnroll System. To ensure the security of your account and complete your registration, please verify your email address by clicking the button below.
                        </p>

                        <div style="text-align: center; margin-bottom: 25px;">
                            <a href="{{ $url }}" style="background-color: #2d3436; color: #ffffff; padding: 12px 25px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; border: 1px solid #000; text-transform: uppercase;">
                                Verify Email Address &rarr;
                            </a>
                        </div>
                        
                        <p style="font-size: 13px; color: #d63031; font-weight: bold; margin-bottom: 25px; text-align: center;">
                            If you did not create an account, no further action is required.
                        </p>

                        <hr style="border: none; border-top: 2px dashed #2d3436; margin: 30px 0;">

                        <p style="font-size: 11px; color: #636e72; text-align: left; line-height: 1.4; word-break: break-all;">
                            If you're having trouble clicking the "Verify Email Address" button, copy and paste the URL below into your web browser:<br><br>
                            <a href="{{ $url }}" style="color: #0984e3; text-decoration: underline;">{{ $url }}</a>
                        </p>
                    </div>

                    <div style="background-color: #2d3436; color: #dfe6e9; padding: 15px; text-align: center; font-size: 11px;">
                        <p style="margin: 0 0 5px 0;">This is an automated system message. Please do not reply.</p>
                        <p style="margin: 0;">&copy; {{ date('Y') }} SmartEnroll v2. All Rights Reserved.</p>
                    </div>

                </div>
            </td>
        </tr>
    </table>

</body>
</html>