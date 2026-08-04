<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Received | SmartEnroll</title>
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
                        <span style="font-size: 12px; font-weight: bold; background-color: #2d3436; color: #fff; padding: 2px 8px; margin-top: 5px; display: inline-block;">APPLICATION RECEIVED</span>
                    </div>

                    <div style="padding: 30px;">
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            Dear <strong>{{ strtoupper($student->first_name) }} {{ strtoupper($student->last_name) }}</strong>,
                        </p>

                        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                            We formally acknowledge the receipt of your enrollment application on <strong>{{ $student->created_at->format('F d, Y') }}</strong>.
                        </p>

                        <div style="background-color: #fff; border: 2px solid #2d3436; padding: 15px; margin-bottom: 25px;">
                            <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 14px;">
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">STUDENT NUMBER:</td>
                                    <td style="text-align: right;">
                                        @if(!empty($student->student_number))
                                            <span style="font-weight: bold; color: #2d3436;">{{ $student->student_number }}</span>
                                        @else
                                            <span style="background-color: #ffeaa7; border: 1px solid #2d3436; padding: 2px 6px; font-weight: bold; color: #d35400;">PENDING</span>
                                        @endif
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">LRN REFERENCE:</td>
                                    <td style="text-align: right; font-weight: bold;">{{ $student->lrn }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">STATUS:</td>
                                    <td style="text-align: right;">
                                        <span style="background-color: #ffeaa7; border: 1px solid #2d3436; padding: 2px 6px; font-weight: bold; color: #d35400;">PENDING</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">STRAND:</td>
                                    <td style="text-align: right;">{{ $student->strand->code ?? 'N/A' }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">GRADE LEVEL:</td>
                                    <td style="text-align: right;">{{ $student->grade_level }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">TERM:</td>
                                    <td style="text-align: right;">{{ $student->term }}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="background-color: #dfe6e9; border: 2px dashed #2d3436; padding: 15px; margin-bottom: 25px;">
                            <strong style="display: block; font-size: 14px; color: #2d3436; text-transform: uppercase; margin-bottom: 10px;">
                                <span style="background-color: #2d3436; color: #fff; padding: 2px 5px;">NOTE</span> SUBMISSION INSTRUCTION:
                            </strong>
                            <p style="margin: 0; font-size: 13px; color: #2d3436;">
                                Provide Photocopy and Original copies of requirements and All photocopies should be in Long Bond Paper. 
                                Place documents in a Long Blue Folder with a Long Clear Plastic Envelope and Label the folder with your Full Name.
                            </p>
                        </div>

                        @php
                            $rawReqs = $student->requirements;
                            if (is_string($rawReqs)) {
                                $savedReqs = json_decode($rawReqs, true);
                            } elseif (is_array($rawReqs)) {
                                $savedReqs = $rawReqs;
                            } else {
                                $savedReqs = [];
                            }

                            $isComplete = true;

                            $priorityDocs = [
                                'PSA Birth Certificate'   => 'psa',
                                'Report Card (Form 138)'  => 'card',
                                '2x2 Picture (2pcs)'      => 'picture'
                            ];

                            $supportingDocs = [
                                'Form 137 / SF10'         => 'form137',
                                'Good Moral Certificate'  => 'good_moral',
                                'Diploma / Certificate'   => 'diploma'
                            ];
                        @endphp

                        <h4 style="border-bottom: 2px solid #d63031; padding-bottom: 5px; font-size: 14px; margin-bottom: 10px; color: #d63031; text-transform: uppercase;">
                            🚨 Priority Requirements
                        </h4>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; border-collapse: collapse;">
                            @foreach($priorityDocs as $label => $key)
                                @php
                                    $isVerified = !empty($savedReqs[$key]) && $savedReqs[$key] == true;
                                    if (!$isVerified) $isComplete = false;
                                @endphp
                                <tr>
                                    <td style="padding: 8px 0; border-bottom: 1px dashed #fab1a0; font-size: 13px; font-weight: bold; color: #2d3436;">
                                        {{ $label }} <span style="color: #d63031;">*</span>
                                    </td>
                                    <td style="padding: 8px 0; border-bottom: 1px dashed #fab1a0; text-align: right;">
                                        @if($isVerified)
                                            <span style="color: #00b894; font-weight: bold; font-size: 12px;">[ VERIFIED ]</span>
                                        @else
                                            <span style="background-color: #d63031; color: #fff; padding: 2px 6px; font-weight: bold; font-size: 10px; border-radius: 2px;">REQUIRED</span>
                                        @endif
                                    </td>
                                </tr>
                            @endforeach
                        </table>

                        <h4 style="border-bottom: 2px solid #2d3436; padding-bottom: 5px; font-size: 14px; margin-bottom: 10px; color: #2d3436; text-transform: uppercase;">
                            📄 Supporting Documents
                        </h4>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; border-collapse: collapse;">
                            @foreach($supportingDocs as $label => $key)
                                @php
                                    $isVerified = !empty($savedReqs[$key]) && $savedReqs[$key] == true;
                                    if (!$isVerified) $isComplete = false;
                                @endphp
                                <tr>
                                    <td style="padding: 8px 0; border-bottom: 1px dashed #b2bec3; font-size: 13px; font-weight: bold; color: #636e72;">
                                        {{ $label }}
                                    </td>
                                    <td style="padding: 8px 0; border-bottom: 1px dashed #b2bec3; text-align: right;">
                                        @if($isVerified)
                                            <span style="color: #00b894; font-weight: bold; font-size: 12px;">[ VERIFIED ]</span>
                                        @else
                                            <span style="color: #636e72; font-weight: bold; font-size: 11px;">[ TO FOLLOW ]</span>
                                        @endif
                                    </td>
                                </tr>
                            @endforeach
                        </table>

                        @if($isComplete)
                            <div style="background-color: #dff9fb; border: 2px solid #2d3436; padding: 15px; text-align: center;">
                                <strong style="display: block; font-size: 16px; margin-bottom: 5px; color: #00b894;">✅ APPLICATION COMPLETE</strong>
                                <p style="margin: 0; font-size: 13px;">All requirements have been verified. Please proceed to the Registrar's Office to claim your Certificate of Registration (COR).</p>
                            </div>
                        @else
                            <div style="background-color: #ffeaa7; border: 2px solid #2d3436; padding: 15px; text-align: center;">
                                <strong style="display: block; font-size: 16px; margin-bottom: 5px; color: #d63031;">⚠️ PENDING REQUIREMENTS</strong>
                                <p style="margin: 0; font-size: 13px;">Please go to the Registrar's Office to submit the missing Priority Documents.</p>
                            </div>
                        @endif

                        <p style="font-size: 14px; margin-top: 25px;">
                            Thank you for choosing our institution!
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