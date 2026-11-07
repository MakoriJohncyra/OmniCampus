import React, { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Check, 
  UserCheck, 
  X
} from 'lucide-react';
import { CampusEvent, EventCategory, UserProfile } from '../types';
import { getRolePermissions } from '../utils/timetableConflict';

interface CampusEventsViewProps {
  currentUser: UserProfile;
  events: CampusEvent[];
  onToggleRsvp: (eventId: string) => void;
  onAddEvent: (event: CampusEvent) => void;
}

export const CampusEventsView: React.FC<CampusEventsViewProps> = ({
  currentUser,
  events,
  onToggleRsvp,
  onAddEvent
}) => {
  const perms = getRolePermissions(currentUser.role);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('academic_seminar');
  const [venue, setVenue] = useState('Alan Turing Atrium & Computing Labs');
  const [date, setDate] = useState('2026-11-25');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('17:00');
  const [maxAttendees, setMaxAttendees] = useState(150);
  const [tagsInput, setTagsInput] = useState('AI, Research, Campus');

  const filteredEvents = events.filter(e => 
    selectedCategory === 'all' || e.category === selectedCategory
  );

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newEvent: CampusEvent = {
      id: `evt-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      organizerName: currentUser.fullName,
      organizerRole: currentUser.department,
      venue: venue.trim(),
      date,
      startTime,
      endTime,
      maxAttendees,
      currentRsvps: 1,
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      isRsvpd: true
    };

    onAddEvent(newEvent);
    setShowAddEventModal(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-amber-50 text-[#F59E0B] rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">Campus Events Feed</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Live directory of university conferences, robotics hackathons, distinguished lectures, and career recruitment expos.
          </p>
        </div>

        {perms.canCreateEvents && (
          <button
            onClick={() => setShowAddEventModal(true)}
            className="flex items-center gap-2 bg-[#312E81] hover:bg-indigo-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Publish Campus Event</span>
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        <span className="text-slate-500 font-bold shrink-0 uppercase tracking-wider text-[11px]">Filter Category:</span>
        {[
          { id: 'all', label: 'All Events' },
          { id: 'hackathon', label: '🚀 Hackathons' },
          { id: 'guest_lecture', label: '🎓 Distinguished Keynotes' },
          { id: 'career_fair', label: '💼 Career Fairs' },
          { id: 'academic_seminar', label: '🔬 Research Seminars' }
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
              selectedCategory === c.id
                ? 'bg-[#312E81] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          return (
            <div 
              key={event.id}
              className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs transition group"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img 
                    src={event.bannerUrl} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"></div>
                  
                  {/* Sunset Amber Badge #F59E0B */}
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-lg bg-[#FEF3C7] text-[#92400E] border-2 border-[#F59E0B] shadow-xs">
                      {event.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white font-medium drop-shadow-sm">
                    <span className="flex items-center gap-1 font-bold">
                      <Users className="w-3.5 h-3.5 text-amber-300" />
                      {event.currentRsvps} {event.maxAttendees ? `/ ${event.maxAttendees}` : ''} Attending
                    </span>
                    <span className="text-[11px] text-slate-200 font-mono">
                      {event.date}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-2.5">
                  <h3 className="font-extrabold text-base text-[#111827] group-hover:text-[#312E81] transition line-clamp-1">
                    {event.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>

                  <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#312E81] shrink-0" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {event.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* RSVP Action Bar */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => onToggleRsvp(event.id)}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl text-xs transition shadow-xs ${
                    event.isRsvpd
                      ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                      : 'bg-[#312E81] hover:bg-indigo-900 text-white'
                  }`}
                >
                  {event.isRsvpd ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>RSVP Confirmed (Going)</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                      <span>Reserve My Seat (RSVP)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#F59E0B]">Campus Events Board</span>
                <h3 className="text-lg font-extrabold text-[#111827] mt-0.5">Create University Event</h3>
              </div>
              <button onClick={() => setShowAddEventModal(false)} className="text-slate-400 hover:text-slate-800 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEventSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quantum Computing Colloquium 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Brief synopsis, guest speaker details, or participant prerequisites..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  >
                    <option value="academic_seminar">Academic Seminar</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="guest_lecture">Guest Keynote</option>
                    <option value="career_fair">Career Fair</option>
                    <option value="workshop">Interactive Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Venue Location</label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Capacity (Max Attendees)</label>
                  <input
                    type="number"
                    min={10}
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#312E81] hover:bg-indigo-900 rounded-xl shadow-xs transition"
                >
                  Publish to Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
