import React, { useState } from 'react';
import { 
  DoorClosed, 
  Clock, 
  MapPin, 
  Users, 
  AlertTriangle, 
  Calendar, 
  X,
  Trash2
} from 'lucide-react';
import { CampusFacility, RoomBooking, UserProfile } from '../types';
import { doIntervalsOverlap } from '../utils/timetableConflict';

interface RoomBookingViewProps {
  currentUser: UserProfile;
  facilities: CampusFacility[];
  bookings: RoomBooking[];
  onAddBooking: (booking: RoomBooking) => void;
  onCancelBooking: (id: string) => void;
}

export const RoomBookingView: React.FC<RoomBookingViewProps> = ({
  currentUser,
  facilities,
  bookings,
  onAddBooking,
  onCancelBooking
}) => {
  const [selectedFacilityType, setSelectedFacilityType] = useState<string>('all');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedFacilityForModal, setSelectedFacilityForModal] = useState<CampusFacility | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Form fields
  const [bookingDate, setBookingDate] = useState('2026-11-09');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState(25);
  const [notes, setNotes] = useState('');

  const filteredFacilities = facilities.filter(f => 
    selectedFacilityType === 'all' || f.facilityType === selectedFacilityType
  );

  const handleOpenReserve = (facility: CampusFacility) => {
    setSelectedFacilityForModal(facility);
    setPurpose('');
    setConflictError(null);
    setShowBookingModal(true);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityForModal) return;

    // Check for double-booking collision on the same date and facility
    const collision = bookings.find(b => 
      b.facilityId === selectedFacilityForModal.id &&
      b.date === bookingDate &&
      b.status === 'confirmed' &&
      doIntervalsOverlap(b.startTime, b.endTime, startTime, endTime)
    );

    if (collision) {
      setConflictError(
        `Facility Collision: "${selectedFacilityForModal.name}" is already reserved on ${bookingDate} between ${collision.startTime} - ${collision.endTime} for "${collision.purpose}" by ${collision.reservedByName}.`
      );
      return;
    }

    const newBooking: RoomBooking = {
      id: `bk-res-${Date.now()}`,
      facilityId: selectedFacilityForModal.id,
      facilityName: selectedFacilityForModal.name,
      facilityCode: selectedFacilityForModal.code,
      reservedById: currentUser.id,
      reservedByName: currentUser.fullName,
      userRole: currentUser.role,
      purpose: purpose.trim(),
      date: bookingDate,
      startTime,
      endTime,
      attendeesExpected: attendees,
      status: 'confirmed',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddBooking(newBooking);
    setShowBookingModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-indigo-50 text-[#312E81] rounded-xl">
              <DoorClosed className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">Room & Lab Booking System</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Reserve state-of-the-art supercomputing labs, executive seminar suites, and grand auditoriums with automated slot collision prevention.
          </p>
        </div>

        {/* Filter by facility type */}
        <div className="w-full sm:w-56">
          <select
            value={selectedFacilityType}
            onChange={(e) => setSelectedFacilityType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#111827] font-semibold focus:outline-none focus:ring-2 focus:ring-[#312E81]"
          >
            <option value="all">All Facilities</option>
            <option value="computer_lab">Computer & AI Labs</option>
            <option value="lecture_hall">Grand Lecture Halls</option>
            <option value="seminar_room">Executive Seminar Rooms</option>
            <option value="study_pod">Graduate Study Pods</option>
            <option value="specialized_lab">Specialized Moot Courts / Labs</option>
          </select>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacilities.map((facility) => {
          const facilityBookings = bookings.filter(b => b.facilityId === facility.id && b.status === 'confirmed');
          const isOccupied = facilityBookings.length > 0;

          return (
            <div 
              key={facility.id}
              className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs transition group"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img 
                    src={facility.imageUrl} 
                    alt={facility.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-black/60 text-white border border-white/20 backdrop-blur shadow-xs">
                      {facility.code}
                    </span>

                    {/* UI Color Rule: Available (Soft Green #DCFCE7), Booked (Soft Red #FEE2E2) */}
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${
                      isOccupied 
                        ? 'bg-[#FEE2E2] text-[#b91c1c] border border-red-300' 
                        : 'bg-[#DCFCE7] text-[#15803d] border border-green-300'
                    }`}>
                      {isOccupied ? `${facilityBookings.length} Slots Booked` : 'Slots Available'}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white font-medium drop-shadow-sm">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-300" />
                      Capacity: <strong>{facility.capacity} pax</strong>
                    </span>
                    <span className="text-[11px] font-mono text-slate-200">
                      {facility.building}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-2.5">
                  <h3 className="font-extrabold text-base text-[#111827] group-hover:text-[#312E81] transition">
                    {facility.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    <span>{facility.building} &bull; {facility.floor}, {facility.roomNumber}</span>
                  </p>

                  {/* Amenities tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {facility.amenities.map((amenity, i) => (
                      <span key={i} className="text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                        {amenity}
                      </span>
                    ))}
                  </div>

                  {/* Visual Status Indicator */}
                  <div className="pt-2.5 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-500 font-medium">Schedule Status: </span>
                    {isOccupied ? (
                      <span className="text-[#b91c1c] font-bold">Occupied for {facilityBookings.length} upcoming slot(s)</span>
                    ) : (
                      <span className="text-[#15803d] font-bold">Open for student and faculty booking</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => handleOpenReserve(facility)}
                  className="w-full flex items-center justify-center gap-2 bg-[#312E81] hover:bg-indigo-900 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-300" />
                  <span>Reserve Room Slot</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmed Bookings Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-[#312E81] rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-base text-[#111827]">Live Campus Reservations Ledger</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono font-bold">
            {bookings.length} Confirmed Slots
          </span>
        </div>

        <div className="space-y-3">
          {bookings.map((b) => (
            <div 
              key={b.id}
              className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-white bg-[#312E81] px-2.5 py-0.5 rounded-lg shadow-xs">
                    {b.facilityCode}
                  </span>
                  <span className="text-xs font-bold text-[#111827]">{b.facilityName}</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#15803d] border border-green-300">
                    Confirmed
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium">Purpose: {b.purpose}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Clock className="w-3.5 h-3.5 text-[#312E81]" /> {b.date} &bull; {b.startTime} - {b.endTime}
                  </span>
                  <span>Booked by: <strong className="text-slate-700">{b.reservedByName}</strong> ({b.userRole})</span>
                  <span>Attendees: {b.attendeesExpected}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => onCancelBooking(b.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-200 rounded-lg transition"
                  title="Cancel booking"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Reservation Modal */}
      {showBookingModal && selectedFacilityForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#312E81]">Facility Allocation Service</span>
                <h3 className="text-lg font-extrabold text-[#111827] mt-0.5">Reserve {selectedFacilityForModal.name}</h3>
              </div>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-800 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {conflictError && (
              <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl p-4 text-red-950 text-xs flex items-start gap-2 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="font-semibold leading-relaxed">{conflictError}</p>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-slate-800 font-medium">Location: {selectedFacilityForModal.building}, {selectedFacilityForModal.roomNumber}</p>
                <p className="text-slate-600">Max Room Capacity: <strong className="text-slate-900">{selectedFacilityForModal.capacity}</strong> attendees</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Session Purpose *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS450 Deep RL Workshop / Robotics Demo"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Reservation Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Time (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Time (HH:MM)</label>
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
                  <label className="block text-slate-700 font-bold mb-1">Expected Attendees</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedFacilityForModal.capacity}
                    value={attendees}
                    onChange={(e) => setAttendees(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Special Equipment / Setup</label>
                  <input
                    type="text"
                    placeholder="e.g. GPU cluster access, mic setup"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#312E81] hover:bg-indigo-900 rounded-xl shadow-xs transition"
                >
                  Confirm & Prevent Overlap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
