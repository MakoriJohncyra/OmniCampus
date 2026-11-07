/**
 * Pure logic for timetable conflict detection and schedule validation.
 * Decoupled from React UI for fast deterministic unit testing.
 */

export interface TimetableSlot {
  id: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string; // 'HH:MM' (24-hour format, e.g. '09:00')
  endTime: string;   // 'HH:MM' (24-hour format, e.g. '11:00')
  room: string;
  classType: 'Lecture' | 'Lab' | 'Tutorial' | 'Seminar';
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingSlots: [TimetableSlot, TimetableSlot][];
  reason?: string;
}

/**
 * Converts HH:MM string to total minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

/**
 * Checks if two time intervals overlap (strictly overlapping, touching endpoints don't clash)
 */
export function doIntervalsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  // Overlap occurs if max(startA, startB) < min(endA, endB)
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

/**
 * Detects conflicts within a list of schedule slots.
 * Conflicts occur when:
 * 1. Two slots are on the same day AND their time intervals overlap (Student schedule clash)
 * 2. Two slots are on the same day, time intervals overlap AND they share the same room (Room double-booking)
 */
export function detectTimetableConflicts(slots: TimetableSlot[]): ConflictResult {
  const conflictingPairs: [TimetableSlot, TimetableSlot][] = [];

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const slotA = slots[i];
      const slotB = slots[j];

      if (slotA.dayOfWeek === slotB.dayOfWeek) {
        if (doIntervalsOverlap(slotA.startTime, slotA.endTime, slotB.startTime, slotB.endTime)) {
          conflictingPairs.push([slotA, slotB]);
        }
      }
    }
  }

  if (conflictingPairs.length > 0) {
    const firstPair = conflictingPairs[0];
    const sameRoom = firstPair[0].room.toLowerCase() === firstPair[1].room.toLowerCase();
    const reason = sameRoom
      ? `Room conflict: ${firstPair[0].courseCode} and ${firstPair[1].courseCode} both booked ${firstPair[0].room} on ${firstPair[0].dayOfWeek} between ${firstPair[0].startTime}-${firstPair[0].endTime} and ${firstPair[1].startTime}-${firstPair[1].endTime}.`
      : `Schedule clash: ${firstPair[0].courseCode} (${firstPair[0].startTime}-${firstPair[0].endTime}) overlaps with ${firstPair[1].courseCode} (${firstPair[1].startTime}-${firstPair[1].endTime}) on ${firstPair[0].dayOfWeek}.`;

    return {
      hasConflict: true,
      conflictingSlots: conflictingPairs,
      reason,
    };
  }

  return {
    hasConflict: false,
    conflictingSlots: [],
  };
}

/**
 * Validates whether a new candidate slot can be added without causing conflicts
 */
export function canAddSlotWithoutConflict(
  existingSlots: TimetableSlot[],
  candidate: TimetableSlot
): { canAdd: boolean; conflictWith?: TimetableSlot; reason?: string } {
  for (const existing of existingSlots) {
    if (existing.dayOfWeek === candidate.dayOfWeek) {
      if (doIntervalsOverlap(existing.startTime, existing.endTime, candidate.startTime, candidate.endTime)) {
        const isSameRoom = existing.room.toLowerCase() === candidate.room.toLowerCase();
        return {
          canAdd: false,
          conflictWith: existing,
          reason: isSameRoom
            ? `Room ${candidate.room} is already occupied by ${existing.courseCode} at this time.`
            : `Time conflict with ${existing.courseCode} (${existing.courseName}) on ${candidate.dayOfWeek}.`,
        };
      }
    }
  }
  return { canAdd: true };
}

/**
 * Role-Based Access Control helper for UI permissions
 */
export type UserRole = 'student' | 'lecturer' | 'admin_staff' | 'system_admin';

export interface RolePermissions {
  canUploadResources: boolean;
  canVerifyResources: boolean;
  canApproveForms: boolean;
  canCreateEvents: boolean;
  canManageFacilities: boolean;
  canBorrowBooks: boolean;
}

export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'system_admin':
      return {
        canUploadResources: true,
        canVerifyResources: true,
        canApproveForms: true,
        canCreateEvents: true,
        canManageFacilities: true,
        canBorrowBooks: true,
      };
    case 'admin_staff':
      return {
        canUploadResources: true,
        canVerifyResources: true,
        canApproveForms: true,
        canCreateEvents: true,
        canManageFacilities: true,
        canBorrowBooks: true,
      };
    case 'lecturer':
      return {
        canUploadResources: true,
        canVerifyResources: false,
        canApproveForms: false,
        canCreateEvents: true,
        canManageFacilities: false,
        canBorrowBooks: true,
      };
    case 'student':
    default:
      return {
        canUploadResources: false,
        canVerifyResources: false,
        canApproveForms: false,
        canCreateEvents: false,
        canManageFacilities: false,
        canBorrowBooks: true,
      };
  }
}
