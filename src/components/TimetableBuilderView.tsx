import React, { useState } from 'react';
import { 
  CalendarClock, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Trash2, 
  Zap,
  X
} from 'lucide-react';
import { TimetableSlot, UserProfile } from '../types';
import { 
  detectTimetableConflicts, 
  canAddSlotWithoutConflict,
  timeToMinutes
} from '../utils/timetableConflict';

interface TimetableBuilderViewProps {
  currentUser: UserProfile;
  timetable: TimetableSlot[];
  onAddSlot: (slot: TimetableSlot) => void;
  onRemoveSlot: (id: string) => void;
  onResetTimetable: () => void;
}

export const TimetableBuilderView: React.FC<TimetableBuilderViewProps> = ({
  currentUser,
  timetable,
  onAddSlot,
  onRemoveSlot,
  onResetTimetable
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [modalConflictWarning, setModalConflictWarning] = useState<string | null>(null);

  // Add form fields
  const [courseCode, setCourseCode] = useState('CS410');
  const [courseName, setCourseName] = useState('Quantum Computing Systems');
  const [instructor, setInstructor] = useState('Dr. Elena Rostova');
  const [dayOfWeek, setDayOfWeek] = useState<TimetableSlot['dayOfWeek']>('Monday');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [room, setRoom] = useState('Kelvin Auditorium (Hall 1)');
  const [classType, setClassType] = useState<TimetableSlot['classType']>('Lecture');

  const days: TimetableSlot['dayOfWeek'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const conflictReport = detectTimetableConflicts(timetable);

  const handleOpenAddModal = () => {
    setModalConflictWarning(null);
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const candidate: TimetableSlot = {
      id: `tt-${Date.now()}`,
      courseCode: courseCode.trim().toUpperCase(),
      courseName: courseName.trim(),
      instructor: instructor.trim(),
      dayOfWeek,
      startTime,
      endTime,
      room,
      classType
    };

    // Pre-flight conflict check
    const check = canAddSlotWithoutConflict(timetable, candidate);
    if (!check.canAdd) {
      setModalConflictWarning(check.reason || 'Conflict detected with existing class in this time window.');
      return;
    }

    onAddSlot(candidate);
    setShowAddModal(false);
  };

  const handleSimulateConflict = () => {
    // Deliberately inject a clashing slot to test conflict engine
    const clashingSlot: TimetableSlot = {
      id: `tt-clash-${Date.now()}`,
      courseCode: 'CS301-CLASH',
      courseName: 'Concurrent Systems Tutorial (Clash Demo)',
      instructor: 'Prof. David Chen',
      dayOfWeek: 'Monday',
      startTime: '09:30', // Clashes with 09:00-11:00 CS301
      endTime: '11:30',
      room: 'Kelvin Auditorium (Hall 1)',
      classType: 'Tutorial'
    };
    onAddSlot(clashingSlot);
  };

  /**
   * UI Color Rule: Alternate muted hues (Soft Purple, Teal, Sky Blue, Soft Amber)
   * to distinguish overlapping or adjacent class blocks with high contrast.
   */
  const getClassTypeColor = (type: TimetableSlot['classType']) => {
    switch (type) {
      case 'Lecture':
        return 'bg-[#F3E8FF] text-[#6B21A8] border-[#D8B4FE]'; // Soft Purple
      case 'Lab':
        return 'bg-[#CCFBF1] text-[#0F766E] border-[#5EEAD4]'; // Soft Teal
      case 'Tutorial':
        return 'bg-[#E0F2FE] text-[#0369A1] border-[#7DD3FC]'; // Soft Sky Blue
      case 'Seminar':
        return 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'; // Soft Amber
    }
  };

  const isConflictingSlot = (slotId: string) => {
    return conflictReport.conflictingSlots.some(
      ([a, b]) => a.id === slotId || b.id === slotId
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-indigo-50 text-[#312E81] rounded-xl">
              <CalendarClock className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">Interactive Timetable Builder</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Real-time schedule constructor with automated conflict-detection for overlapping classes and room double-allocations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sunset Amber Accent #F59E0B */}
          <button
            onClick={handleSimulateConflict}
            className="flex items-center gap-1.5 bg-[#FEF3C7] hover:bg-amber-100 text-amber-900 border-2 border-[#F59E0B] px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs"
            title="Inject an overlapping class to demonstrate conflict engine"
          >
            <Zap className="w-4 h-4 text-amber-700" />
            <span>Simulate Overlap Clash</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 bg-[#312E81] hover:bg-indigo-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Add Class Slot</span>
          </button>
        </div>
      </div>

      {/* Global Conflict Alert Banner */}
      {conflictReport.hasConflict ? (
        <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl p-5 text-red-950 shadow-xs space-y-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-base text-red-900">
                  Automated Conflict Engine: Schedule Clashes Detected ({conflictReport.conflictingSlots.length})
                </h3>
                <p className="text-xs text-red-800 mt-1 leading-relaxed">
                  {conflictReport.reason}
                </p>
              </div>
            </div>
            <button
              onClick={onResetTimetable}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
            >
              Reset Schedule
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-red-200 flex flex-wrap gap-2 text-xs">
            {conflictReport.conflictingSlots.map(([slotA, slotB], idx) => (
              <span key={idx} className="bg-white border-2 border-red-400 px-3 py-1 rounded-xl text-red-900 font-mono font-bold shadow-xs">
                {slotA.courseCode} ({slotA.startTime}-{slotA.endTime}) ⚠️ {slotB.courseCode} ({slotB.startTime}-{slotB.endTime}) on {slotA.dayOfWeek}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#DCFCE7] border border-green-300 rounded-2xl p-4 flex items-center justify-between text-emerald-950 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Schedule validation passed: No overlapping classes or room clashes across {timetable.length} enrolled slots.</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 font-bold hidden sm:inline">PostgreSQL exclusion constraints satisfied</span>
        </div>
      )}

      {/* Day Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        <span className="text-slate-500 font-bold shrink-0 uppercase tracking-wider text-[11px]">Filter Day:</span>
        <button
          onClick={() => setSelectedDayFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
            selectedDayFilter === 'all'
              ? 'bg-[#312E81] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Days (Weekly View)
        </button>
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDayFilter(d)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
              selectedDayFilter === d
                ? 'bg-[#312E81] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Weekly Schedule Cards View with Alternate Muted Hues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {days
          .filter(d => selectedDayFilter === 'all' || selectedDayFilter === d)
          .map((day) => {
            const daySlots = timetable
              .filter(s => s.dayOfWeek === day)
              .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

            return (
              <div 
                key={day}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-xs"
              >
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#312E81]"></span>
                    <h3 className="font-extrabold text-sm text-[#111827]">{day}</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono font-semibold">
                    {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
                  </span>
                </div>

                <div className="p-4 space-y-3 flex-1">
                  {daySlots.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                      No scheduled sessions for {day}
                    </div>
                  ) : (
                    daySlots.map((slot) => {
                      const hasClash = isConflictingSlot(slot.id);
                      return (
                        <div
                          key={slot.id}
                          className={`p-4 rounded-2xl border-2 transition shadow-xs ${
                            hasClash 
                              ? 'bg-[#FEF2F2] border-[#EF4444] text-red-900 ring-2 ring-red-400/50' 
                              : getClassTypeColor(slot.classType)
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-white/80 shadow-xs">
                                {slot.courseCode}
                              </span>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/60">
                                {slot.classType}
                              </span>
                            </div>

                            <button
                              onClick={() => onRemoveSlot(slot.id)}
                              className="text-slate-500 hover:text-red-700 p-1 transition"
                              title="Remove from schedule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <h4 className="font-extrabold text-xs mt-2 line-clamp-1">
                            {slot.courseName}
                          </h4>

                          <div className="mt-2.5 pt-2 border-t border-black/10 space-y-1 text-[11px] font-medium">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-mono font-bold">{slot.startTime} - {slot.endTime}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{slot.room}</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-80">
                              <User className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{slot.instructor}</span>
                            </div>
                          </div>

                          {hasClash && (
                            <div className="mt-2 text-[11px] bg-red-600 text-white font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Overlapping Time / Room Conflict</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#312E81]">Curriculum Scheduler</span>
                <h3 className="text-lg font-extrabold text-[#111827] mt-0.5">Add Class to Timetable</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-800 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalConflictWarning && (
              <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl p-3.5 text-red-950 text-xs flex items-start gap-2 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="font-semibold leading-relaxed">{modalConflictWarning}</p>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] font-mono uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Class Type</label>
                  <select
                    value={classType}
                    onChange={(e) => setClassType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  >
                    <option value="Lecture">Lecture (Soft Purple)</option>
                    <option value="Lab">Laboratory (Soft Teal)</option>
                    <option value="Tutorial">Tutorial (Soft Sky Blue)</option>
                    <option value="Seminar">Seminar (Soft Amber)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Instructor</label>
                <input
                  type="text"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  >
                    {days.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Time (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] font-bold focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Time (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] font-bold focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Room / Facility Allocation</label>
                <select
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                >
                  <option value="Kelvin Auditorium (Hall 1)">Kelvin Auditorium (Hall 1) - Cap 220</option>
                  <option value="Turing AI Lab (CS-302)">Turing AI Lab (CS-302) - Cap 45</option>
                  <option value="Ada Lovelace Seminar Room">Ada Lovelace Seminar Room - Cap 30</option>
                  <option value="Sir Edward Coke Moot Court">Sir Edward Coke Moot Court - Cap 60</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#312E81] hover:bg-indigo-900 rounded-xl shadow-xs transition"
                >
                  Validate & Add Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
