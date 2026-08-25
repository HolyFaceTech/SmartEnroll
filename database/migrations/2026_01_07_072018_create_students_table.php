<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Core Students Table
        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('student_number')->unique()->nullable();
            $table->string('lrn')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('suffix')->nullable();
            $table->string('email')->unique();
            $table->string('contact_number');
            $table->string('status')->default('pending');
            $table->string('previous_status')->nullable();
            $table->string('released_by')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Personal Info (Student Profiles)
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained('students')->onDelete('cascade');
            $table->date('date_of_birth');
            $table->string('gender');
            $table->string('place_of_birth');
            $table->string('citizenship');
            $table->string('civil_status');
            $table->string('religion');
            $table->text('home_address');
            $table->text('provincial_address')->nullable();
            $table->timestamps();
        });

        // Academic Info (Student Academics)
        Schema::create('student_academics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained('students')->onDelete('cascade');
            $table->string('current_school_attended')->nullable();
            $table->foreignUuid('strand_id')->constrained('strands')->onDelete('cascade');
            $table->foreignUuid('section_id')->nullable()->constrained('sections')->onDelete('set null');
            $table->string('grade_level');
            $table->string('term');
            $table->string('school_year');
            $table->string('learning_modality')->default('Face-to-Face');
            $table->decimal('general_average', 5, 2)->nullable();
            $table->timestamps();
        });

        // Family and Guardian Info (Student Families)
        Schema::create('student_families', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained('students')->onDelete('cascade');
            $table->string('employer_name')->nullable();
            $table->string('employer_contact')->nullable();
            $table->string('father_name')->nullable();
            $table->string('father_occupation')->nullable();
            $table->string('father_contact')->nullable();
            $table->string('mother_name')->nullable();
            $table->string('mother_occupation')->nullable();
            $table->string('mother_contact')->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_occupation')->nullable();
            $table->string('guardian_contact')->nullable();
            $table->timestamps();
        });

        // Requirements and Uploaded Files Info (Student Requirements)
        Schema::create('student_requirements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained('students')->onDelete('cascade');
            $table->json('requirements')->nullable();
            $table->string('psa')->nullable();
            $table->string('form_137')->nullable();
            $table->string('good_moral')->nullable();
            $table->string('diploma')->nullable();
            $table->string('form_138')->nullable();
            $table->string('photo_2x2')->nullable();
            $table->string('e_sign')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_requirements');
        Schema::dropIfExists('student_families');
        Schema::dropIfExists('student_academics');
        Schema::dropIfExists('student_profiles');
        Schema::dropIfExists('students');
    }
};
