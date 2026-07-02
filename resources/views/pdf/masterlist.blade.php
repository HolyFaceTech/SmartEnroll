<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Master List - {{ $section->name }}</title>
    <style>
        @page { margin: 30px 50px; }
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11pt;
            color: #000;
        }
        .header-container { text-align: center; margin-bottom: 20px; }
        .logo { width: 80px; height: auto; margin-bottom: 5px; }
        .school-name { font-size: 16pt; font-weight: bold; text-transform: uppercase; }
        .school-address { font-size: 10pt; margin-top: 5px; text-transform: uppercase; }
        .contact-no { font-size: 10pt; margin-top: 2px; }
        .doc-title { text-align: center; font-weight: bold; text-decoration: underline; margin: 20px 0; font-size: 14pt; }
        .meta-table { width: 100%; margin-bottom: 15px; font-size: 11pt; border-collapse: collapse; }
        .meta-table td { padding: 3px 0; vertical-align: top; }
        .meta-label { font-weight: bold; width: 15%; white-space: nowrap; }
        .meta-val { width: 35%; }
        .students-table { width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 11pt; }
        .students-table th { border: 1px solid #000; padding: 5px; background: #eee; text-align: center; font-weight: bold; }
        .students-table td { border: 1px solid #000; padding: 4px; }
        .cat-row td { background-color: #ddd; font-weight: bold; padding-left: 10px; text-transform: uppercase; }
        .footer { margin-top: 40px; width: 100%; font-size: 10pt; }
        .signature-section { float: right; width: 250px; text-align: center; margin-top: 40px; }
        .signature-line { border-top: 1px solid #000; margin-bottom: 5px; }
    </style>
</head>
<body>
    @php
        $logoData = null;
        try {
            $path = public_path('images/logo.png');
            if (file_exists($path)) {
                $data = file_get_contents($path);
                $logoData = 'data:image/png;base64,' . base64_encode($data);
            }
        } catch (\Exception $e) {}
    @endphp

    <div class="header-container">
        @if($logoData) <img src="{{ $logoData }}" class="logo"> <br> @endif
        <div class="school-name">HOLY FACE OF JESUS LYCEUM OF SAN JOSE INC.</div>
        <div class="school-address">
            BLK 5 LOT 28-34 VALENTINO VILLAGE,<br>
            BRGY. SAN JOSE, RODRIGUEZ, RIZAL
        </div>
        <div class="contact-no">Contact No.: 0924-274-0388</div>
    </div>

    <div class="doc-title">OFFICIAL CLASS MASTER LIST</div>

    <table class="meta-table">
        <tr>
            <td class="meta-label">SECTION:</td>
            <td class="meta-val">{{ strtoupper($section->name) }}</td>
            <td class="meta-label">SCHOOL YEAR:</td>
            <td class="meta-val">{{ $schoolYear }}</td>
        </tr>
        <tr>
            <td class="meta-label">STRAND:</td>
            <td class="meta-val">{{ $section->strand->code }}</td>
            
            <td class="meta-label">TERM:</td>
            <td class="meta-val">{{ strtoupper($term) }}</td>
        </tr>
        <tr>
            <td class="meta-label">GRADE LEVEL:</td>
            <td class="meta-val" colspan="3">{{ $section->grade_level }}</td>
        </tr>
    </table>

    <table class="students-table">
        <thead>
            <tr>
                <th width="5%">NO.</th>
                <th width="35%">FULL NAME</th>
                <th width="5%">SEX</th>
                <th width="20%">LRN</th>
                <th width="20%">STUDENT NO.</th>
                <th width="15%">MODALITY</th> 
            </tr>
        </thead>
        <tbody>
            <tr class="cat-row"><td colspan="6">MALE</td></tr>
            @forelse($males as $index => $s)
                <tr>
                    <td align="center">{{ $index + 1 }}</td>
                    <td>{{ strtoupper($s->last_name) }}{{ $s->suffix ? ' ' . strtoupper($s->suffix) : '' }}, {{ strtoupper($s->first_name) }}{{ $s->middle_name ? ' ' . strtoupper($s->middle_name) : '' }}</td>
                    <td align="center">M</td>
                    <td align="center">{{ $s->lrn }}</td>
                    <td align="center">{{ $s->student_number ?? 'N/A' }}</td>
                    <td align="center" style="font-size: 9pt;">{{ strtoupper($s->learning_modality ?? 'N/A') }}</td>
                </tr>
            @empty
                <tr><td colspan="6" align="center" style="font-style: italic;">-- NO MALE STUDENTS --</td></tr>
            @endforelse

            <tr class="cat-row"><td colspan="6">FEMALE</td></tr>
            @forelse($females as $index => $s)
                <tr>
                    <td align="center">{{ $index + 1 }}</td>
                    <td>{{ strtoupper($s->last_name) }}{{ $s->suffix ? ' ' . strtoupper($s->suffix) : '' }}, {{ strtoupper($s->first_name) }}{{ $s->middle_name ? ' ' . strtoupper($s->middle_name) : '' }}</td>
                    <td align="center">F</td>
                    <td align="center">{{ $s->lrn }}</td>
                    <td align="center">{{ $s->student_number ?? 'N/A' }}</td>
                    <td align="center" style="font-size: 9pt;">{{ strtoupper($s->learning_modality ?? 'N/A') }}</td>
                </tr>
            @empty
                <tr><td colspan="6" align="center" style="font-style: italic;">-- NO FEMALE STUDENTS --</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        <div style="float: left;">
            Generated by: {{ $printedBy }} <br>
            Date: {{ now()->format('F d, Y h:i A') }}
        </div>
        
        <div class="signature-section">
            <div class="signature-line"></div>
            <div style="font-weight: bold; text-transform: uppercase;">CLASS ADVISER</div>
            <div style="font-size: 9pt; font-style: italic;">(Signature over Printed Name)</div>
        </div>
    </div>
</body>
</html>