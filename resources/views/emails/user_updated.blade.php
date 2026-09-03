<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Updated | SmartEnroll</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; background-color: #eeeeee;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
        <tr>
            <td style="padding: 20px 0; text-align: center;">
                
                <div style="max-width: 600px; margin: 0 auto; background-color: #fcfbf4; border: 3px solid #2d3436; padding: 0; box-shadow: 8px 8px 0px #2d3436; text-align: left;">
                    
                    <div style="background-color: #F4D03F; padding: 20px; border-bottom: 3px solid #2d3436; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; color: #2d3436;">
                            🔄 Holy Face
                        </h1>
                        <span style="font-size: 12px; font-weight: bold; background-color: #2d3436; color: #fff; padding: 2px 8px; margin-top: 5px; display: inline-block;">ACCOUNT UPDATE</span>
                    </div>

                    <div style="padding: 30px;">
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            Dear <strong>{{ strtoupper($user->first_name . ' ' . $user->last_name) }}</strong>,
                        </p>

                        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                            This is an automated notification to inform you that your account profile has been modified by an administrator.
                        </p>

                        <div style="background-color: #dfe6e9; border: 2px dashed #2d3436; padding: 15px; margin-bottom: 25px;">
                            <strong style="display: block; font-size: 14px; color: #2d3436; text-transform: uppercase; margin-bottom: 15px;">
                                <span style="background-color: #2d3436; color: #fff; padding: 2px 5px;">INFO</span> SUMMARY OF CHANGES:
                            </strong>
                            
                            <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 14px;">
                                @foreach($changes as $field => $newValue)
                                    <tr>
                                        <td style="font-weight: bold; color: #636e72; width: 35%; vertical-align: top;">
                                            {{ strtoupper(str_replace('_', ' ', $field)) }}:
                                        </td>
                                        <td style="color: #2d3436; font-weight: bold; vertical-align: top;">
                                            @if($field === 'password')
                                                <span style="background-color: #fff; border: 1px solid #2d3436; color: #d63031; padding: 2px 6px; font-family: monospace; font-size: 14px;">
                                                    {{ $newValue }}
                                                </span>
                                                <div style="margin-top: 5px; font-size: 11px; color: #d63031; font-weight: normal;">
                                                    * Please keep your new password secure.
                                                </div>

                                            @elseif($field === 'status')
                                                @if($newValue == 'active')
                                                    <span style="background-color: #00b894; color: #fff; padding: 2px 6px; font-size: 12px; text-transform: uppercase;">ACTIVE</span>
                                                @else
                                                    <span style="background-color: #d63031; color: #fff; padding: 2px 6px; font-size: 12px; text-transform: uppercase;">INACTIVE</span>
                                                @endif

                                            @else
                                                {{ $newValue }}
                                            @endif
                                        </td>
                                    </tr>
                                @endforeach
                            </table>
                        </div>

                        @if($user->status === 'inactive')
                            <div style="background-color: #ffeaa7; border: 2px solid #2d3436; padding: 15px; text-align: center; margin-bottom: 25px;">
                                <strong style="display: block; font-size: 14px; color: #d63031; text-transform: uppercase; margin-bottom: 5px;">⚠️ ACCOUNT INACTIVE</strong>
                                <p style="margin: 0; font-size: 13px; color: #2d3436;">
                                    Your account is currently disabled. You will not be able to access the system until your status is reactivated.
                                </p>
                            </div>
                        @endif

                        <p style="font-size: 13px; margin-top: 25px; color: #636e72;">
                            If you did not authorize these changes, please contact the System Administrator immediately.
                        </p>
                    </div>

                    <div style="background-color: #2d3436; color: #dfe6e9; padding: 15px; text-align: center; font-size: 11px;">
                        <p style="margin: 0 0 5px 0;">This is an automated system message. Please do not reply.</p>
                        <p style="margin: 0;">&copy; {{ date('Y') }} SmartEnroll System. All Rights Reserved.</p>
                    </div>

                </div>
            </td>
        </tr>
    </table>

</body>
</html>