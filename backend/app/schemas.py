from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time
from uuid import UUID

# --- User & Auth Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    id_number: str
    department_id: Optional[UUID] = None
    avatar_url: Optional[str] = None

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserResponse

class SSOCallbackRequest(BaseModel):
    code: str
    state: str
    redirect_uri: str

# --- Academic Resource Schemas ---
class ResourceCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    course_id: UUID
    department_id: UUID
    category: str
    academic_year: str
    semester: str

class ResourceResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    course_id: UUID
    department_id: UUID
    uploaded_by_id: UUID
    category: str
    file_format: str
    file_size_bytes: int
    storage_path: str
    academic_year: str
    semester: str
    download_count: int
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Library Schemas ---
class BookResponse(BaseModel):
    id: UUID
    isbn: str
    title: str
    authors: List[str]
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    format: str
    call_number: Optional[str] = None
    shelf_location: Optional[str] = None
    total_copies: int
    available_copies: int
    status: str
    cover_image_url: Optional[str] = None
    summary: Optional[str] = None

    class Config:
        from_attributes = True

class BorrowRequest(BaseModel):
    book_id: UUID
    duration_days: int = Field(default=14, le=30)

class LoanResponse(BaseModel):
    id: UUID
    book_id: UUID
    borrower_id: UUID
    borrowed_at: datetime
    due_date: date
    status: str
    renewals_count: int
    fine_amount_cents: int

    class Config:
        from_attributes = True

# --- Timetable Schemas ---
class TimetableSlotCreate(BaseModel):
    course_id: UUID
    facility_id: UUID
    instructor_id: UUID
    day_of_week: str
    start_time: time
    end_time: time
    class_type: str = "lecture"
    group_code: str = "MAIN"
    academic_year: str
    semester: str

class TimetableConflictCheckRequest(BaseModel):
    facility_id: UUID
    day_of_week: str
    start_time: time
    end_time: time
    academic_year: str
    semester: str
    exclude_slot_id: Optional[UUID] = None

class TimetableConflictCheckResponse(BaseModel):
    has_conflict: boolean if False else bool
    conflicting_slots: List[Dict[str, Any]] = []
    message: str

class TimetableSlotResponse(BaseModel):
    id: UUID
    course_id: UUID
    facility_id: UUID
    instructor_id: UUID
    day_of_week: str
    start_time: time
    end_time: time
    class_type: str
    group_code: str
    academic_year: str
    semester: str

    class Config:
        from_attributes = True

# --- Booking Schemas ---
class BookingCreate(BaseModel):
    facility_id: UUID
    purpose: str
    start_time: datetime
    end_time: datetime
    attendees_expected: int
    notes: Optional[str] = None

class BookingResponse(BaseModel):
    id: UUID
    facility_id: UUID
    reserved_by_id: UUID
    purpose: str
    start_time: datetime
    end_time: datetime
    attendees_expected: int
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Form Schemas ---
class FormSubmissionCreate(BaseModel):
    form_type: str
    title: str
    reason: str
    form_data: Dict[str, Any] = {}

class FormStatusUpdate(BaseModel):
    status: str # 'approved', 'rejected', 'under_review'
    reviewer_remarks: Optional[str] = None

class FormResponse(BaseModel):
    id: UUID
    reference_number: str
    form_type: str
    applicant_id: UUID
    reviewer_id: Optional[UUID] = None
    title: str
    reason: str
    form_data: Dict[str, Any]
    status: str
    reviewer_remarks: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Event Schemas ---
class EventCreate(BaseModel):
    title: str
    description: str
    category: str
    facility_id: Optional[UUID] = None
    venue_custom_name: Optional[str] = None
    start_time: datetime
    end_time: datetime
    max_attendees: Optional[int] = None
    banner_image_url: Optional[str] = None

class EventResponse(BaseModel):
    id: UUID
    title: str
    description: str
    category: str
    organizer_id: UUID
    facility_id: Optional[UUID] = None
    venue_custom_name: Optional[str] = None
    start_time: datetime
    end_time: datetime
    max_attendees: Optional[int] = None
    current_rsvps: int
    is_published: bool
    banner_image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
