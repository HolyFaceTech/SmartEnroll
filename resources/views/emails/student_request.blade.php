<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Request | SmartEnroll</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; background-color: #eeeeee;">

    @php
        $statusColors = [
            'pending'    => ['bg' => '#ffeaa7', 'text' => '#d35400', 'label' => 'PENDING'],
            'processing' => ['bg' => '#81ecec', 'text' => '#0097e6', 'label' => 'PROCESSING'],
            'onhold'     => ['bg' => '#ff7675', 'text' => '#d63031', 'label' => 'ON HOLD'],
            'done'       => ['bg' => '#55efc4', 'text' => '#00b894', 'label' => 'READY FOR CLAIMING'],
            'released'   => ['bg' => '#dfe6e9', 'text' => '#636e72', 'label' => 'RELEASED'],
            'denied'     => ['bg' => '#2d3436', 'text' => '#ffffff', 'label' => 'DENIED'],
        ];
        
        $currentStatus = str_replace(' ', '', strtolower($documentRequest->status ?? 'pending'));
        $theme = $statusColors[$currentStatus] ?? $statusColors['pending'];

        $requestDate = \Carbon\Carbon::parse($documentRequest->created_at);
        $documentType = strtolower($documentRequest->type);
        
        $isSevenDays = str_contains($documentType, 'form 137') || str_contains($documentType, 'good moral');
        
        $processingDays = $isSevenDays ? 7 : 3;
        
        $expectedRelease = $requestDate->copy()->addDays(1)->addWeekdays($processingDays - 1); 
        
        $statusMsg = "";
        switch($currentStatus) {
            case 'processing': 
                $statusMsg = "Good news! Your document request is now being PROCESSED by our team. Your document is expected to be ready on or before " . $expectedRelease->format('F d, Y') . "."; 
                break;
            case 'onhold': 
                $statusMsg = "Your document request is currently ON HOLD. This may be due to pending clearance or incomplete information. Please visit the Registrar's Office for clarification."; 
                break;
            case 'done': 
                $statusMsg = "Your requested document is now DONE and READY FOR CLAIMING. You may visit the Registrar's Office during office hours to claim your document."; 
                break;
            case 'released': 
                $statusMsg = "Your requested document has been successfully RELEASED. Thank you for your patience!"; 
                break;
            case 'denied': 
                $statusMsg = "We regret to inform you that your document request has been DENIED. Please coordinate with the Registrar's Office for more details regarding this decision."; 
                break;
            case 'pending':
            default: 
                $statusMsg = "We have successfully received your document request. Your request is currently marked as PENDING and is queued for processing. Your document is expected to be ready on or before " . $expectedRelease->format('F d, Y') . "."; 
                break;
        }
    @endphp

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
        <tr>
            <td style="padding: 20px 0; text-align: center;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #fcfbf4; border: 3px solid #2d3436; padding: 0; box-shadow: 8px 8px 0px #2d3436; text-align: left;">
                    
                    <div style="background-color: #F4D03F; padding: 20px; border-bottom: 3px solid #2d3436; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; color: #2d3436;">
                            🗐 SmartEnroll
                        </h1>
                        <span style="font-size: 12px; font-weight: bold; background-color: #2d3436; color: #fff; padding: 2px 8px; margin-top: 5px; display: inline-block;">REQUEST NOTIFICATION</span>
                    </div>

                    <div style="padding: 30px;">
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            Dear <strong>{{ strtoupper($student->first_name) }} {{ strtoupper($student->middle_name) }} {{ strtoupper($student->last_name) }} {{ strtoupper($student->suffix) }}</strong>,
                        </p>

                        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                            {{ $statusMsg }} 
                        </p>

                        <div style="background-color: #fff; border: 2px solid #2d3436; padding: 15px; margin-bottom: 25px;">
                            <h4 style="border-bottom: 2px solid #2d3436; padding-bottom: 5px; font-size: 14px; margin-top: 0; margin-bottom: 15px; color: #2d3436; text-transform: uppercase;">
                                📄 Request Details
                            </h4>
                            <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 14px;">
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">DATE REQUESTED:</td>
                                    <td style="text-align: right; font-weight: bold; color: #0984e3;">{{ $requestDate->format('F d, Y h:i A') }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">STUDENT NO:</td>
                                    <td style="text-align: right; font-weight: bold;">{{ $student->student_number ?? 'N/A' }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">LRN:</td>
                                    <td style="text-align: right; font-weight: bold;">{{ $student->lrn }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72; padding-top: 10px;">DOCUMENT TYPE:</td>
                                    <td style="text-align: right; font-weight: bold; color: #2d3436; padding-top: 10px;">{{ strtoupper($documentRequest->type) }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72;">PURPOSE:</td>
                                    <td style="text-align: right; font-style: italic;">"{{ $documentRequest->purpose }}"</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: #636e72; padding-top: 10px;">STATUS:</td>
                                    <td style="text-align: right; padding-top: 10px;">
                                        <span style="background-color: {{ $theme['bg'] }}; border: 1px solid #2d3436; padding: 2px 6px; font-weight: bold; color: {{ $theme['text'] }};">{{ $theme['label'] }}</span>
                                    </td>
                                </tr>
                                @if(in_array($currentStatus, ['pending', 'processing']))
                                <tr>
                                    <td style="font-weight: bold; color: #636e72; padding-top: 10px;">EXPECTED RELEASE:</td>
                                    <td style="text-align: right; font-weight: bold; color: #d63031; padding-top: 10px;">
                                        ON OR BEFORE {{ strtoupper($expectedRelease->format('F d, Y')) }}
                                    </td>
                                </tr>
                                @endif
                            </table>
                        </div>

                        @if(in_array($currentStatus, ['pending', 'processing']))
                            <div style="background-color: #dfe6e9; border: 2px dashed #2d3436; padding: 15px; margin-bottom: 25px;">
                                <strong style="display: block; font-size: 14px; color: #2d3436; text-transform: uppercase; margin-bottom: 10px;">
                                    <span style="background-color: #2d3436; color: #fff; padding: 2px 5px;">NOTE</span> CLAIMING INSTRUCTION:
                                </strong>
                                <p style="margin: 0 0 10px 0; font-size: 13px; color: #2d3436;">
                                    Please present a valid ID upon claiming your requested document. If a representative will claim it on your behalf, they must present an authorization letter and a photocopy of your valid ID along with their own valid ID.
                                </p>
                                <p style="margin: 0; font-size: 12px; color: #d63031; font-style: italic; font-weight: bold;">
                                    * The processing day count begins on the first business day following your request date. Saturdays, Sundays, and public holidays are not included in the standard processing time and will extend the expected release date accordingly.
                                </p>
                            </div>

                            <div style="background-color: #dff9fb; border: 2px solid #2d3436; padding: 15px; text-align: center; margin-bottom: 20px;">
                                <strong style="display: block; font-size: 16px; margin-bottom: 5px; color: #0984e3;">⏳ PROCESSING ONGOING</strong>
                                <p style="margin: 0; font-size: 13px;">Your request is currently being reviewed and processed. You will receive another update once your document is ready for claiming.</p>
                            </div>
                        @elseif($currentStatus === 'done')
                            <div style="background-color: #55efc4; border: 2px solid #2d3436; padding: 15px; text-align: center; margin-bottom: 20px;">
                                <strong style="display: block; font-size: 16px; margin-bottom: 5px; color: #2d3436;">✅ READY FOR CLAIMING</strong>
                                <p style="margin: 0; font-size: 13px; color: #2d3436;">Your document is now ready! Please visit the Registrar's Office to claim it.</p>
                            </div>
                        @elseif($currentStatus === 'onhold')
                            <div style="background-color: #ffeaa7; border: 2px solid #2d3436; padding: 15px; text-align: center; margin-bottom: 20px;">
                                <strong style="display: block; font-size: 16px; margin-bottom: 5px; color: #d35400;">⚠️ REQUEST ON HOLD</strong>
                                <p style="margin: 0; font-size: 13px;">Please coordinate with the Registrar's Office to resolve the issue with your request.</p>
                            </div>
                        @elseif($currentStatus === 'released')
                            <div style="background-color: #dfe6e9; border: 2px solid #2d3436; padding: 15px; text-align: center; margin-bottom: 20px;">
                                <strong style="display: block; font-size: 16px; margin-bottom: 5px; color: #2d3436;">📂 DOCUMENT RELEASED</strong>
                                <p style="margin: 0; font-size: 13px;">This transaction is now complete and closed.</p>
                            </div>
                        @elseif($currentStatus === 'denied')
                            <div style="background-color: #2d3436; border: 2px solid #2d3436; padding: 15px; text-align: center; margin-bottom: 20px;">
                                <strong style="display: block; font-size: 16px; margin-bottom: 5px; color: #ff7675;">❌ REQUEST DENIED</strong>
                                <p style="margin: 0; font-size: 13px; color: #fff;">Your request cannot be processed at this time.</p>
                            </div>
                        @endif

                        <p style="font-size: 14px; margin-top: 25px;">Thank you for your patience! If you have questions, please visit the Registrar's Office.</p>
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