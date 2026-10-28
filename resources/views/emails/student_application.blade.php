<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Application | SmartEnroll</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; background-color: #eeeeee;">

    @php
        $statusColors = [
            'pending'  => ['bg' => '#ffeaa7', 'text' => '#d35400', 'label' => 'PENDING'],
            'enrolled' => ['bg' => '#55efc4', 'text' => '#00b894', 'label' => 'ENROLLED'],
            'onhold'   => ['bg' => '#ff7675', 'text' => '#d63031', 'label' => 'ON HOLD'],
            'dropout'  => ['bg' => '#b2bec3', 'text' => '#2d3436', 'label' => 'DROP OUT'],
            'graduate' => ['bg' => '#74b9ff', 'text' => '#0984e3', 'label' => 'GRADUATE'],
            'released' => ['bg' => '#dfe6e9', 'text' => '#636e72', 'label' => 'RELEASED'],
        ];
        
        $currentStatus = str_replace(' ', '', strtolower($student->status ?? 'pending'));
        if ($currentStatus === 'dropout') {
            $theme = $statusColors['dropout'];
        } else {
            $theme = $statusColors[$currentStatus] ?? $statusColors['pending'];
        }

        $statusMsg = "";
        switch($currentStatus) {
            case 'enrolled': 
                $statusMsg = "Congratulations! We are pleased to inform you that your enrollment has been successfully processed. You are now officially enrolled in our institution for the current academic term. To complete your enrollment process, please proceed to the Registrar's Office to claim your Certificate of Registration (COR)."; 
                break;
            case 'onhold': 
                $statusMsg = "Please be advised that your enrollment status is currently marked as ON HOLD. This may be due to pending requirements or unsettled clearances. Kindly visit the Registrar's Office as soon as possible for clarification."; 
                break;
            case 'dropout': 
                $statusMsg = "This is to formally confirm that your student record has been updated to DROP OUT. If you believe this is an error, or if you wish to apply for readmission in the future, please coordinate directly with the Registrar's Office."; 
                break;
            case 'graduate': 
                $statusMsg = "Congratulations! We proudly recognize the completion of your academic requirements. Your status has now been officially updated to GRADUATE. We wish you the absolute best in your future endeavors!"; 
                break;
            case 'released': 
                $statusMsg = "This is to formally notify you that your academic records and credentials have been officially RELEASED. You are now cleared of your document responsibilities with the institution."; 
                break;
            default: 
                $statusMsg = "Welcome to our institution! We have successfully received your student application. Your enrollment status is currently marked as PENDING and is queued for evaluation. Please wait for further updates once our Registrar has reviewed your records."; 
                break;
        }
    @endphp

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
        <tr>
            <td style="padding: 20px 0; text-align: center;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #fcfbf4; border: 3px solid #2d3436; padding: 0; box-shadow: 8px 8px 0px #2d3436; text-align: left;">
                    
                    <div style="background-color: #F4D03F; padding: 20px; border-bottom: 3px solid #2d3436; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; color: #2d3436;">
                            🎓 SmartEnroll
                        </h1>
                        <span style="font-size: 12px; font-weight: bold; background-color: #2d3436; color: #fff; padding: 2px 8px; margin-top: 5px; display: inline-block;">APPLICATION NOTIFICATION</span>
                    </div>

                    <div style="padding: 30px;">
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            Dear <strong>{{ strtoupper($student->first_name) }} {{ strtoupper($student->middle_name) }} {{ strtoupper($student->last_name) }} {{ strtoupper($student->suffix) }}</strong>,
                        </p>

                        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                            {{ $statusMsg }} Date of process: <strong>{{ \Carbon\Carbon::parse($student->created_at)->format('F d, Y') }}</strong>.
                        </p>

                        @if($currentStatus === 'released' && !empty($student->released_by))
                            <div style="background-color: #dfe6e9; border-left: 4px solid #636e72; padding: 12px 15px; margin-bottom: 25px; font-size: 13px;">
                                <strong style="color: #2d3436;"><i style="font-style: normal;">🧑‍💼</i> RELEASED BY:</strong> {{ strtoupper($student->released_by) }} <br>
                                <strong style="color: #2d3436;"><i style="font-style: normal;">📅</i> DATE RELEASED:</strong> {{ \Carbon\Carbon::parse($student->released_at)->format('F d, Y h:i A') }}
                            </div>
                        @endif

                        <div style="background-color: #fff; border: 2px solid #2d3436; padding: 15px; margin-bottom: 25px;">
                            <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 14px;">
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">STUDENT NO:</td>
                                    <td style="text-align: right; font-weight: bold; color: #0984e3;">{{ $student->student_number ?? 'N/A' }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">LRN:</td>
                                    <td style="text-align: right; font-weight: bold;">{{ $student->lrn }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">STATUS:</td>
                                    <td style="text-align: right;">
                                        <span style="background-color: {{ $theme['bg'] }}; border: 1px solid #2d3436; padding: 2px 6px; font-weight: bold; color: {{ $theme['text'] }};">{{ $theme['label'] }}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">STRAND:</td>
                                    <td style="text-align: right;">{{ $student->academic->strand->code ?? 'N/A' }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">GRADE/SECTION:</td>
                                    <td style="text-align: right;">{{ $student->academic->grade_level ?? 'N/A' }} - {{ $student->academic->section->name ?? 'N/A' }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">TERM:</td>
                                    <td style="text-align: right;">{{ $student->academic->term ?? 'N/A' }} Term</td>
                                </tr>
                            </table>
                        </div>

                        <div style="background-color: #dfe6e9; border: 2px dashed #2d3436; padding: 15px; margin-bottom: 25px;">
                            <strong style="display: block; font-size: 14px; color: #2d3436; text-transform: uppercase; margin-bottom: 10px;">
                                <span style="background-color: #2d3436; color: #fff; padding: 2px 5px;">NOTE</span> SUBMISSION INSTRUCTION:
                            </strong>
                            <p style="margin: 0; font-size: 13px; color: #2d3436;">
                                Provide Photocopy and Original copies of requirements. Photocopies should be in Long Bond Paper. Place documents in a Long Blue Folder with a Long Clear Plastic Envelope and Label with your Full Name.
                            </p>
                        </div>

                        @php
                            $savedReqs = $student->requirements;
                            $isComplete = true;
                            $gradeLevel = $student->academic->grade_level ?? '11';
                            
                            $saf11Checked = !empty($savedReqs['saf_annex_e_g11']) && $savedReqs['saf_annex_e_g11'] == true;
                            $saf12Checked = !empty($savedReqs['saf_annex_e_g12']) && $savedReqs['saf_annex_e_g12'] == true;

                            $showSafAdvisory = false;
                            $missingSafLabel = '';

                            if ($gradeLevel == '11' && !$saf11Checked) {
                                $showSafAdvisory = true;
                                $missingSafLabel = 'SAF Annex E & F (Grade 11)';
                            } elseif ($gradeLevel == '12' && !$saf12Checked) {
                                $showSafAdvisory = true;
                                $missingSafLabel = 'SAF Annex E & F (Grade 12)';
                            }

                            $priorityDocs = [
                                'PSA Birth Certificate'   => 'psa',
                                'Report Card (Form 138)'  => 'card',
                                '2x2 Picture (2pcs)'      => 'picture',
                                'SAF Annex E & F (Grade 11)'  => 'saf_annex_e_g11'
                            ];

                            if ($gradeLevel == '12') {
                                $priorityDocs['SAF Annex E & F (Grade 12)'] = 'saf_annex_e_g12';
                            }

                            $supportingDocs = [
                                'Form 137 / SF10'         => 'form137',
                                'Good Moral Certificate'  => 'good_moral',
                                'Diploma / Certificate'   => 'diploma'
                            ];
                        @endphp

                        <h4 style="border-bottom: 2px solid #d63031; padding-bottom: 5px; font-size: 14px; margin-bottom: 10px; color: #d63031; text-transform: uppercase;">🚨 Priority Requirements</h4>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; border-collapse: collapse;">
                            @foreach($priorityDocs as $label => $key)
                                @php
                                    $isVerified = !empty($savedReqs[$key]) && $savedReqs[$key] == true;
                                    if (!$isVerified) $isComplete = false;
                                @endphp
                                <tr>
                                    <td style="padding: 8px 0; border-bottom: 1px dashed #fab1a0; font-size: 13px; font-weight: bold; color: #2d3436;">{{ $label }} *</td>
                                    <td style="padding: 8px 0; border-bottom: 1px dashed #fab1a0; text-align: right;">
                                        @if($isVerified) <span style="color: #00b894; font-weight: bold; font-size: 12px;">[ VERIFIED ]</span>
                                        @else <span style="background-color: #d63031; color: #fff; padding: 2px 6px; font-weight: bold; font-size: 10px;">REQUIRED</span> @endif
                                    </td>
                                </tr>
                            @endforeach
                        </table>

                        <h4 style="border-bottom: 2px solid #2d3436; padding-bottom: 5px; font-size: 14px; margin-bottom: 10px; color: #2d3436; text-transform: uppercase;">📄 Supporting Documents</h4>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; border-collapse: collapse;">
                            @foreach($supportingDocs as $label => $key)
                                @php
                                    $isVerified = !empty($savedReqs[$key]) && $savedReqs[$key] == true;
                                @endphp
                                <tr>
                                    <td style="padding: 8px 0; border-bottom: 1px dashed #b2bec3; font-size: 13px; font-weight: bold; color: #636e72;">{{ $label }}</td>
                                    <td style="padding: 8px 0; border-bottom: 1px dashed #b2bec3; text-align: right;">
                                        @if($isVerified) <span style="color: #00b894; font-weight: bold; font-size: 12px;">[ VERIFIED ]</span>
                                        @else <span style="color: #636e72; font-weight: bold; font-size: 11px;">[ TO FOLLOW ]</span> @endif
                                    </td>
                                </tr>
                            @endforeach
                        </table>

                        @if($isComplete)
                            <div style="background-color: #dff9fb; border: 2px solid #2d3436; padding: 15px; text-align: center; margin-bottom: 20px;">
                                <strong style="display: block; font-size: 16px; margin-bottom: 5px; color: #00b894;">✅ REQUIREMENTS COMPLETE</strong>
                                <p style="margin: 0; font-size: 13px;">Your enrollment requirements are fully complied.</p>
                            </div>
                        @else
                            <div style="background-color: #ffeaa7; border: 2px solid #2d3436; padding: 15px; text-align: center; margin-bottom: 20px;">
                                <strong style="display: block; font-size: 16px; margin-bottom: 5px; color: #d63031;">⚠️ PENDING REQUIREMENTS</strong>
                                <p style="margin: 0; font-size: 13px;">Please submit the missing documents to the Registrar's Office.</p>
                            </div>

                            @if($showSafAdvisory)
                                <div style="background-color: #fdfbf7; border: 2px dashed #d35400; padding: 15px; margin-bottom: 20px; text-align: left;">
                                    <strong style="display: block; font-size: 14px; margin-bottom: 8px; color: #d35400; text-transform: uppercase;">
                                        <span style="background-color: #d35400; color: #fff; padding: 2px 5px; margin-right: 5px;">ACTION REQUIRED</span> {{ $missingSafLabel }}
                                    </strong>
                                    <p style="margin: 0 0 10px 0; font-size: 13px; color: #2d3436; line-height: 1.5;">
                                        Your <strong>{{ $missingSafLabel }}</strong> is currently pending. Please download the form, print it, fill it out completely, and submit the physical copy to the Registrar's Office.
                                    </p>
                                    <strong style="font-size: 13px; color: #2d3436; text-transform: uppercase;">📥 How to download the form:</strong>
                                    <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; color: #2d3436; line-height: 1.5;">
                                        <li>Visit our <strong>SmartEnroll Portal</strong> homepage.</li>
                                        <li>Click on the <strong>"ANNEX"</strong> dropdown menu at the top navigation bar.</li>
                                        <li>Select and download the <em>"DEPED Order no. 011, s. 2026 SHS Application Form Annex E & F"</em> file.</li>
                                    </ul>
                                </div>
                            @endif
                        @endif

                        <p style="font-size: 14px; margin-top: 25px;">Thank you for choosing our institution! If you have questions, please visit the Registrar's Office.</p>
                    </div>

                    <div style="background-color: #2d3436; color: #dfe6e9; padding: 15px; text-align: center; font-size: 11px;">
                        <p style="margin: 0 0 5px 0;">This is an automated system message. Please do not reply.</p>
                        <p style="margin: 0;">&copy; {{ date('Y') }} SmartEnroll.v2 System. All Rights Reserved.</p>
                    </div>

                </div>
            </td>
        </tr>
    </table>
</body>
</html>