-- ============================================================================
-- OMNICAMPUS: UNIVERSITY RESOURCE HUB
-- Comprehensive PostgreSQL Relational Database Schema
-- Version: 1.0.0 | Production Release
-- Compatible with PostgreSQL 14, 15, 16+
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Required for temporal exclusion constraints

-- ============================================================================
-- 1. ENUM TYPES & DOMAINS
-- ============================================================================

CREATE TYPE user_role AS ENUM (
    'student',
    'lecturer',
    'admin_staff',
    'system_admin'
);

CREATE TYPE resource_category AS ENUM (
    'lecture_notes',
    'past_exam_paper',
    'syllabus',
    'lab_manual',
    'assignment_brief',
    'reference_reading'
);

CREATE TYPE file_format AS ENUM (
    'pdf',
    'docx',
    'pptx',
    'xlsx',
    'zip',
    'ipynb',
    'mp4'
);

CREATE TYPE book_status AS ENUM (
    'available',
    'checked_out',
    'reserved',
    'under_maintenance',
    'archived'
);

CREATE TYPE book_format AS ENUM (
    'physical',
    'digital_pdf',
    'digital_epub',
    'audiobook'
);

CREATE TYPE booking_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'rejected',
    'completed'
);

CREATE TYPE form_type AS ENUM (
    'student_clearance',
    'leave_of_absence',
    'grade_appeal',
    'transcript_request',
    'course_add_drop',
    'lab_safety_clearance'
);

CREATE TYPE form_status AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'approved',
    'rejected',
    'withdrawn'
);

CREATE TYPE event_category AS ENUM (
    'academic_seminar',
    'hackathon',
    'career_fair',
    'guest_lecture',
    'student_society',
    'workshop',
    'campus_sports'
);

CREATE TYPE day_of_week AS ENUM (
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday'
);

CREATE TYPE class_type AS ENUM (
    'lecture',
    'laboratory',
    'tutorial',
    'seminar',
    'workshop'
);

-- ============================================================================
-- 2. CORE INSTITUTIONAL ENTITIES
-- ============================================================================

-- Faculties (e.g. Faculty of Engineering, Faculty of Science, etc.)
CREATE TABLE faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(16) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    dean_name VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Departments (e.g. Computer Science, Electrical Engineering)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    code VARCHAR(16) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    head_of_department VARCHAR(128),
    building_location VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_faculty ON departments(faculty_id);

-- Users (Integrated with Institutional Single Sign-On / OIDC)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sso_sub_id VARCHAR(255) NOT NULL UNIQUE,           -- Unique Subject ID from Institutional OIDC / IdP
    email VARCHAR(255) NOT NULL UNIQUE,                -- Institutional email (e.g. user@univ.edu)
    full_name VARCHAR(160) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    id_number VARCHAR(32) NOT NULL UNIQUE,             -- Matriculation No. or Staff ID
    phone_number VARCHAR(32),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_sso ON users(sso_sub_id);

-- Academic Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(16) NOT NULL UNIQUE,                 -- e.g. CS301, ENG202
    title VARCHAR(255) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    coordinator_lecturer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    credits INT NOT NULL CHECK (credits > 0),
    level INT NOT NULL CHECK (level BETWEEN 100 AND 800),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_courses_dept ON courses(department_id);
CREATE INDEX idx_courses_coordinator ON courses(coordinator_lecturer_id);

-- Course Enrollments
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_year VARCHAR(16) NOT NULL,               -- e.g. "2025/2026"
    semester VARCHAR(16) NOT NULL,                    -- e.g. "Semester 1", "Semester 2"
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) NOT NULL DEFAULT 'active',     -- 'active', 'dropped', 'completed'
    CONSTRAINT uq_student_course_term UNIQUE (student_id, course_id, academic_year, semester)
);

CREATE INDEX idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);

-- ============================================================================
-- 3. ACADEMIC RESOURCE REPOSITORY (Lecture Notes, Past Exam Papers)
-- ============================================================================

CREATE TABLE academic_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category resource_category NOT NULL,
    file_format file_format NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    storage_path TEXT NOT NULL,                        -- Object storage key (S3 / Cloud Storage)
    file_checksum_sha256 VARCHAR(64) NOT NULL,
    academic_year VARCHAR(16) NOT NULL,                -- e.g. "2024/2025"
    semester VARCHAR(16) NOT NULL,                     -- e.g. "Semester 1"
    download_count INT NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,        -- Verified by department head or admin
    verified_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resources_course ON academic_resources(course_id);
CREATE INDEX idx_resources_dept ON academic_resources(department_id);
CREATE INDEX idx_resources_category ON academic_resources(category);
CREATE INDEX idx_resources_year_sem ON academic_resources(academic_year, semester);
CREATE INDEX idx_resources_uploader ON academic_resources(uploaded_by_id);
CREATE INDEX idx_resources_title_trgm ON academic_resources USING gin (title gin_trgm_ops);

-- Resource Download Auditing
CREATE TABLE resource_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES academic_resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_resource_downloads_res ON resource_downloads(resource_id);
CREATE INDEX idx_resource_downloads_user ON resource_downloads(user_id);

