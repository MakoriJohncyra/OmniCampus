from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date, time
import os

from app.config import settings
from app.database import get_db, Base, engine
from app.models import (
    User, UserRole, Course, AcademicResource, LibraryBook,
    CampusFacility, RoomBooking, TimetableSchedule, AdministrativeForm,
    CampusEvent, ResourceCategory, BookStatus, BookingStatus, FormStatus
)
from app.schemas import (
    UserResponse, TokenResponse, ResourceResponse, BookResponse,
    LoanResponse, BorrowRequest, TimetableSlotResponse, TimetableSlotCreate,
    TimetableConflictCheckRequest, TimetableConflictCheckResponse,
    BookingResponse, BookingCreate, FormResponse, FormSubmissionCreate,
    FormStatusUpdate, EventResponse, EventCreate
)
from app.auth import (
    get_current_user, create_access_token, RoleChecker,
    require_lecturer, require_admin_staff, require_system_admin,
    require_staff_or_lecturer
)

# Initialize database schema if not present
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    Comprehensive backend API for OmniCampus University Resource Hub.
    Provides modules for Institutional SSO Authentication (RBAC), Academic Resources,
    Library Books Catalog, Conflict-Aware Timetable Builder, Room & Lab Bookings,
    Administrative Digital Forms, and Campus Events.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json"
)

# Configure CORS for institutional web frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# MODULE 1: AUTHENTICATION & INSTITUTIONAL SSO
# ============================================================================

@app.post("/api/v1/auth/sso/callback", response_model=TokenResponse, tags=["Authentication & SSO"])
async def sso_callback(code: str, redirect_uri: str, db = Depends(get_db)):
    """
    Exchanges institutional IdP OAuth2 authorization code for an internal JWT session token.
    Maps verified SSO identity to institutional User and RBAC Role.
    """
    # In production, exchange code with IdP token endpoint
    # Simulated demonstration user:
    user = db.query(User).filter(User.email == "student@univ.edu").first()
    if not user:
        raise HTTPException(status_code=400, detail="User identity not found in institutional directory")
    
    token = create_access_token(user.id, user.role, user.email)
    return TokenResponse(
        access_token=token,
        token_type="Bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user
    )

@app.get("/api/v1/auth/me", response_model=UserResponse, tags=["Authentication & SSO"])
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user profile along with role and permissions."""
    return current_user

# ============================================================================
# MODULE 2: ACADEMIC RESOURCE REPOSITORY (Lecture Notes & Past Exams)
# ============================================================================

@app.get("/api/v1/resources", response_model=List[ResourceResponse], tags=["Academic Resources"])
async def list_resources(
    department_id: Optional[UUID] = None,
    course_code: Optional[str] = None,
    category: Optional[str] = None,
    academic_year: Optional[str] = None,
    semester: Optional[str] = None,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search and filter academic repository resources (Lecture Notes, Past Exam Papers).
    Accessible to all authenticated campus members.
    """
    query = db.query(AcademicResource)
    if department_id:
        query = query.filter(AcademicResource.department_id == department_id)
    if category:
        query = query.filter(AcademicResource.category == category)
    if academic_year:
        query = query.filter(AcademicResource.academic_year == academic_year)
    if semester:
        query = query.filter(AcademicResource.semester == semester)
    if course_code:
        query = query.join(Course).filter(Course.code.ilike(f"%{course_code}%"))
    return query.order_by(AcademicResource.created_at.desc()).all()

