import React, { useState } from 'react';
import { Header } from './components/Header';
import { Navigation, NavTabId } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { AcademicRepositoryView } from './components/AcademicRepositoryView';
import { LibraryCatalogView } from './components/LibraryCatalogView';
import { TimetableBuilderView } from './components/TimetableBuilderView';
import { RoomBookingView } from './components/RoomBookingView';
import { AdministrativeFormsView } from './components/AdministrativeFormsView';
import { CampusEventsView } from './components/CampusEventsView';
import { ArchitectureView } from './components/ArchitectureView';

import {
  UserProfile,
  UserRole,
  AcademicResource,
  LibraryBook,
  BookLoan,
  TimetableSlot,
  CampusFacility,
  RoomBooking,
  AdministrativeForm,
  CampusEvent,
  FormStatus
} from './types';

import {
  INSTITUTIONAL_USERS,
  INITIAL_RESOURCES,
  INITIAL_BOOKS,
  INITIAL_BOOK_LOANS,
  INITIAL_TIMETABLE_SLOTS,
  INITIAL_FACILITIES,
  INITIAL_BOOKINGS,
  INITIAL_ADMIN_FORMS,
  INITIAL_EVENTS
} from './data/seedData';

import { DownloadCloud, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Current active identity (SSO simulation)
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const currentUser: UserProfile = INSTITUTIONAL_USERS[currentRole];

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');

  // Core application states
  const [resources, setResources] = useState<AcademicResource[]>(INITIAL_RESOURCES);
  const [books, setBooks] = useState<LibraryBook[]>(INITIAL_BOOKS);
  const [loans, setLoans] = useState<BookLoan[]>(INITIAL_BOOK_LOANS);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(INITIAL_TIMETABLE_SLOTS);
  const [facilities, setFacilities] = useState<CampusFacility[]>(INITIAL_FACILITIES);
  const [bookings, setBookings] = useState<RoomBooking[]>(INITIAL_BOOKINGS);
  const [forms, setForms] = useState<AdministrativeForm[]>(INITIAL_ADMIN_FORMS);
  const [events, setEvents] = useState<CampusEvent[]>(INITIAL_EVENTS);

  // Download simulation toast
  const [downloadToast, setDownloadToast] = useState<{ title: string; progress: number } | null>(null);

  // 1. Academic Resources handlers
  const handleUploadResource = (newRes: AcademicResource) => {
    setResources(prev => [newRes, ...prev]);
  };

  const handleDownloadResource = (res: AcademicResource) => {
    // Increment download counter
    setResources(prev => prev.map(r => r.id === res.id ? { ...r, downloadCount: r.downloadCount + 1 } : r));
    
    // Show download simulation toast
    setDownloadToast({ title: res.title, progress: 15 });
    setTimeout(() => setDownloadToast({ title: res.title, progress: 65 }), 300);
    setTimeout(() => setDownloadToast({ title: res.title, progress: 100 }), 700);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  // 2. Library handlers
  const handleBorrowBook = (bookId: string, durationDays: number) => {
    const book = books.find(b => b.id === bookId);
    if (!book || book.availableCopies <= 0) return;

    // Decrement available copies
    setBooks(prev => prev.map(b => {
      if (b.id === bookId) {
        const remaining = b.availableCopies - 1;
        return {
          ...b,
          availableCopies: remaining,
          status: remaining === 0 ? 'checked_out' : b.status
        };
      }
      return b;
    }));

    // Calculate due date
    const today = new Date();
    today.setDate(today.getDate() + durationDays);
    const dueDateStr = today.toISOString().split('T')[0];

    const newLoan: BookLoan = {
      id: `ln-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      borrowerId: currentUser.id,
      borrowedAt: new Date().toISOString().split('T')[0],
      dueDate: dueDateStr,
      status: 'borrowed',
      renewalsCount: 0
    };

    setLoans(prev => [newLoan, ...prev]);
  };

  const handleReturnBook = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    // Remove loan
    setLoans(prev => prev.filter(l => l.id !== loanId));

    // Increment available copies on book
    setBooks(prev => prev.map(b => {
      if (b.id === loan.bookId) {
        return {
          ...b,
          availableCopies: b.availableCopies + 1,
          status: 'available'
        };
      }
      return b;
    }));
  };

  // 3. Timetable handlers
  const handleAddSlot = (slot: TimetableSlot) => {
    setTimetable(prev => [...prev, slot]);
  };

  const handleRemoveSlot = (id: string) => {
    setTimetable(prev => prev.filter(s => s.id !== id));
  };

  const handleResetTimetable = () => {
    setTimetable(INITIAL_TIMETABLE_SLOTS);
  };

  // 4. Room Bookings handlers
  const handleAddBooking = (newBooking: RoomBooking) => {
    setBookings(prev => [newBooking, ...prev]);
  };

  const handleCancelBooking = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  // 5. Administrative Forms handlers
  const handleSubmitForm = (newForm: AdministrativeForm) => {
    setForms(prev => [newForm, ...prev]);
  };

  const handleUpdateFormStatus = (formId: string, status: FormStatus, remarks: string) => {
    setForms(prev => prev.map(f => {
      if (f.id === formId) {
        return {
          ...f,
          status,
          reviewerRemarks: remarks,
          reviewerName: `${currentUser.fullName} (${currentUser.department})`,
          reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return f;
    }));
  };

  // 6. Campus Events handlers
  const handleToggleRsvp = (eventId: string) => {
    setEvents(prev => prev.map(evt => {
      if (evt.id === eventId) {
        const nextRsvpd = !evt.isRsvpd;
        return {
          ...evt,
          isRsvpd: nextRsvpd,
          currentRsvps: nextRsvpd ? evt.currentRsvps + 1 : Math.max(0, evt.currentRsvps - 1)
        };
      }
      return evt;
    }));
  };

  const handleAddEvent = (newEvent: CampusEvent) => {
    setEvents(prev => [newEvent, ...prev]);
  };

  const pendingFormsCount = forms.filter(f => f.status === 'submitted' || f.status === 'under_review').length;

  return (
    /* Primary (60%): Crisp Off-White #F9FAFB, Text / Neutrals: Charcoal #111827 */
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex flex-col font-sans selection:bg-amber-400 selection:text-[#1e1b4b]">
      {/* Top Header Navbar (Brand 30%: Indigo Navy #312E81) */}
      <Header
        currentUser={currentUser}
        onSwitchUser={setCurrentRole}
        activeTab={activeTab}
      />

      {/* Module Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        badgeCounts={{
          resources: resources.length,
          books: books.length,
          pendingForms: pendingFormsCount,
          events: events.length
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            resources={resources}
            books={books}
            timetable={timetable}
            forms={forms}
            events={events}
            onNavigate={setActiveTab}
            onQuickDownload={handleDownloadResource}
          />
        )}

        {activeTab === 'resources' && (
          <AcademicRepositoryView
            currentUser={currentUser}
            resources={resources}
            onUploadResource={handleUploadResource}
            onDownloadResource={handleDownloadResource}
          />
        )}

        {activeTab === 'library' && (
          <LibraryCatalogView
            currentUser={currentUser}
            books={books}
            loans={loans}
            onBorrowBook={handleBorrowBook}
            onReturnBook={handleReturnBook}
          />
        )}

        {activeTab === 'timetable' && (
          <TimetableBuilderView
            currentUser={currentUser}
            timetable={timetable}
            onAddSlot={handleAddSlot}
            onRemoveSlot={handleRemoveSlot}
            onResetTimetable={handleResetTimetable}
          />
        )}

        {activeTab === 'bookings' && (
          <RoomBookingView
            currentUser={currentUser}
            facilities={facilities}
            bookings={bookings}
            onAddBooking={handleAddBooking}
            onCancelBooking={handleCancelBooking}
          />
        )}

        {activeTab === 'forms' && (
          <AdministrativeFormsView
            currentUser={currentUser}
            forms={forms}
            onSubmitForm={handleSubmitForm}
            onUpdateFormStatus={handleUpdateFormStatus}
          />
        )}

        {activeTab === 'events' && (
          <CampusEventsView
            currentUser={currentUser}
            events={events}
            onToggleRsvp={handleToggleRsvp}
            onAddEvent={handleAddEvent}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView />
        )}
      </main>

      {/* Download Simulation Toast */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border-2 border-emerald-500 shadow-2xl rounded-2xl p-4 max-w-sm w-full animate-in slide-in-from-bottom-5 text-slate-900">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-emerald-100 text-[#10B981] rounded-xl shrink-0">
              <DownloadCloud className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 text-xs">
              <p className="font-extrabold text-[#111827] line-clamp-1">{downloadToast.title}</p>
              <p className="text-slate-500 mt-0.5">
                {downloadToast.progress === 100 ? 'Download complete!' : 'Retrieving material stream from S3...'}
              </p>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden border border-slate-200">
                <div 
                  className="bg-[#10B981] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${downloadToast.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-[#312E81]">OmniCampus</span>
            <span>&bull;</span>
            <span className="text-slate-600">Institutional IT & Cyberinfrastructure Registry</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] font-medium text-slate-500">
            <span>FastAPI v0.110 REST Endpoints</span>
            <span>&bull;</span>
            <span>PostgreSQL 16 B-Tree & Exclusion Engine</span>
            <span>&bull;</span>
            <span>OAuth2 / OIDC Institutional SSO</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
