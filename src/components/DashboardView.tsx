import React from 'react';
import { 
  GraduationCap, 
  FolderDown, 
  BookOpen, 
  CalendarClock, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  MapPin, 
  AlertTriangle,
  Download,
  Shield,
  FileCheck2
} from 'lucide-react';
import { UserProfile, AcademicResource, LibraryBook, TimetableSlot, AdministrativeForm, CampusEvent } from '../types';
import { NavTabId } from './Navigation';
import { detectTimetableConflicts } from '../utils/timetableConflict';

interface DashboardViewProps {
  currentUser: UserProfile;
  resources: AcademicResource[];
  books: LibraryBook[];
  timetable: TimetableSlot[];
  forms: AdministrativeForm[];
  events: CampusEvent[];
  onNavigate: (tab: NavTabId) => void;
  onQuickDownload: (res: AcademicResource) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  resources,
  books,
  timetable,
  forms,
  events,
  onNavigate,
  onQuickDownload
}) => {
  const conflictResult = detectTimetableConflicts(timetable);
  const myPendingForms = forms.filter(f => 
    currentUser.role === 'admin_staff' || currentUser.role === 'system_admin' 
      ? f.status === 'submitted' || f.status === 'under_review'
      : f.applicantId === currentUser.id
  );

  const availableBooksCount = books.filter(b => b.availableCopies > 0).length;
  const nextClasses = timetable.slice(0, 3);
  const recentResources = resources.slice(0, 3);
  const upcomingEvents = events.slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner (Brand 30%: Indigo Navy #312E81 with Sunset Amber #F59E0B Highlights) */}
      <div className="bg-gradient-to-r from-[#1e1b4b] via-[#312E81] to-[#1e3a8a] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-[#1e1b4b] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                Academic Session 2025/2026 &bull; Semester 1
              </span>
              <span className="text-indigo-200 text-xs hidden sm:inline">&bull; Week 8 Schedule Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {currentUser.fullName}
            </h1>
            <p className="text-sm text-indigo-100 max-w-2xl leading-relaxed">
              Institutional portal for <span className="text-amber-300 font-semibold">{currentUser.department}</span>. 
              Access verified course materials, check conflict-free timetables, borrow books, and track administrative filings.
            </p>
          </div>

          {/* Quick role-specific badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[240px] shrink-0">
            <div className="flex items-center space-x-3 mb-2">
              <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-11 h-11 rounded-full object-cover ring-2 ring-amber-400 shadow" />
              <div>
                <p className="text-[10px] text-amber-300 uppercase tracking-wider font-extrabold">Active Identity</p>
                <p className="text-sm font-bold text-white">{currentUser.fullName}</p>
                <p className="text-xs text-indigo-200 font-mono">{currentUser.idNumber}</p>
              </div>
            </div>
            <div className="text-[11px] text-indigo-200 border-t border-white/15 pt-2 flex items-center justify-between">
              <span>Authentication:</span>
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> SSO Verified
              </span>
            </div>
          </div>
        </div>

        {/* Timetable Conflict Warning Banner */}
        {conflictResult.hasConflict && (
          <div className="mt-6 bg-[#FEF2F2] border-2 border-[#EF4444] rounded-xl p-4 flex items-start gap-3 text-red-900 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-bold text-red-800 text-sm">Schedule Conflict Detected in Timetable</p>
              <p className="text-red-700 mt-0.5 leading-relaxed">{conflictResult.reason}</p>
            </div>
            <button
              onClick={() => onNavigate('timetable')}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg transition shrink-0"
            >
              Resolve Conflict
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Grid (Crisp White Cards #ffffff on Off-White #f8fafc) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('resources')}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 sm:p-5 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Academic Repository</span>
            <div className="p-2.5 bg-indigo-50 text-[#312E81] rounded-xl group-hover:bg-[#312E81] group-hover:text-white transition">
              <FolderDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#111827]">{resources.length}</div>
            <p className="text-xs text-slate-500 mt-0.5">Verified notes & past exams</p>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('library')}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 sm:p-5 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Library Catalog</span>
            <div className="p-2.5 bg-emerald-50 text-[#10B981] rounded-xl group-hover:bg-[#10B981] group-hover:text-white transition">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#111827]">{availableBooksCount} / {books.length}</div>
            <p className="text-xs text-slate-500 mt-0.5">Available titles in stack</p>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('timetable')}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-300 rounded-2xl p-4 sm:p-5 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Weekly Classes</span>
            <div className="p-2.5 bg-amber-50 text-[#F59E0B] rounded-xl group-hover:bg-[#F59E0B] group-hover:text-white transition">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#111827]">{timetable.length} Slots</div>
            <p className="text-xs text-slate-500 mt-0.5">Conflict engine active</p>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('forms')}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 sm:p-5 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Administrative Forms</span>
            <div className="p-2.5 bg-indigo-50 text-[#312E81] rounded-xl group-hover:bg-[#312E81] group-hover:text-white transition">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#111827]">{myPendingForms.length} Active</div>
            <p className="text-xs text-slate-500 mt-0.5">Clearance & appeal records</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Classes & Quick Repository Downloads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Academic Schedule & Resources */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Schedule Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-[#312E81] rounded-lg">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <h2 className="font-extrabold text-base text-[#111827]">Upcoming Academic Timetable</h2>
              </div>
              <button 
                onClick={() => onNavigate('timetable')}
                className="text-xs text-[#312E81] hover:text-indigo-800 font-bold flex items-center gap-1"
              >
                Full Weekly Grid <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {nextClasses.map((slot) => (
                <div 
                  key={slot.id}
                  className="bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="flex items-start space-x-3">
                    <span className="px-2.5 py-1 bg-[#312E81] text-white rounded-lg text-xs font-mono font-bold shadow-xs">
                      {slot.courseCode}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-[#111827]">{slot.courseName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Instructor: {slot.instructor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600 shrink-0">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#312E81]" />
                      <span>{slot.dayOfWeek}, {slot.startTime} - {slot.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>{slot.room}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Academic Repository Materials with Solid Emerald #10B981 Download Buttons */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-[#10B981] rounded-lg">
                  <FolderDown className="w-5 h-5" />
                </div>
                <h2 className="font-extrabold text-base text-[#111827]">Featured Course Notes & Past Papers</h2>
              </div>
              <button 
                onClick={() => onNavigate('resources')}
                className="text-xs text-[#10B981] hover:text-emerald-700 font-bold flex items-center gap-1"
              >
                Browse All Materials <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentResources.map((res) => {
                const isExam = res.category === 'past_exam_paper';
                return (
                  <div 
                    key={res.id}
                    className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-4 flex items-center justify-between gap-4 transition"
                  >
                    <div className="flex items-start space-x-3 overflow-hidden">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                        isExam ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                      }`}>
                        {isExam ? 'Past Exam' : 'Lecture Note'}
                      </span>
                      <div className="truncate">
                        <h4 className="text-sm font-bold text-[#111827] truncate">{res.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {res.courseCode} &bull; {res.semester} {res.academicYear} &bull; {(res.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>

                    {/* Rule: Solid Emerald/Green (#10B981) download button */}
                    <button
                      onClick={() => onQuickDownload(res)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold transition shadow-xs shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Campus Events & Specs Fast Link */}
        <div className="space-y-6">
          {/* Campus Events Feed Preview with Sunset Amber #F59E0B Badges */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-50 text-[#F59E0B] rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="font-extrabold text-base text-[#111827]">Live Campus Feed</h2>
              </div>
              <button 
                onClick={() => onNavigate('events')}
                className="text-xs text-[#F59E0B] hover:text-amber-700 font-bold flex items-center gap-1"
              >
                View Feed <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {upcomingEvents.map((evt) => (
                <div key={evt.id} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <img src={evt.bannerUrl} alt={evt.title} className="w-full h-24 object-cover" />
                  <div className="p-3.5 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 inline-block">
                      {evt.category.replace('_', ' ')}
                    </span>
                    <h4 className="text-xs font-bold text-[#111827] mt-1 line-clamp-1">{evt.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#312E81]" /> {evt.date} &bull; {evt.startTime}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#10B981]" /> {evt.venue}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Architecture & Specs Fast Link */}
          <div className="bg-[#312E81] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-indigo-900">
            <div className="flex items-center gap-2 text-amber-300 mb-2">
              <span className="p-1.5 bg-white/10 rounded-lg">
                <GraduationCap className="w-4 h-4 text-amber-300" />
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider">FastAPI & PostgreSQL</span>
            </div>
            <h3 className="text-sm font-bold text-white">Full Backend & DDL Specifications</h3>
            <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
              Explore the production PostgreSQL DDL schema, Pydantic models, and OpenAPI Swagger routes.
            </p>
            <button
              onClick={() => onNavigate('architecture')}
              className="mt-3.5 w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#1e1b4b] font-extrabold px-3.5 py-2.5 rounded-xl text-xs transition shadow-md shadow-amber-500/20"
            >
              <span>Explore Schema & API Specs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
