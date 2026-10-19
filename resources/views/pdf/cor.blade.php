<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>COR-{{ $info['name'] }}-{{ $info['grade_level'] }}{{ $info['term'] ?? '' }}</title>
    <style>
        @page { 
            size: legal portrait; 
            margin: 20px 30px; 
        }
        
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8.5pt;
            color: #000;
            line-height: 1.2;
        }
        
        .text-center { 
            text-align: center; 
        }

        .text-right { 
            text-align: right; 
        }

        .font-bold { 
            font-weight: bold; 
        }

        .uppercase { 
            text-transform: uppercase; 
        }

        .text-danger { 
            color: #dc3545; 
        }

        .text-muted { 
            color: #6c757d; 
        }

        .font-monospace { 
            font-family: 'Courier New', Courier, monospace; 
        }

        .card-wrap {
            border: 2px solid #000;
            margin-bottom: 10px;
            background: #fff;
        }

        .card-header {
            font-family: 'Courier New', Courier, monospace;
            font-weight: bold;
            border-bottom: 2px solid #000;
            padding: 4px 8px;
            background-color: #fff;
            font-size: 9pt;
            text-transform: uppercase;
        }

        .card-body {
            padding: 8px;
        }

        .form-label {
            font-family: 'Courier New', Courier, monospace;
            font-size: 7.5pt;
            font-weight: bold;
            display: block;
            margin-bottom: 2px;
        }

        .form-control {
            border: 1px solid #000;
            background-color: #f8f9fa;
            padding: 3px 5px;
            font-weight: bold;
            color: #000;
            font-size: 8.5pt;
        }

        .form-control.read-only { 
            color: #6c757d; 
        }

        .chk-box {
            display: inline-block;
            width: 11px;
            height: 11px;
            border: 1px solid #000;
            margin-right: 5px;
            text-align: center;
            line-height: 11px;
            font-size: 8pt;
            font-weight: bold;
            background-color: #f8f9fa;
            vertical-align: middle;
        }

        .logo { 
            width: 1.1in; 
            height: auto; 
        }

        .photo-box { 
            width: 1.1in; 
            height: 1.1in; 
            border: 2px solid #000; 
            text-align: center; 
            line-height: 1.1in; 
            font-size: 8pt; 
            color: #666; 
            background-color: #f8f9fa; 
        }
        
        .photo-img { 
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
        }

        .school-name { 
            font-family: 'Times New Roman', Times, serif; 
            font-size: 13pt; 
            font-weight: bold; 
        }

        .doc-title { 
            text-align: center; 
            font-weight: bold; 
            text-decoration: underline; 
            margin-top: 5px; 
            font-size: 11pt; 
            letter-spacing: 1px; 
        }

        table { 
            width: 100%; 
            border-collapse: collapse; 
        }
        
        .table-bordered {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
        }

        .table-bordered th, .table-bordered td {
            border: 1px solid #000;
            padding: 4px;
        }

        .table-bordered th {
            background-color: #e9ecef;
            text-align: center;
            font-size: 8pt;
        }

        .footer { 
            text-align: center; 
            line-height: 1.3; 
            padding-top: 6px;
            margin-top: 10px;
        }
    </style>
