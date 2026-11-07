import React, { useState } from 'react';
import { 
  Database, 
  Code2, 
  Copy, 
  Check, 
  ShieldCheck, 
  FileCode, 
  Server
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schema' | 'fastapi' | 'auth' | 'frontend' | 'openapi'>('schema');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 3000);
  };

  const schemaSqlSample = `-- ============================================================================
-- OMNICAMPUS: UNIVERSITY RESOURCE HUB
-- Comprehensive PostgreSQL Relational Database Schema
-- Version: 1.0.0 | Production Release (PostgreSQL 14, 15, 16+)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- For temporal exclusion constraints

-- 1. ENUM TYPES
CREATE TYPE user_role AS ENUM ('student', 'lecturer', 'admin_staff', 'system_admin');
CREATE TYPE resource_category AS ENUM ('lecture_notes', 'past_exam_paper', 'syllabus', 'lab_manual', 'assignment_brief');
CREATE TYPE file_format AS ENUM ('pdf', 'docx', 'pptx', 'xlsx', 'zip', 'ipynb');
CREATE TYPE book_status AS ENUM ('available', 'checked_out', 'reserved', 'under_maintenance');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE form_type AS ENUM ('student_clearance', 'leave_of_absence', 'grade_appeal', 'transcript_request');
CREATE TYPE form_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected');

-- 2. USERS & SSO TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sso_sub_id VARCHAR(255) NOT NULL UNIQUE,           -- Unique Subject ID from IdP (OIDC)
    email VARCHAR(255) NOT NULL UNIQUE,                -- Institutional email (e.g. user@univ.edu)
    full_name VARCHAR(160) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    id_number VARCHAR(32) NOT NULL UNIQUE,             -- Matriculation No. or Staff ID
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- 3. ACADEMIC RESOURCE REPOSITORY
CREATE TABLE academic_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category resource_category NOT NULL,
    file_format file_format NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    storage_path TEXT NOT NULL,                        -- Object Storage Key (S3 / GCS)
    file_checksum_sha256 VARCHAR(64) NOT NULL,
    academic_year VARCHAR(16) NOT NULL,
    semester VARCHAR(16) NOT NULL,
    download_count INT NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resources_course ON academic_resources(course_id);
CREATE INDEX idx_resources_category ON academic_resources(category);

-- 4. CAMPUS FACILITIES & ROOM BOOKING WITH EXCLUSION CONSTRAINT
CREATE TABLE campus_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    facility_type VARCHAR(64) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    amenities TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE TABLE room_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES campus_facilities(id) ON DELETE CASCADE,
    reserved_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    attendees_expected INT NOT NULL CHECK (attendees_expected > 0),
    status booking_status NOT NULL DEFAULT 'confirmed',
    CONSTRAINT chk_booking_time_valid CHECK (end_time > start_time),
    -- PostgreSQL Temporal Exclusion Constraint: Prevents double-booking
    CONSTRAINT exclude_overlapping_facility_bookings
    EXCLUDE USING gist (
        facility_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status = 'confirmed')
);

-- 5. TIMETABLE SCHEDULES WITH ROOM CONFLICT PREVENTION
CREATE TABLE timetable_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES campus_facilities(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    day_of_week VARCHAR(16) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    class_type VARCHAR(32) NOT NULL DEFAULT 'lecture',
    academic_year VARCHAR(16) NOT NULL,
    semester VARCHAR(16) NOT NULL,
    -- Prevent two classes sharing the same room at the same time
    CONSTRAINT exclude_timetable_room_conflict
    EXCLUDE USING gist (
        facility_id WITH =,
        day_of_week WITH =,
        academic_year WITH =,
        semester WITH =,
        timerange(start_time, end_time) WITH &&
    )
);

-- 6. ADMINISTRATIVE FORMS
CREATE TABLE administrative_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(32) NOT NULL UNIQUE,
    form_type form_type NOT NULL,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status form_status NOT NULL DEFAULT 'submitted',
    reviewer_remarks TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ
);`;

  const fastApiCodeSample = `# ============================================================================
# FastAPI Backend Architecture: OmniCampus University Resource Hub
# File: backend/app/main.py
# ============================================================================

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from uuid import UUID

from app.config import settings
from app.database import get_db
from app.models import User, AcademicResource, RoomBooking, TimetableSchedule, AdministrativeForm
from app.schemas import ResourceResponse, TimetableConflictCheckResponse, BookingResponse, FormResponse
from app.auth import get_current_user, require_lecturer, require_admin_staff, RoleChecker

app = FastAPI(
    title="OmniCampus University Resource Hub API",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/api/v1/openapi.json"
)

# 1. ACADEMIC REPOSITORY ENDPOINTS
@app.get("/api/v1/resources", response_model=List[ResourceResponse], tags=["Academic Resources"])
async def list_resources(
    course_code: Optional[str] = None,
    category: Optional[str] = None,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve downloadable materials (Lecture Notes, Past Exam Papers)."""
    query = db.query(AcademicResource)
    if category:
        query = query.filter(AcademicResource.category == category)
    return query.all()

@app.post("/api/v1/resources/upload", response_model=ResourceResponse, tags=["Academic Resources"])
async def upload_resource(
    title: str = Form(...),
    course_id: UUID = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_lecturer), # Enforce Lecturer or Admin role
    db = Depends(get_db)
):
    """Upload lecture notes or past exam papers. Restricted to Lecturers and Admins."""
    content = await file.read()
    resource = AcademicResource(
        title=title,
        course_id=course_id,
        uploaded_by_id=current_user.id,
        file_size_bytes=len(content),
        storage_path=f"resources/{course_id}/{file.filename}"
    )
    db.add(resource)
    db.commit()
    return resource

# 2. CONFLICT-DETECTION TIMETABLE ENGINE
@app.post("/api/v1/timetable/check-conflict", response_model=TimetableConflictCheckResponse, tags=["Timetable"])
async def check_conflict(
    facility_id: UUID,
    day_of_week: str,
    start_time: str,
    end_time: str,
    db = Depends(get_db)
):
    """Real-time validation against class overlaps and room double-allocations."""
    conflicts = db.query(TimetableSchedule).filter(
        TimetableSchedule.facility_id == facility_id,
        TimetableSchedule.day_of_week == day_of_week,
        TimetableSchedule.start_time < end_time,
        TimetableSchedule.end_time > start_time
    ).all()
    return {
        "has_conflict": len(conflicts) > 0,
        "conflicting_count": len(conflicts),
        "message": "Room collision detected" if conflicts else "No conflict"
    }

# 3. ADMINISTRATIVE WORKFLOW STATUS UPDATES
@app.patch("/api/v1/forms/{form_id}/status", response_model=FormResponse, tags=["Forms"])
async def review_form(
    form_id: UUID,
    status: str,
    remarks: str,
    current_user: User = Depends(require_admin_staff), # Restricted to Admin Staff
    db = Depends(get_db)
):
    """Adjudicate student clearance, appeal, or leave of absence filings."""
    form = db.query(AdministrativeForm).filter(AdministrativeForm.id == form_id).first()
    form.status = status
    form.reviewer_id = current_user.id
    form.reviewer_remarks = remarks
    db.commit()
    return form`;

  const authCodeSample = `# ============================================================================
# Institutional Single Sign-On (SSO / OIDC) & Role-Based Access Control
# File: backend/app/auth.py
# ============================================================================

from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import List
from app.config import settings
from app.models import User, UserRole
from app.database import get_db

security_scheme = HTTPBearer()

def get_current_user(
    auth: HTTPAuthorizationCredentials = Security(security_scheme),
    db = Depends(get_db)
) -> User:
    """Verifies Bearer JWT signature issued during Institutional SSO login."""
    try:
        payload = jwt.decode(auth.credentials, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid SSO token credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Institutional token expired or tampered")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=403, detail="Institutional account inactive")
    return user

class RoleChecker:
    """RBAC Route Guard Dependency Factory."""
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{user.role}' lacks privileges. Required: {self.allowed_roles}"
            )
        return user

# Pre-configured route dependencies
require_student = RoleChecker([UserRole.STUDENT, UserRole.LECTURER, UserRole.ADMIN_STAFF, UserRole.SYSTEM_ADMIN])
require_lecturer = RoleChecker([UserRole.LECTURER, UserRole.SYSTEM_ADMIN])
require_admin_staff = RoleChecker([UserRole.ADMIN_STAFF, UserRole.SYSTEM_ADMIN])
require_system_admin = RoleChecker([UserRole.SYSTEM_ADMIN])`;

  const frontendFetchSample = `// ============================================================================
// Vanilla JavaScript & HTML5 Fetch Integration with FastAPI Backend
// Example: Academic Resources Fetcher & Timetable Conflict Checker
// ============================================================================

const API_BASE_URL = 'https://hub.univ.edu/api/v1';

// 1. Fetch Academic Resources with RBAC Bearer Token
async function fetchAcademicResources(category = 'lecture_notes') {
  const token = localStorage.getItem('omnicampus_sso_token');
  
  const response = await fetch(\`\${API_BASE_URL}/resources?category=\${category}\`, {
    method: 'GET',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(\`Failed to fetch materials: \${response.statusText}\`);
  }

  const materials = await response.json();
  renderResourceCards(materials);
}

// 2. Real-Time Conflict Check before adding Timetable Slot
async function checkScheduleConflict(facilityId, dayOfWeek, startTime, endTime) {
  const token = localStorage.getItem('omnicampus_sso_token');
  
  const response = await fetch(\`\${API_BASE_URL}/timetable/check-conflict\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      facility_id: facilityId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime
    })
  });

  const result = await response.json();
  if (result.has_conflict) {
    displayConflictBanner(result.message);
    return false;
  }
  return true;
}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-indigo-50 text-[#312E81] rounded-xl">
                <Database className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
                PostgreSQL Schema & FastAPI Architecture Explorer
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
              Inspect, copy, or export the complete production PostgreSQL DDL statements, FastAPI Python endpoints, and institutional SSO middleware.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-50 border border-slate-200 text-[#15803d] font-mono font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
              FastAPI v0.110 &bull; PostgreSQL 16
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs border-b border-slate-200 pb-2">
        {[
          { id: 'schema', label: '1. PostgreSQL DDL Schema', icon: Database },
          { id: 'fastapi', label: '2. FastAPI Core Endpoints', icon: Server },
          { id: 'auth', label: '3. SSO & RBAC Middleware', icon: ShieldCheck },
          { id: 'frontend', label: '4. Frontend Fetch API Integration', icon: Code2 },
          { id: 'openapi', label: '5. Swagger OpenAPI Endpoints', icon: FileCode }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition ${
                isActive 
                  ? 'bg-[#312E81] text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-slate-100">
        {/* Code Header Bar with Copy Button */}
        <div className="bg-[#090d16] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
            <span className="text-xs text-slate-400 font-mono ml-2 font-medium">
              {activeTab === 'schema' && 'backend/schema.sql (PostgreSQL Relational Schema)'}
              {activeTab === 'fastapi' && 'backend/app/main.py (FastAPI App & Routers)'}
              {activeTab === 'auth' && 'backend/app/auth.py (Institutional SSO & RBAC Security)'}
              {activeTab === 'frontend' && 'frontend/api-client.js (Fetch API Integration)'}
              {activeTab === 'openapi' && 'Interactive Swagger OpenAPI Endpoints Summary'}
            </span>
          </div>

          <button
            onClick={() => {
              const textMap: Record<string, string> = {
                schema: schemaSqlSample,
                fastapi: fastApiCodeSample,
                auth: authCodeSample,
                frontend: frontendFetchSample,
                openapi: 'OpenAPI Specification available at /api/v1/openapi.json'
              };
              handleCopy(textMap[activeTab], activeTab);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition font-semibold border border-slate-700"
          >
            {copiedSection === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code display */}
        <div className="p-5 sm:p-6 overflow-x-auto font-mono text-xs leading-relaxed max-h-[600px] overflow-y-auto">
          {activeTab === 'schema' && (
            <pre className="text-emerald-300">
              <code>{schemaSqlSample}</code>
            </pre>
          )}

          {activeTab === 'fastapi' && (
            <pre className="text-cyan-300">
              <code>{fastApiCodeSample}</code>
            </pre>
          )}

          {activeTab === 'auth' && (
            <pre className="text-amber-300">
              <code>{authCodeSample}</code>
            </pre>
          )}

          {activeTab === 'frontend' && (
            <pre className="text-indigo-300">
              <code>{frontendFetchSample}</code>
            </pre>
          )}

          {activeTab === 'openapi' && (
            <div className="font-sans space-y-4">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs space-y-1">
                <h4 className="font-bold text-white text-sm">Interactive Swagger / OpenAPI Specifications</h4>
                <p className="text-slate-400">
                  FastAPI automatically mounts Swagger interactive docs at <code>/docs</code> and ReDoc at <code>/redoc</code>.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { method: 'POST', path: '/api/v1/auth/sso/callback', desc: 'Exchange institutional IdP authorization code for internal JWT' },
                  { method: 'GET', path: '/api/v1/resources', desc: 'Search and filter lecture notes and past exam papers' },
                  { method: 'POST', path: '/api/v1/resources/upload', desc: 'Secure upload for lecture notes (Lecturer/Admin only)' },
                  { method: 'GET', path: '/api/v1/library/books', desc: 'Query library stack catalog with ISBN and availability' },
                  { method: 'POST', path: '/api/v1/library/borrow', desc: 'Create book loan record and decrement available copies' },
                  { method: 'POST', path: '/api/v1/timetable/check-conflict', desc: 'Real-time clash detection for overlapping classes and room allocations' },
                  { method: 'POST', path: '/api/v1/bookings', desc: 'Reserve campus lab/room with exclusion double-booking prevention' },
                  { method: 'POST', path: '/api/v1/forms', desc: 'Submit clearance, leave of absence, or grade appeal form' },
                  { method: 'PATCH', path: '/api/v1/forms/{id}/status', desc: 'Review & approve/reject application (Admin Staff only)' },
                  { method: 'GET', path: '/api/v1/events', desc: 'Live campus events feed with venue and RSVP counters' }
                ].map((ep, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                        ep.method === 'GET' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                        ep.method === 'POST' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {ep.method}
                      </span>
                      <code className="text-slate-200 font-mono font-semibold">{ep.path}</code>
                    </div>
                    <span className="text-slate-400 text-xs hidden md:inline">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
