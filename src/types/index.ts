export type UserRole = 'student' | 'lecturer' | 'admin_staff' | 'system_admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  idNumber: string; // Matriculation or Staff ID
  department: string;
  faculty: string;
  avatarUrl: string;
  academicYear?: string;
  semester?: string;
}

export type ResourceCategory = 
  | 'lecture_notes' 
  | 'past_exam_paper' 
  | 'syllabus' 
  | 'lab_manual' 
  | 'assignment_brief';

export interface AcademicResource {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  department: string;
  category: ResourceCategory;
  fileType: 'pdf' | 'docx' | 'pptx' | 'zip' | 'ipynb';
  fileSizeBytes: number;
  academicYear: string;
  semester: 'Semester 1' | 'Semester 2' | 'Summer Term';
  downloadCount: number;
  uploadedBy: string;
  uploadedAt: string;
  isVerified: boolean;
  downloadUrl: string;
  description?: string;
}

export type BookStatus = 'available' | 'checked_out' | 'reserved' | 'under_maintenance';
export type BookFormat = 'physical' | 'digital_pdf' | 'digital_epub' | 'audiobook';

export interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  publisher: string;
  publicationYear: number;
  department: string;
  format: BookFormat;
  callNumber: string;
  shelfLocation: string;
  totalCopies: number;
  availableCopies: number;
  status: BookStatus;
  coverImageUrl: string;
  summary: string;
  digitalAccessUrl?: string;
}

export interface BookLoan {
  id: string;
  bookId: string;
  bookTitle: string;
  borrowerId: string;
  borrowedAt: string;
  dueDate: string;
  status: 'borrowed' | 'returned' | 'overdue' | 'reserved';
  renewalsCount: number;
}

export interface TimetableSlot {
  id: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string; // '09:00'
  endTime: string;   // '11:00'
  room: string;
  classType: 'Lecture' | 'Lab' | 'Tutorial' | 'Seminar';
}

export interface CampusFacility {
  id: string;
  code: string;
  name: string;
  facilityType: 'lecture_hall' | 'computer_lab' | 'study_pod' | 'seminar_room' | 'specialized_lab';
  building: string;
  floor: string;
  roomNumber: string;
  capacity: number;
  hasProjector: boolean;
  hasComputers: boolean;
  computerCount?: number;
  hasVideoConferencing: boolean;
  amenities: string[];
  imageUrl: string;
}

export interface RoomBooking {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityCode: string;
  reservedById: string;
  reservedByName: string;
  userRole: UserRole;
  purpose: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // '09:00'
  endTime: string;   // '11:00'
  attendeesExpected: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export type FormType = 
  | 'clearance' 
  | 'leave_of_absence' 
  | 'grade_appeal' 
  | 'transcript_request' 
  | 'course_add_drop';

export type FormStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';

export interface AdministrativeForm {
  id: string;
  referenceNumber: string;
  formType: FormType;
  title: string;
  applicantId: string;
  applicantName: string;
  applicantIdNumber: string;
  applicantDepartment: string;
  reason: string;
  status: FormStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewerName?: string;
  reviewerRemarks?: string;
  details: Record<string, string | number | boolean>;
  attachments?: string[];
}

export type EventCategory = 
  | 'academic_seminar' 
  | 'hackathon' 
  | 'career_fair' 
  | 'guest_lecture' 
  | 'student_society' 
  | 'workshop';

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  organizerName: string;
  organizerRole: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  maxAttendees?: number;
  currentRsvps: number;
  bannerUrl: string;
  tags: string[];
  isRsvpd?: boolean;
}
