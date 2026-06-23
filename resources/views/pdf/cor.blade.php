<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>COR - {{ $info['name'] }}</title>
    <style>
        /* A4 Page Settings */
        @page { margin: 25px 30px; }
        
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12pt;
            color: #000;
            line-height: 1.1;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        
        /* HEADER */
        .logo { width: 70px; height: auto; margin-bottom: 5px; }
        .school-name { font-size: 16pt; font-weight: bold; }
        .school-addr { font-size: 10pt; }
        
        .doc-title { text-align: center; font-weight: bold; text-decoration: underline; margin: 15px 0; font-size: 14pt; }

        /* TABLES */
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .info-table td { padding: 3px 0; vertical-align: top; }
        
        /* STUDENT INFO: REMOVED UNDERLINES */
        .label { font-weight: bold; width: 15%; }
        .value { width: 35%; /* border-bottom: 1px solid #000;  <-- TINANGGAL NA */ }

        .data-table { border: 1px solid #000; font-size: 11pt; }
        .data-table th { border: 1px solid #000; background: #eee; padding: 5px; text-align: center; font-size: 11pt; }
        .data-table td { border: 1px solid #000; padding: 4px; }

        /* SIGNATORIES & OR LAYOUT */
        .or-box {
            border: 2px solid #000; 
            padding: 10px; 
            margin-top: 20px; 
            margin-bottom: 50px; /* PINALAKI: Lumayo sa Class Adviser */
        }
        
        /* SPACING NG SIGNATORIES: PINALAKI PARA HINDI DIKIT-DIKIT */
        .sig-block { margin-top: 60px; text-align: center; } 
        
        .sig-line { border-top: 1px solid #000; width: 90%; margin: 0 auto; }
        .sig-label { font-size: 10pt; font-weight: bold; margin-top: 2px; }

        /* FOOTER */
        .footer { 
            position: fixed; 
            bottom: 0; 
            left: 0; 
            right: 0; 
            text-align: center; 
            font-size: 9pt; 
            font-style: italic; 
        }
    </style>
</head>
<body>
    {{-- HEADER --}}
    <div class="text-center">
        @if($logo) <img src="{{ $logo }}" class="logo"><br> @endif
        <div class="school-name uppercase">HOLY FACE OF JESUS LYCEUM OF SAN JOSE INC.</div>
        <div class="school-addr uppercase">BLOCK 5 LOT 28-34 VALENTINO VILLAGE, SAN JOSE, RODRIGUEZ, RIZAL</div>
        <div class="school-addr">Contact No.: 0924-274-0388</div>
    </div>

    <div class="doc-title">CERTIFICATE OF REGISTRATION</div>

    {{-- STUDENT INFO (CLEAN LOOK - NO LINES) --}}
    <table class="info-table">
        <tr>
            <td class="label">NAME:</td>
            <td class="value uppercase">{{ $info['name'] }}</td>
            <td class="label" style="padding-left: 15px;">LRN:</td>
            <td class="value">{{ $info['lrn'] }}</td>
        </tr>
        <tr>
            <td class="label">STRAND:</td>
            <td class="value uppercase">{{ $info['strand'] }}</td>
            <td class="label" style="padding-left: 15px;">GRADE/SEC:</td>
            <td class="value uppercase">{{ $info['grade_section'] ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td class="label">SY:</td>
            <td class="value">{{ $info['school_year'] }}</td>
            <td class="label" style="padding-left: 15px;">SEMESTER:</td>
            <td class="value uppercase">{{ $info['semester'] }}</td>
        </tr>
    </table>

    {{-- SUBJECTS --}}
    <div class="font-bold" style="margin-top: 10px; margin-bottom: 5px;">SUBJECT LOAD</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="15%">CODE</th>
                <th width="45%">DESCRIPTION</th>
                <th width="20%">SCHEDULE</th>
                <th width="20%">INSTRUCTOR</th>
            </tr>
        </thead>
        <tbody>
            @foreach($subjects as $sub)
                <tr>
                    <td class="text-center font-bold">{{ $sub['code'] }}</td>
                    <td>{{ $sub['desc'] }}</td>
                    <td class="text-center">{{ $sub['sched'] }}</td>
                    <td class="text-center">{{ $sub['teacher'] }}</td>
                </tr>
            @endforeach
            @if(count($subjects) == 0)
                <tr><td colspan="4" class="text-center">No subjects enlisted.</td></tr>
            @endif
        </tbody>
    </table>

    {{-- LAYOUT FOR FEES (Left) AND OR/SIGNATORIES (Right) --}}
    <table style="margin-top: 10px;">
        <tr>
            {{-- LEFT COLUMN: FEES --}}
            <td width="55%" style="vertical-align: top;">
                <div class="font-bold" style="margin-bottom: 5px;">ASSESSMENT OF FEES</div>
                <table class="data-table">
                    <tr>
                        <td>Tuition Fee</td>
                        <td class="text-right">{{ number_format((float)$fees['tuition'], 2) }}</td>
                    </tr>
                    <tr>
                        <td>Miscellaneous Fee</td>
                        <td class="text-right">{{ number_format((float)$fees['miscellaneous'], 2) }}</td>
                    </tr>
                    <tr>
                        <td>Modules / Books</td>
                        <td class="text-right">{{ number_format((float)$fees['books'], 2) }}</td>
                    </tr>
                    <tr style="background: #ddd; font-weight: bold;">
                        <td>TOTAL ASSESSMENT</td>
                        <td class="text-right">PHP {{ number_format((float)$fees['total'], 2) }}</td>
                    </tr>
                </table>
            </td>

            <td width="5%"></td> {{-- Spacer --}}

            {{-- RIGHT COLUMN: OR & SIGNATORIES --}}
            <td width="40%" style="vertical-align: top; text-align: center;">
                
                {{-- OFFICIAL RECEIPT --}}
                <div class="or-box">
                    <div style="font-size: 10pt; font-weight: bold;">OFFICIAL RECEIPT NO.</div>
                    <div style="font-size: 14pt; font-weight: bold; color: red; margin-top: 5px;">{{ $or_number }}</div>
                </div>

                {{-- SIGNATORIES (SPACED OUT) --}}
                
                {{-- 1. ADVISER --}}
                <div class="sig-block">
                    <div class="uppercase font-bold">{{ $signatories['adviser'] }}</div>
                    <div class="sig-line"></div>
                    <div class="sig-label">CLASS ADVISER</div>
                </div>

                {{-- 2. REGISTRAR --}}
                <div class="sig-block">
                    <div class="uppercase font-bold">{{ $signatories['registrar'] }}</div>
                    <div class="sig-line"></div>
                    <div class="sig-label">SCHOOL REGISTRAR</div>
                </div>

                {{-- 3. FINANCE --}}
                <div class="sig-block">
                    <div class="uppercase font-bold">{{ $signatories['finance'] }}</div>
                    <div class="sig-line"></div>
                    <div class="sig-label">FINANCE OFFICER</div>
                </div>
            </td>
        </tr>
    </table>

    {{-- FOOTER WITH REPUBLIC ACT & ADVISORY --}}
    <div class="footer">
        This document is a system-generated report and serves as an official proof of enrollment.<br>
        Any alteration, erasure, or tampering of this document is punishable under <br>
        <strong>Republic Act No. 10175 (Cybercrime Prevention Act of 2012)</strong> and <strong>Article 172 of the Revised Penal Code</strong>.<br>
        <br>
        <strong>VALID ONLY WITH SIGNATURES AND SCHOOL DRY SEAL</strong><br>
        Printed by: {{ $printed_by }} | Date: {{ $printed_at }}
    </div>
</body>
</html>