<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ strtoupper($strand->code) }} Master List</title>
    <style>
        @page { margin: 30px 50px; }
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 10pt;
            color: #000;
        }

        .header-container { 
            text-align: center; 
            margin-bottom: 20px; 
        }

        .logo { 
            width: 80px; 
            height: auto; 
            margin-bottom: 5px; 
        }

        .school-name { 
            font-size: 16pt; 
            font-weight: bold; 
            text-transform: uppercase; 
        }

        .school-address { 
            font-size: 10pt; 
            margin-top: 5px; 
            text-transform: uppercase; 
        }

        .contact-no { 
            font-size: 10pt; 
            margin-top: 2px; 
        }

        .doc-title { 
            text-align: center; 
            font-weight: bold; 
            text-decoration: underline; 
            margin: 20px 0; 
            font-size: 14pt; 
        }

        .meta-table { 
            width: 100%; 
            margin-bottom: 25px; 
            font-size: 11pt; 
            border-collapse: collapse; 
        }

        .meta-table td { 
            padding: 3px 0; 
            vertical-align: top; 
        }

        .meta-label { 
            font-weight: bold; 
            width: 18%; 
            white-space: nowrap; 
        }

        .meta-val { 
            width: 32%; 
        }

        .section-container {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }

        .section-header-table {
            width: 100%;
            margin-bottom: 5px;
            font-size: 11pt;
        }

        .students-table { 
            width: 100%; 
            border-collapse: collapse; 
            border: 1px solid #000; 
            font-size: 10pt; 
        }

        .students-table th { 
            border: 1px solid #000; 
            padding: 5px; 
            background: #eee; 
            text-align: center; 
            font-weight: bold; 
        }

        .students-table td { 
            border: 1px solid #000; 
            padding: 4px; 
        }

        .gender-row {
            background-color: #ddd;
            font-weight: bold;
        }

        .footer { 
            margin-top: 40px; 
            width: 100%; 
            font-size: 10pt; 
        }
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
            BLK 5 LOT 28-34 VALENTINO VILLAGE, SAN JOSE, RODRIGUEZ, RIZAL
        </div>
        <div class="contact-no">Contact No.: 09164369291</div>
    </div>

    <div class="doc-title">STRAND OFFICIAL ENROLLMENT LIST</div>

    <table class="meta-table">
        <tr>
            <td class="meta-label">STRAND CODE:</td>
            <td class="meta-val">{{ strtoupper($strand->code) }}</td>
            <td class="meta-label">SCHOOL YEAR:</td>
            <td class="meta-val">{{ $schoolYear ?? date('Y').'-'.(date('Y')+1) }}</td>
        </tr>
        <tr>
            <td class="meta-label">DESCRIPTION:</td>
            <td class="meta-val">{{ strtoupper($strand->description) }}</td>
            <td class="meta-label">TOTAL ENROLLED:</td>
            <td class="meta-val">{{ count($students) }}</td>
        </tr>
    </table>

    @php
        $groupedStudents = $students->groupBy(function($item) {
            return $item->section_name ?? 'UNASSIGNED SECTION';
        });
    @endphp

    @forelse($groupedStudents as $sectionName => $sectionStudents)
        @php
            $males = $sectionStudents->where('gender', 'Male')->sortBy('last_name');
            $females = $sectionStudents->where('gender', 'Female')->sortBy('last_name');
            $total = $sectionStudents->count();
        @endphp
        
        <div class="section-container">
            <table class="section-header-table">
                <tr>
                    <td style="font-weight: bold; width: 12%;">SECTION:</td>
                    <td style="color: #3F9AAE; font-weight: bold; width: 38%;">{{ strtoupper($sectionName) }}</td>
                    <td style="font-weight: bold; width: 25%;">TOTAL ENROLLED:</td>
                    <td style="width: 25%;">{{ $total }}</td>
                </tr>
            </table>

            <table class="students-table">
                <thead>
                    <tr>
                        <th width="5%">NO.</th>
                        <th width="20%">STUDENT NO.</th>
                        <th width="20%">LRN</th>
                        <th width="35%">FULL NAME</th>
                        <th width="20%">MODALITY</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="gender-row">
                        <td colspan="5" style="padding-left: 10px;">MALE ({{ $males->count() }})</td>
                    </tr>
                    @forelse($males as $index => $s)
                        <tr>
                            <td align="center">{{ $loop->iteration }}</td>
                            <td align="center">{{ $s->student_number ?? 'N/A' }}</td>
                            <td align="center">{{ $s->lrn }}</td>
                            <td>
                                {{ strtoupper($s->last_name) }}, {{ strtoupper($s->first_name) }} 
                                {{ $s->middle_name ? strtoupper(substr($s->middle_name, 0, 1)).'.' : '' }} 
                                {{ strtoupper($s->suffix) }}
                            </td>
                            <td align="center">{{ strtoupper($s->learning_modality ?? 'N/A') }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="5" align="center" style="font-style: italic;">No Male Students</td></tr>
                    @endforelse

                    <tr class="gender-row">
                        <td colspan="5" style="padding-left: 10px;">FEMALE ({{ $females->count() }})</td>
                    </tr>
                    @forelse($females as $index => $s)
                        <tr>
                            <td align="center">{{ $loop->iteration }}</td>
                            <td align="center">{{ $s->student_number ?? 'N/A' }}</td>
                            <td align="center">{{ $s->lrn }}</td>
                            <td>
                                {{ strtoupper($s->last_name) }}, {{ strtoupper($s->first_name) }} 
                                {{ $s->middle_name ? strtoupper(substr($s->middle_name, 0, 1)).'.' : '' }} 
                                {{ strtoupper($s->suffix) }}
                            </td>
                            <td align="center">{{ strtoupper($s->learning_modality ?? 'N/A') }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="5" align="center" style="font-style: italic;">No Female Students</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    @empty
        <p style="text-align: center; font-style: italic; font-weight: bold; margin-top: 50px;">-- NO ENROLLED STUDENTS FOUND --</p>
    @endforelse

    <div class="footer">
        Generated by: {{ $printedBy ?? 'System Admin' }} <br>
        Date: {{ now()->format('F d, Y h:i A') }}
    </div>
</body>
</html>