-- ============================================================================
-- 4. LIBRARY BOOKS CATALOG & BORROW WORKFLOW
-- ============================================================================

CREATE TABLE library_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isbn VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    authors TEXT[] NOT NULL,
    publisher VARCHAR(160),
    publication_year INT,
    edition VARCHAR(32),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    format book_format NOT NULL DEFAULT 'physical',
    call_number VARCHAR(64),                           -- Library of Congress classification
    shelf_location VARCHAR(64),                        -- e.g. "Floor 2, Section D, Row 4"
    total_copies INT NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
    available_copies INT NOT NULL DEFAULT 1 CHECK (available_copies >= 0 AND available_copies <= total_copies),
    status book_status NOT NULL DEFAULT 'available',
    digital_access_url TEXT,
    cover_image_url TEXT,
    summary TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_books_isbn ON library_books(isbn);
CREATE INDEX idx_books_status ON library_books(status);
CREATE INDEX idx_books_dept ON library_books(department_id);
CREATE INDEX idx_books_title_trgm ON library_books USING gin (title gin_trgm_ops);

-- Book Borrowing & Reservation Requests
CREATE TABLE book_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    borrower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    borrowed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    returned_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'borrowed',    -- 'borrowed', 'returned', 'overdue', 'reserved'
    renewals_count INT NOT NULL DEFAULT 0 CHECK (renewals_count <= 3),
    fine_amount_cents INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loans_book ON book_loans(book_id);
CREATE INDEX idx_loans_borrower ON book_loans(borrower_id);
CREATE INDEX idx_loans_due ON book_loans(due_date) WHERE returned_at IS NULL;

-- ============================================================================
-- 5. CAMPUS FACILITIES, ROOM & LAB BOOKING
-- ============================================================================

CREATE TABLE campus_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,                 -- e.g. "LAB-CS-302", "HALL-ENG-1"
    name VARCHAR(160) NOT NULL,
    facility_type VARCHAR(64) NOT NULL,                -- 'lecture_hall', 'computer_lab', 'study_pod', 'conference_room'
    building VARCHAR(128) NOT NULL,
    floor VARCHAR(16) NOT NULL,
    room_number VARCHAR(32) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    has_projector BOOLEAN NOT NULL DEFAULT TRUE,
    has_computers BOOLEAN NOT NULL DEFAULT FALSE,
    computer_count INT DEFAULT 0,
    has_video_conferencing BOOLEAN NOT NULL DEFAULT FALSE,
    has_whiteboard BOOLEAN NOT NULL DEFAULT TRUE,
    is_air_conditioned BOOLEAN NOT NULL DEFAULT TRUE,
    is_operational BOOLEAN NOT NULL DEFAULT TRUE,
    amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facilities_type ON campus_facilities(facility_type);
CREATE INDEX idx_facilities_building ON campus_facilities(building);

-- Room & Lab Reservations (Slot-based with temporal overlap protection)
CREATE TABLE room_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES campus_facilities(id) ON DELETE CASCADE,
    reserved_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    purpose VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    attendees_expected INT NOT NULL CHECK (attendees_expected > 0),
    status booking_status NOT NULL DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_booking_time_valid CHECK (end_time > start_time)
);

CREATE INDEX idx_bookings_facility ON room_bookings(facility_id);
CREATE INDEX idx_bookings_user ON room_bookings(reserved_by_id);
CREATE INDEX idx_bookings_range ON room_bookings(facility_id, start_time, end_time);

-- Postgres Exclusion Constraint: Prevents double-booking same facility for overlapping confirmed slots
ALTER TABLE room_bookings
ADD CONSTRAINT exclude_overlapping_facility_bookings
EXCLUDE USING gist (
    facility_id WITH =,
    tstzrange(start_time, end_time) WITH &&
)
WHERE (status = 'confirmed');

-- ============================================================================
-- 6. INTERACTIVE TIMETABLE & CONFLICT-AWARE SCHEDULES
-- ============================================================================

CREATE TABLE timetable_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES campus_facilities(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    day_of_week day_of_week NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    class_type class_type NOT NULL DEFAULT 'lecture',
    group_code VARCHAR(16) NOT NULL DEFAULT 'MAIN',    -- e.g. "LEC-A", "LAB-G1"
    academic_year VARCHAR(16) NOT NULL,                -- e.g. "2025/2026"
    semester VARCHAR(16) NOT NULL,                     -- e.g. "Semester 1"
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_timetable_time_valid CHECK (end_time > start_time)
);

CREATE INDEX idx_timetable_course ON timetable_schedules(course_id);
CREATE INDEX idx_timetable_instructor ON timetable_schedules(instructor_id);
CREATE INDEX idx_timetable_facility ON timetable_schedules(facility_id);
CREATE INDEX idx_timetable_term ON timetable_schedules(academic_year, semester, day_of_week);