</head>
<body>

    <div class="card-wrap">
        <div class="card-body">
            <table width="100%" cellpadding="0">
                <tr>
                    <td width="18%" class="text-center" style="vertical-align: middle;">
                        @if($logo) <img src="{{ $logo }}" class="logo"> @endif
                    </td>
                    <td width="64%" class="text-center" style="vertical-align: middle;">
                        <div class="school-name uppercase">HOLY FACE OF JESUS LYCEUM OF SAN JOSE INC.</div>
                        <div style="font-size: 8pt; margin-top: 2px; font-style: italic;">BLOCK 5 LOT 28-34 VALENTINO VILLAGE, SAN JOSE, RODRIGUEZ, RIZAL</div>
                        <div style="font-size: 8pt; margin-top: 1px; font-style: italic;">Contact No.: 0924-274-0388</div>
                        <div class="doc-title">CERTIFICATE OF REGISTRATION</div>
                    </td>
                    <td width="18%" align="right" style="vertical-align: middle;">
                        <div class="photo-box">
                            @if($photo_2x2) 
                                <img src="{{ $photo_2x2 }}" class="photo-img"> 
                            @else 
                                <table width="100%" cellpadding="0" cellspacing="0" style="height: 1.1in; border: none;">
                                    <tr>
                                        <td align="center" valign="middle" style="text-align: center; vertical-align: middle; border: none; padding: 0; font-size: 8pt; font-weight: bold; color: #666;">
                                            2x2 PHOTO
                                        </td>
                                    </tr>
                                </table>
                            @endif
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <div class="card-wrap">
        <div class="card-header"><span style="font-family: Arial, Helvetica, sans-serif;">STUDENT INFORMATION</span></div>
        <div class="card-body">
            <table width="100%" cellpadding="3">
                <tr>
                    <td width="33%">
                        <div class="form-label">STUDENT NAME:</div>
                        <div class="form-control read-only uppercase font-monospace">{{ $info['name'] }}</div>
                    </td>
                    <td width="33%">
                        <div class="form-label">STRAND:</div>
                        <div class="form-control read-only uppercase font-monospace">{{ $info['strand'] }}</div>
                    </td>
                    <td width="33%">
                        <div class="form-label">LRN:</div>
                        <div class="form-control read-only uppercase font-monospace">{{ $info['lrn'] }}</div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="form-label">SCHOOL YEAR & TERM:</div>
                        <div class="form-control read-only uppercase font-monospace">{{ $info['school_year'] }} | {{ $info['term'] ?? $info['term'] }}</div>
                    </td>
                    <td>
                        <div class="form-label">STUDENT NO.:</div>
                        <div class="form-control read-only uppercase font-monospace">{{ $info['student_number'] }}</div>
                    </td>
                    <td>
                        <div class="form-label">GRADE & SECTION:</div>
                        <div class="form-control read-only uppercase font-monospace">{{ $info['grade_level'] }} - {{ $info['section_name'] }}</div>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <div class="card-wrap">
        <div class="card-header"><span style="font-family: Arial, Helvetica, sans-serif;">SUBJECT LOAD</span></div>
        <div class="card-body" style="padding: 0;">
            <table class="table-bordered">
                <thead>
                    <tr>
                        <th width="20%">CODE</th>
                        <th width="40%">DESCRIPTION</th>
                        <th width="20%">SCHEDULE</th>
                        <th width="20%">INSTRUCTOR</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($subjects as $sub)
                    <tr>
                        <td class="text-center font-bold font-monospace">{{ $sub['code'] }}</td>
                        <td class="font-monospace">{{ $sub['desc'] }}</td>
                        <td class="text-center font-monospace">{{ $sub['sched'] }}</td>
                        <td class="text-center font-monospace">{{ $sub['teacher'] }}</td>
                    </tr>
                    @endforeach
                    @if(count($subjects) == 0)
                    <tr><td colspan="4" class="text-center text-muted font-monospace">No subjects enlisted.</td></tr>
                    @endif
                </tbody>
            </table>
        </div>
    </div>

    <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 10px; border-collapse: collapse;">
        <tr>
            <td width="48.5%" class="card-header" style="border: 2px solid #000; border-bottom: 2px solid #000; text-align: left;">
                <span style="font-family: Arial, Helvetica, sans-serif;">ASSESSMENT OF FEES</span>
            </td>
            <td width="3%" style="border: none;"></td>
            <td width="48.5%" class="card-header" style="border: 2px solid #000; border-bottom: 2px solid #000; text-align: left;">
                <span style="font-family: Arial, Helvetica, sans-serif;">ACADEMIC SIGNATORIES</span>
            </td>
        </tr>
        
        <tr>
            <td width="48.5%" valign="top" style="border-left: 2px solid #000; border-right: 2px solid #000; padding: 8px 8px 0 8px; background: #fff;">
                <table width="100%" cellpadding="2" style="margin-bottom: 5px;">
                    @foreach($fees as $fee)
                    <tr>
                        <td width="65%">
                            <div class="form-control uppercase font-monospace">{{ $fee['description'] }}</div>
                        </td>
                        <td width="35%">
                            <div class="form-control text-right font-monospace">{{ number_format((float)$fee['amount'], 2) }}</div>
                        </td>
                    </tr>
                    @endforeach
                    <tr>
                        <td class="font-bold font-monospace text-right" style="padding-top: 10px; padding-right: 5px;">TOTAL ASSESSMENT:</td>
                        <td style="padding-top: 10px;">
                            <div class="form-control text-danger text-right font-monospace" style="border: 2px solid #000; background: #fff;">
                                PHP {{ number_format((float)$total_fees, 2) }}
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
            <td width="3%" style="border: none;"></td>
            <td width="48.5%" valign="top" style="border-left: 2px solid #000; border-right: 2px solid #000; padding: 8px 8px 0 8px; background: #fff;">
                <div class="text-center" style="padding: 0 10px; margin-top: 40px;">
                    <div class="form-control text-center uppercase font-monospace" style="border-top: 0; border-left: 0; border-right: 0; border-bottom: 2px solid #000; background: transparent;">{{ $signatories['adviser'] }}</div>
                    <div class="form-label" style="margin-top: 4px;">CLASS ADVISER</div>
                </div>
            </td>
        </tr>

        <tr>
            <td width="48.5%" valign="top" align="center" style="border-left: 2px solid #000; border-right: 2px solid #000; padding: 0 8px; background: #fff;">
                <div class="text-center" style="margin-top: 2px; margin-bottom: 15px;">
                    <div class="form-label text-danger">ASSESSMENT NO.</div>
                    <div class="form-control text-danger text-center font-monospace" style="font-size: 12pt; padding: 6px;">{{ $or_number }}</div>
                    <div class="text-muted font-monospace" style="font-size: 6.5pt; font-style: italic; margin-top: 3px;">
                        This is a registration and assessment form only, not an official receipt.
                    </div>
                </div>
            </td>
            <td width="3%" style="border: none;"></td>
            <td width="48.5%" valign="middle" align="center" style="border-left: 2px solid #000; border-right: 2px solid #000; padding: 4px 8px; background: #fff;">
                <div class="text-center" style="margin: 5px auto 15px auto;">
                    <span style="font-family: 'Times New Roman', serif; font-size: 16pt; font-weight: bold; opacity: 0.15; text-transform: uppercase; color: #000;">HOLY FACE SEALED</span>
                </div>
            </td>
        </tr>

        <tr>
            <td width="48.5%" valign="bottom" style="border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 2px solid #000; padding: 0 8px 15px 8px; background: #fff;">
                <div class="text-center" style="margin-top: 50px; padding: 0 10px;">
                    <div class="form-control text-center uppercase font-monospace" style="border-top: 0; border-left: 0; border-right: 0; border-bottom: 2px solid #000; background: transparent;">{{ $signatories['finance'] }}</div>
                    <div class="form-label" style="margin-top: 4px;">FINANCE OFFICER</div>
                </div>
            </td>
            <td width="3%" style="border: none;"></td>
            <td width="48.5%" valign="bottom" style="border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 2px solid #000; padding: 0 8px 15px 8px; background: #fff;">
                <div class="text-center" style="margin-top: 50px; padding: 0 10px;">
                    <div class="form-control text-center uppercase font-monospace" style="border-top: 0; border-left: 0; border-right: 0; border-bottom: 2px solid #000; background: transparent;">{{ $signatories['registrar'] }}</div>
                    <div class="form-label" style="margin-top: 4px;">SCHOOL REGISTRAR</div>
                </div>
            </td>
        </tr>
    </table>

    @php
        $selectedCat = $category ?? '';
        $isGrade12ThirdTerm = str_contains((string)($info['grade_level'] ?? ''), '12') && str_contains(strtolower((string)($info['term'] ?? $info['term'] ?? '')), '3');
    @endphp
    @if($isGrade12ThirdTerm)
    <div class="card-wrap">
        <div class="card-header"><span style="font-family: Arial, Helvetica, sans-serif;">CATEGORY / FUTURE TRACK</span></div>
        <div class="card-body">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="25%" class="font-monospace" style="font-size: 7.5pt; vertical-align: middle; padding: 4px;">
                        <span class="chk-box">{{ $selectedCat == 'Pursuing Higher Education' ? 'X' : '' }}</span><span style="vertical-align: middle;">Pursuing Higher Education</span>
                    </td>
                    <td width="25%" class="font-monospace" style="font-size: 7.5pt; vertical-align: middle; padding: 4px;">
                        <span class="chk-box">{{ $selectedCat == 'Pursuing Advance TVL' ? 'X' : '' }}</span><span style="vertical-align: middle;">Pursuing Advance TVL</span>
                    </td>
                    <td width="25%" class="font-monospace" style="font-size: 7.5pt; vertical-align: middle; padding: 4px;">
                        <span class="chk-box">{{ $selectedCat == 'Work or Employment' ? 'X' : '' }}</span><span style="vertical-align: middle;">Work or Employment</span>
                    </td>
                    <td width="25%" class="font-monospace" style="font-size: 7.5pt; vertical-align: middle; padding: 4px;">
                        <span class="chk-box">{{ $selectedCat == 'Start a Business' ? 'X' : '' }}</span><span style="vertical-align: middle;">Start a Business</span>
                    </td>
                </tr>
                @if($selectedCat == 'Pursuing Higher Education')
                <tr>
                    <td colspan="4" style="padding: 8px 4px 4px 4px;">
                        <div class="form-label">COURSE TO BE TAKEN:</div>
                        <div class="form-control read-only uppercase font-monospace">{{ $course ?? '' }}</div>
                    </td>
                </tr>
                @endif
            </table>
        </div>
    </div>
    @endif

    <div class="footer font-monospace" style="margin-bottom: 10px;">
        <div style="font-weight: bold; font-size: 7.5pt; font-style: italic;">VALID ONLY WITH SIGNATURES AND SCHOOL DRY SEAL.</div>
        <div class="text-muted" style="font-size: 6.5pt; margin-top: 2px; font-style: italic;">
            Any alteration or forgery of this document is strictly prohibited and punishable by law under Article 172 of the Revised Penal Code (Falsification of Public/Official Documents) and Republic Act No. 10175.
        </div>
    </div>

    <div style="text-align: center; margin: 15px 0;">
        <div style="border-top: 1px dashed #000; position: relative; top: 8px;"></div>
        <span style="background: #fff; padding: 0 10px; font-size: 8pt; font-weight: bold; font-family: 'Courier New', Courier, monospace; color: #6c757d; position: relative; z-index: 2;">&#9988; CUT HERE</span>
    </div>

    <div class="card-wrap" style="margin-bottom: 5px;">
        <div class="card-header bg-dark text-white" style="background-color: #343a40; color: #fff;"><span style="font-family: Arial, Helvetica, sans-serif;">PULL-OUT AGREEMENT</span></div>
        <div class="card-body" style="padding: 8px 10px;">
            <p style="text-align: justify; font-size: 8pt; line-height: 1.3; margin-top: 0; margin-bottom: 6px; font-family: 'Courier New', Courier, monospace; color: #6c757d;">
                I understand that upon signing this Certificate of Registration, the student is officially enrolled. Should I decide to pull out or cancel the enrollment at any given time, I agree to pay the penalty fee of <strong class="text-danger" style="color: #dc3545;">PHP 500.00</strong> and abide by the school's strict policies regarding tuition refunds and the release of transfer credentials.
            </p>
            <table width="100%" cellpadding="5" style="margin-top: 40px;">
                <tr>
                    <td width="50%" align="center">
                        <div class="form-control text-center uppercase read-only font-monospace" style="border-top: 0; border-left: 0; border-right: 0; border-bottom: 2px solid #000; background: transparent;">{{ $terms['parent_name'] ?? '' }}</div>
                        <div class="form-label text-center" style="margin-top: 4px;">PARENT / GUARDIAN SIGNATURE</div>
                    </td>
                    <td width="50%" align="center">
                        <div class="form-control text-center uppercase read-only font-monospace" style="border-top: 0; border-left: 0; border-right: 0; border-bottom: 2px solid #000; background: transparent;">{{ $terms['student_name'] ?? '' }}</div>
                        <div class="form-label text-center" style="margin-top: 4px;">STUDENT SIGNATURE</div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    
    <div class="font-monospace text-muted text-center" style="font-size: 7.5pt; font-style: italic; margin-top: 5px;">
        School Year: {{ $info['school_year'] ?? 'N/A' }} | Term: {{ $info['term'] ?? $info['term'] ?? 'N/A' }} | Date &amp; Time: {{ $printed_at ?? now()->format('F d, Y h:i A') }}
    </div>

</body>
</html>