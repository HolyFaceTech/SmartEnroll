<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Record Update | SmartEnroll</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; background-color: #eeeeee;">

    @php
        // DYNAMIC STATUS LOGIC
        $statusColors = [
            'pending'  => ['bg' => '#ffeaa7', 'text' => '#d35400', 'label' => 'PENDING'],
            'enrolled' => ['bg' => '#55efc4', 'text' => '#00b894', 'label' => 'ENROLLED'],
            'on hold'  => ['bg' => '#ff7675', 'text' => '#d63031', 'label' => 'ON HOLD'],
            'dropout'  => ['bg' => '#b2bec3', 'text' => '#2d3436', 'label' => 'DROPOUT'],
            'graduate' => ['bg' => '#74b9ff', 'text' => '#0984e3', 'label' => 'GRADUATE'],
            'released' => ['bg' => '#dfe6e9', 'text' => '#636e72', 'label' => 'RELEASED'],
        ];
        $currentStatus = strtolower($student->status ?? 'pending');
        $theme = $statusColors[$currentStatus] ?? $statusColors['pending'];
    @endphp

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
        <tr>
            <td style="padding: 20px 0; text-align: center;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #fcfbf4; border: 3px solid #2d3436; padding: 0; box-shadow: 8px 8px 0px #2d3436; text-align: left;">
                    
                    <div style="background-color: #F4D03F; padding: 20px; border-bottom: 3px solid #2d3436; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; color: #2d3436;">🎓 Holy Face</h1>
                        <span style="font-size: 12px; font-weight: bold; background-color: #2d3436; color: #fff; padding: 2px 8px; margin-top: 5px; display: inline-block;">RECORD UPDATE</span>
                    </div>

                    <div style="padding: 30px;">
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            Dear <strong>{{ strtoupper($student->first_name) }} {{ strtoupper($student->last_name) }}</strong>,
                        </p>

                        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                            This is to inform you that your enrollment record has been updated by the school administration. <br>
                            Current Status: <span style="background-color: {{ $theme['bg'] }}; color: {{ $theme['text'] }}; padding: 2px 6px; font-weight: bold;">{{ $theme['label'] }}</span>
                        </p>

                        {{-- SUMMARY OF CHANGES --}}
                        @if(!empty($changes))
                            <div style="background-color: #dfe6e9; border: 2px dashed #2d3436; padding: 15px; margin-bottom: 25px;">
                                <strong style="display: block; font-size: 14px; color: #2d3436; text-transform: uppercase; margin-bottom: 10px;">
                                    <span style="background-color: #2d3436; color: #fff; padding: 2px 5px;">INFO</span> SUMMARY OF CHANGES:
                                </strong>
                                
                                <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 13px;">
                                    @foreach($changes as $key => $value)
                                        <tr>
                                            <td style="font-weight: bold; color: #636e72; width: 40%; vertical-align: top;">{{ ucfirst(str_replace('_', ' ', $key)) }}:</td>
                                            <td style="color: #2d3436; font-weight: bold; vertical-align: top;">{{ is_array($value) ? 'Updated' : $value }}</td>
                                        </tr>
                                    @endforeach
                                </table>
                            </div>
                        @endif

                        <h4 style="border-bottom: 2px solid #2d3436; padding-bottom: 10px; font-size: 16px; margin-bottom: 15px;">REQUIREMENT STATUS</h4>

                        @php
                            $savedReqs = $student->requirements; // Gumagamit na ng accessor
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
                                    if (!$isVerified) $isComplete = false;
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
                            <div style="background-color: #dff9fb; border: 2px solid #2d3436; padding: 15px; text-align: center;">
                                <strong style="display: block; font-size: 16px; margin-bottom: 5px; color: #00b894;">✅ REQUIREMENTS COMPLETE</strong>
                                <p style="margin: 0; font-size: 13px;">Your enrollment requirements are fully complied.</p>
                            </div>
                        @else
                            <div style="background-color: #ffeaa7; border: 2px solid #2d3436; padding: 15px; text-align: center;">
                                <strong style="display: block; font-size: 16px; margin-bottom: 5px; color: #d63031;">⚠️ PENDING REQUIREMENTS</strong>
                                <p style="margin: 0; font-size: 13px;">Please submit the missing documents to the Registrar's Office.</p>
                            </div>
                        @endif

                        <p style="font-size: 14px; margin-top: 25px;">If you have questions, please visit the Registrar's Office.</p>
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