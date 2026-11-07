import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, BigInteger, Boolean, Text, ForeignKey,
    DateTime, Time, Date, Enum, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class UserRole(str, Enum):
    STUDENT = "student"
    LECTURER = "lecturer"
    ADMIN_STAFF = "admin_staff"
    SYSTEM_ADMIN = "system_admin"

class ResourceCategory(str, Enum):
    LECTURE_NOTES = "lecture_notes"
    PAST_EXAM_PAPER = "past_exam_paper"
    SYLLABUS = "syllabus"
    LAB_MANUAL = "lab_manual"
    ASSIGNMENT_BRIEF = "assignment_brief"

class BookStatus(str, Enum):
    AVAILABLE = "available"
    CHECKED_OUT = "checked_out"
    RESERVED = "reserved"
    UNDER_MAINTENANCE = "under_maintenance"

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class FormStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sso_sub_id = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(160), nullable=False)
    role = Column(String(32), default="student", nullable=False, index=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    id_number = Column(String(32), unique=True, nullable=False)
    avatar_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    metadata_json = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    department = relationship("Department", back_populates="users")
    resources = relationship("AcademicResource", back_populates="uploader")
    bookings = relationship("RoomBooking", back_populates="reserved_by")
    forms = relationship("AdministrativeForm", back_populates="applicant")

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(16), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    head_of_department = Column(String(128))
    building_location = Column(String(128))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    users = relationship("User", back_populates="department")
    courses = relationship("Course", back_populates="department")

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(16), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    coordinator_lecturer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    credits = Column(Integer, nullable=False)
    level = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    department = relationship("Department", back_populates="courses")
    resources = relationship("AcademicResource", back_populates="course")
    timetable_slots = relationship("TimetableSchedule", back_populates="course")

class AcademicResource(Base):
    __tablename__ = "academic_resources"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    category = Column(String(32), nullable=False, index=True)
    file_format = Column(String(16), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    storage_path = Column(Text, nullable=False)
    file_checksum_sha256 = Column(String(64), nullable=False)
    academic_year = Column(String(16), nullable=False)
    semester = Column(String(16), nullable=False)
    download_count = Column(Integer, default=0, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    course = relationship("Course", back_populates="resources")
    uploader = relationship("User", back_populates="resources")

class LibraryBook(Base):
    __tablename__ = "library_books"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    isbn = Column(String(20), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    authors = Column(ARRAY(String), nullable=False)
    publisher = Column(String(160), nullable=True)
    publication_year = Column(Integer, nullable=True)
    edition = Column(String(32), nullable=True)
    format = Column(String(32), default="physical", nullable=False)
    call_number = Column(String(64), nullable=True)
    shelf_location = Column(String(64), nullable=True)
    total_copies = Column(Integer, default=1, nullable=False)
    available_copies = Column(Integer, default=1, nullable=False)
    status = Column(String(32), default="available", nullable=False, index=True)
    digital_access_url = Column(Text, nullable=True)
    cover_image_url = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class CampusFacility(Base):
    __tablename__ = "campus_facilities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(32), unique=True, nullable=False)
    name = Column(String(160), nullable=False)
    facility_type = Column(String(64), nullable=False)
    building = Column(String(128), nullable=False)
    floor = Column(String(16), nullable=False)
    room_number = Column(String(32), nullable=False)
    capacity = Column(Integer, nullable=False)
    has_projector = Column(Boolean, default=True)
    has_computers = Column(Boolean, default=False)
    computer_count = Column(Integer, default=0)
    has_video_conferencing = Column(Boolean, default=False)
    is_operational = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class RoomBooking(Base):
    __tablename__ = "room_bookings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    facility_id = Column(UUID(as_uuid=True), ForeignKey("campus_facilities.id", ondelete="CASCADE"), nullable=False, index=True)
    reserved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    purpose = Column(String(255), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    attendees_expected = Column(Integer, nullable=False)
    status = Column(String(32), default="confirmed", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    facility = relationship("CampusFacility")
    reserved_by = relationship("User", back_populates="bookings")

class TimetableSchedule(Base):
    __tablename__ = "timetable_schedules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    facility_id = Column(UUID(as_uuid=True), ForeignKey("campus_facilities.id", ondelete="CASCADE"), nullable=False)
    instructor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    day_of_week = Column(String(16), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    class_type = Column(String(32), default="lecture", nullable=False)
    group_code = Column(String(16), default="MAIN", nullable=False)
    academic_year = Column(String(16), nullable=False)
    semester = Column(String(16), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    course = relationship("Course", back_populates="timetable_slots")
    facility = relationship("CampusFacility")
    instructor = relationship("User")

class AdministrativeForm(Base):
    __tablename__ = "administrative_forms"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference_number = Column(String(32), unique=True, nullable=False)
    form_type = Column(String(64), nullable=False, index=True)
    applicant_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    form_data = Column(JSONB, default=dict, nullable=False)
    status = Column(String(32), default="submitted", nullable=False, index=True)
    reviewer_remarks = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    applicant = relationship("User", back_populates="forms")

class CampusEvent(Base):
    __tablename__ = "campus_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), nullable=False, index=True)
    organizer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    facility_id = Column(UUID(as_uuid=True), ForeignKey("campus_facilities.id", ondelete="SET NULL"), nullable=True)
    venue_custom_name = Column(String(160), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False)
    max_attendees = Column(Integer, nullable=True)
    current_rsvps = Column(Integer, default=0, nullable=False)
    is_published = Column(Boolean, default=True, nullable=False)
    banner_image_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