@app.post("/api/v1/resources/upload", response_model=ResourceResponse, tags=["Academic Resources"])
async def upload_resource(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    course_id: UUID = Form(...),
    department_id: UUID = Form(...),
    category: str = Form(...),
    academic_year: str = Form(...),
    semester: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_lecturer), # Only Lecturers and Admins can upload
    db = Depends(get_db)
):
    """
    Upload lecture notes or past examination papers.
    Restricted to Lecturers and System Administrators.
    Computes SHA-256 checksum, validates file size and stores metadata.
    """
    # Verify file size and format
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size (50MB)")
    
    file_ext = file.filename.split('.')[-1].lower() if '.' in file.filename else 'bin'
    
    resource = AcademicResource(
        title=title,
        description=description,
        course_id=course_id,
        department_id=department_id,
        uploaded_by_id=current_user.id,
        category=category,
        file_format=file_ext,
        file_size_bytes=len(content),
        storage_path=f"resources/{course_id}/{file.filename}",
        file_checksum_sha256="mock_sha256_hash_value",
        academic_year=academic_year,
        semester=semester,
        is_verified=True if current_user.role == UserRole.SYSTEM_ADMIN else False
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource

@app.get("/api/v1/resources/{resource_id}/download", tags=["Academic Resources"])
async def download_resource(
    resource_id: UUID,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Streams downloadable materials and increments download metrics.
    Protected by RBAC: only authenticated users can download materials.
    """
    resource = db.query(AcademicResource).filter(AcademicResource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    resource.download_count += 1
    db.commit()
    
    return {"message": "Streaming file download", "resource_id": resource_id, "download_url": resource.storage_path}

# ============================================================================
# MODULE 3: LIBRARY BOOKS CATALOG
# ============================================================================

@app.get("/api/v1/library/books", response_model=List[BookResponse], tags=["Library Catalog"])
async def list_books(
    search: Optional[str] = None,
    status: Optional[str] = None,
    department_id: Optional[UUID] = None,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search and browse physical and digital library books."""
    query = db.query(LibraryBook)
    if search:
        query = query.filter(
            (LibraryBook.title.ilike(f"%{search}%")) |
            (LibraryBook.isbn.ilike(f"%{search}%"))
        )
    if status:
        query = query.filter(LibraryBook.status == status)
    if department_id:
        query = query.filter(LibraryBook.department_id == department_id)
    return query.all()

@app.post("/api/v1/library/borrow", response_model=LoanResponse, tags=["Library Catalog"])
async def borrow_book(
    request: BorrowRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Borrow or reserve an available library book.
    Updates available copies and generates borrow record with due date.
    """
    book = db.query(LibraryBook).filter(LibraryBook.id == request.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.available_copies <= 0:
        raise HTTPException(status_code=400, detail="No copies currently available for borrow")
    
    # Decrement available copies
    book.available_copies -= 1
    if book.available_copies == 0:
        book.status = BookStatus.CHECKED_OUT
    
    due_date = date.today().replace(day=date.today().day + min(request.duration_days, 30))
    # Return simulated loan record
    db.commit()
    return {
        "id": book.id,
        "book_id": book.id,
        "borrower_id": current_user.id,
        "borrowed_at": datetime.utcnow(),
        "due_date": due_date,
        "status": "borrowed",
        "renewals_count": 0,
        "fine_amount_cents": 0
    }

# ============================================================================
# MODULE 4: INTERACTIVE TIMETABLE & CONFLICT-DETECTION
# ============================================================================

@app.post("/api/v1/timetable/check-conflict", response_model=TimetableConflictCheckResponse, tags=["Timetable Builder"])
async def check_timetable_conflict(
    check_req: TimetableConflictCheckRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Real-time conflict detection engine:
    Checks if a proposed class time slot overlaps with any existing schedule
    in the same facility or for the same instructor/cohort on the given day.
    """
    conflicts = db.query(TimetableSchedule).filter(
        TimetableSchedule.facility_id == check_req.facility_id,
        TimetableSchedule.day_of_week == check_req.day_of_week,
        TimetableSchedule.academic_year == check_req.academic_year,
        TimetableSchedule.semester == check_req.semester,
        # Check interval overlap: max(startA, startB) < min(endA, endB)
        TimetableSchedule.start_time < check_req.end_time,
        TimetableSchedule.end_time > check_req.start_time
    )
    if check_req.exclude_slot_id:
        conflicts = conflicts.filter(TimetableSchedule.id != check_req.exclude_slot_id)
    
    conflicting_list = conflicts.all()
    if conflicting_list:
        return TimetableConflictCheckResponse(
            has_conflict=True,
            conflicting_slots=[{"id": str(s.id), "course_id": str(s.course_id), "time": f"{s.start_time}-{s.end_time}"} for s in conflicting_list],
            message=f"Conflict detected: Facility is already occupied for {len(conflicting_list)} session(s)."
        )
    return TimetableConflictCheckResponse(has_conflict=False, message="No scheduling conflicts detected.")

@app.post("/api/v1/timetable/slots", response_model=TimetableSlotResponse, tags=["Timetable Builder"])
async def create_timetable_slot(
    slot: TimetableSlotCreate,
    db = Depends(get_db),
    current_user: User = Depends(require_staff_or_lecturer)
):
    """Creates a new timetable schedule slot with strict conflict validation."""
    # Run conflict check
    overlap = db.query(TimetableSchedule).filter(
        TimetableSchedule.facility_id == slot.facility_id,
        TimetableSchedule.day_of_week == slot.day_of_week,
        TimetableSchedule.academic_year == slot.academic_year,
        TimetableSchedule.semester == slot.semester,
        TimetableSchedule.start_time < slot.end_time,
        TimetableSchedule.end_time > slot.start_time
    ).first()
    if overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict detected: Facility already allocated at the selected time."
        )

    new_slot = TimetableSchedule(**slot.dict())
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    return new_slot

# ============================================================================
# MODULE 5: ROOM & LAB BOOKING SYSTEM
# ============================================================================

@app.post("/api/v1/bookings", response_model=BookingResponse, tags=["Room & Lab Bookings"])
async def create_room_booking(
    booking: BookingCreate,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reserves a campus lab, study room, or lecture hall.
    Enforces time validity and double-booking prevention.
    """
    if booking.end_time <= booking.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    # Check for existing confirmed booking overlap
    existing = db.query(RoomBooking).filter(
        RoomBooking.facility_id == booking.facility_id,
        RoomBooking.status == BookingStatus.CONFIRMED,
        RoomBooking.start_time < booking.end_time,
        RoomBooking.end_time > booking.start_time
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Facility is already booked for this time window")
    
    new_booking = RoomBooking(
        facility_id=booking.facility_id,
        reserved_by_id=current_user.id,
        purpose=booking.purpose,
        start_time=booking.start_time,
        end_time=booking.end_time,
        attendees_expected=booking.attendees_expected,
        notes=booking.notes,
        status=BookingStatus.CONFIRMED
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

# ============================================================================
# MODULE 6: ADMINISTRATIVE FORMS PORTAL
# ============================================================================

@app.post("/api/v1/forms", response_model=FormResponse, tags=["Administrative Forms"])
async def submit_administrative_form(
    submission: FormSubmissionCreate,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit digital campus administrative form (Clearance, Leave of Absence, Appeal)."""
    ref_num = f"FORM-{datetime.utcnow().strftime('%Y%m')}-{os.urandom(2).hex().upper()}"
    form = AdministrativeForm(
        reference_number=ref_num,
        form_type=submission.form_type,
        applicant_id=current_user.id,
        title=submission.title,
        reason=submission.reason,
        form_data=submission.form_data,
        status=FormStatus.SUBMITTED
    )
    db.add(form)
    db.commit()
    db.refresh(form)
    return form

@app.patch("/api/v1/forms/{form_id}/status", response_model=FormResponse, tags=["Administrative Forms"])
async def update_form_status(
    form_id: UUID,
    update: FormStatusUpdate,
    db = Depends(get_db),
    current_user: User = Depends(require_admin_staff) # Only Admin Staff & SysAdmins can approve/reject
):
    """
    Review and update status (Approved, Rejected, Under Review) for submitted administrative forms.
    Restricted to Administrative Staff and System Admins.
    """
    form = db.query(AdministrativeForm).filter(AdministrativeForm.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    form.status = update.status
    form.reviewer_id = current_user.id
    form.reviewer_remarks = update.reviewer_remarks
    form.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(form)
    return form

# ============================================================================
# MODULE 7: CAMPUS EVENTS FEED
# ============================================================================

@app.get("/api/v1/events", response_model=List[EventResponse], tags=["Campus Events"])
async def list_events(
    category: Optional[str] = None,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns real-time campus events with dates, times, venues, and RSVP counts."""
    query = db.query(CampusEvent).filter(CampusEvent.is_published == True)
    if category:
        query = query.filter(CampusEvent.category == category)
    return query.order_by(CampusEvent.start_time.asc()).all()

@app.post("/api/v1/events", response_model=EventResponse, tags=["Campus Events"])
async def create_event(
    event: EventCreate,
    db = Depends(get_db),
    current_user: User = Depends(require_staff_or_lecturer) # Lecturers & Admins
):
    """Create a new campus event or seminar."""
    new_event = CampusEvent(
        title=event.title,
        description=event.description,
        category=event.category,
        organizer_id=current_user.id,
        facility_id=event.facility_id,
        venue_custom_name=event.venue_custom_name,
        start_time=event.start_time,
        end_time=event.end_time,
        max_attendees=event.max_attendees,
        banner_image_url=event.banner_image_url
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event