-- Room conflict prevention in timetable (No two classes in same room at same time on same day and term)
ALTER TABLE timetable_schedules
ADD CONSTRAINT exclude_timetable_room_conflict
EXCLUDE USING gist (
    facility_id WITH =,
    day_of_week WITH =,
    academic_year WITH =,
    semester WITH =,
    timerange(start_time, end_time) WITH &&
);

-- ============================================================================
-- 7. ADMINISTRATIVE FORMS PORTAL & WORKFLOW TRACKING
-- ============================================================================

CREATE TABLE administrative_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(32) NOT NULL UNIQUE,      -- e.g. "FORM-2025-0814"
    form_type form_type NOT NULL,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,      -- Dynamic form fields (dates, courses, semester, etc.)
    status form_status NOT NULL DEFAULT 'submitted',
    reviewer_remarks TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_forms_applicant ON administrative_forms(applicant_id);
CREATE INDEX idx_forms_reviewer ON administrative_forms(reviewer_id);
CREATE INDEX idx_forms_status ON administrative_forms(status);
CREATE INDEX idx_forms_type ON administrative_forms(form_type);

-- Supporting Attachments for Forms
CREATE TABLE form_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES administrative_forms(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_form ON form_attachments(form_id);

-- ============================================================================
-- 8. CAMPUS EVENTS FEED & RSVPS
-- ============================================================================

CREATE TABLE campus_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category event_category NOT NULL,
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES campus_facilities(id) ON DELETE SET NULL,
    venue_custom_name VARCHAR(160),                    -- Fallback if off-campus or outdoor
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    max_attendees INT CHECK (max_attendees > 0),
    current_rsvps INT NOT NULL DEFAULT 0 CHECK (current_rsvps >= 0),
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    banner_image_url TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_event_time_valid CHECK (end_time > start_time)
);

CREATE INDEX idx_events_start ON campus_events(start_time);
CREATE INDEX idx_events_category ON campus_events(category);
CREATE INDEX idx_events_organizer ON campus_events(organizer_id);

-- Event RSVPs
CREATE TABLE event_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES campus_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rsvp_status VARCHAR(32) NOT NULL DEFAULT 'attending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_event_user_rsvp UNIQUE (event_id, user_id)
);

CREATE INDEX idx_rsvps_event ON event_rsvps(event_id);
CREATE INDEX idx_rsvps_user ON event_rsvps(user_id);

-- ============================================================================
-- 9. AUDIT LOGGING & INSTITUTIONAL COMPLIANCE
-- ============================================================================

CREATE TABLE system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,                       -- e.g. 'UPLOAD_RESOURCE', 'APPROVE_FORM', 'CANCEL_BOOKING'
    target_table VARCHAR(64) NOT NULL,
    target_id UUID,
    ip_address INET,
    user_agent TEXT,
    payload_snapshot JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_actor ON system_audit_logs(actor_id);
CREATE INDEX idx_audit_action ON system_audit_logs(action);
CREATE INDEX idx_audit_created ON system_audit_logs(created_at);

-- ============================================================================
-- 10. DATABASE TRIGGERS & AUTOMATION
-- ============================================================================

-- Generic updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_academic_resources_updated_at BEFORE UPDATE ON academic_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_library_books_updated_at BEFORE UPDATE ON library_books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_campus_facilities_updated_at BEFORE UPDATE ON campus_facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_room_bookings_updated_at BEFORE UPDATE ON room_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_timetable_schedules_updated_at BEFORE UPDATE ON timetable_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_administrative_forms_updated_at BEFORE UPDATE ON administrative_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_campus_events_updated_at BEFORE UPDATE ON campus_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automatically decrement available copies when loan created, increment on return
CREATE OR REPLACE FUNCTION sync_book_inventory_on_loan()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'borrowed') THEN
        UPDATE library_books
        SET available_copies = available_copies - 1,
            status = CASE WHEN available_copies - 1 <= 0 THEN 'checked_out'::book_status ELSE status END
        WHERE id = NEW.book_id;
    ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'borrowed' AND NEW.status = 'returned') THEN
        UPDATE library_books
        SET available_copies = available_copies + 1,
            status = 'available'::book_status
        WHERE id = NEW.book_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_book_inventory
AFTER INSERT OR UPDATE OF status ON book_loans
FOR EACH ROW EXECUTE FUNCTION sync_book_inventory_on_loan();

-- Increment download counter
CREATE OR REPLACE FUNCTION increment_resource_download_counter()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE academic_resources
    SET download_count = download_count + 1
    WHERE id = NEW.resource_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_resource_downloads
AFTER INSERT ON resource_downloads
FOR EACH ROW EXECUTE FUNCTION increment_resource_download_counter();

-- Sync Event RSVP counter
CREATE OR REPLACE FUNCTION sync_event_rsvp_headcount()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE campus_events
        SET current_rsvps = current_rsvps + 1
        WHERE id = NEW.event_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE campus_events
        SET current_rsvps = GREATEST(0, current_rsvps - 1)
        WHERE id = OLD.event_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_event_rsvps
AFTER INSERT OR DELETE ON event_rsvps
FOR EACH ROW EXECUTE FUNCTION sync_event_rsvp_headcount();
