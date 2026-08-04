<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Academic Evaluation Result | SmartEnroll</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; background-color: #eeeeee;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
        <tr>
            <td style="padding: 20px 0; text-align: center;">
                
                <div style="max-width: 600px; margin: 0 auto; background-color: #fcfbf4; border: 3px solid #2d3436; padding: 0; box-shadow: 8px 8px 0px #2d3436; text-align: left;">
                    
                    {{-- HEADER --}}
                    <div style="background-color: #F96E5B; padding: 20px; border-bottom: 3px solid #2d3436; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; color: #fff; text-shadow: 2px 2px 0 #2d3436;">
                            🎓 Holy Face
                        </h1>
                        <span style="font-size: 12px; font-weight: bold; background-color: #2d3436; color: #fff; padding: 2px 8px; margin-top: 5px; display: inline-block;">ACADEMIC ADVISORY</span>
                    </div>

                    <div style="padding: 30px;">
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            Dear <strong>{{ strtoupper($student->first_name) }} {{ strtoupper($student->last_name) }}</strong>,
                        </p>

                        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                            We are writing to inform you regarding the result of your recent academic evaluation. It appears that there are academic deficiencies or <strong>FAILED</strong> subjects that need your immediate attention before you can proceed with the next enrollment.
                        </p>

                        {{-- STUDENT INFO BOX --}}
                        <div style="background-color: #fff; border: 2px solid #2d3436; padding: 15px; margin-bottom: 25px;">
                            <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 14px;">
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">CURRENT LEVEL:</td>
                                    <td style="text-align: right; font-weight: bold;">Grade {{ $student->grade_level }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">STRAND:</td>
                                    <td style="text-align: right;">{{ $student->strand->code ?? 'N/A' }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">REMARKS:</td>
                                    <td style="text-align: right;">
                                        <span style="background-color: #f8d7da; border: 1px solid #2d3436; padding: 2px 6px; font-weight: bold; color: #721c24;">ACTION REQUIRED</span>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        {{-- INSTRUCTIONS --}}
                        <div style="background-color: #dfe6e9; border: 2px dashed #2d3436; padding: 20px; margin-bottom: 25px;">
                            <strong style="display: block; font-size: 14px; color: #2d3436; text-transform: uppercase; margin-bottom: 10px;">
                                <span style="background-color: #2d3436; color: #fff; padding: 2px 5px;">REQUIRED ACTION</span> 
                            </strong>
                            <p style="font-size: 13px; color: #2d3436; margin-bottom: 10px;">
                                To resolve this and secure your eligibility for the upcoming school year, please strictly follow these steps:
                            </p>
                            <ul style="font-size: 13px; color: #2d3436; font-weight: bold; line-height: 1.6;">
                                <li>Report to the <u>Registrar's Office</u> or <u>Faculty Office</u> immediately.</li>
                                <li>Inquire about the specific subjects you failed and the corresponding remedial classes or requirements.</li>
                                <li>Settle any outstanding deficiencies before attempting to enroll online.</li>
                            </ul>
                        </div>

                        <p style="font-size: 14px; margin-top: 25px;">
                            We are here to help you succeed. Please visit us as soon as possible so we can assist you.
                        </p>
                    </div>

                    {{-- FOOTER --}}
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