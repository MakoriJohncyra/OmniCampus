import test from 'node:test';
import assert from 'node:assert/strict';
import {
  timeToMinutes,
  doIntervalsOverlap,
  detectTimetableConflicts,
  canAddSlotWithoutConflict,
  getRolePermissions,
  TimetableSlot,
} from './timetableConflict';

test('timeToMinutes converts valid HH:MM correctly', () => {
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('08:30'), 510);
  assert.equal(timeToMinutes('14:45'), 885);
  assert.equal(timeToMinutes('23:59'), 1439);
});

test('doIntervalsOverlap detects overlapping time ranges', () => {
  // Overlapping intervals
  assert.equal(doIntervalsOverlap('09:00', '11:00', '10:00', '12:00'), true);
  assert.equal(doIntervalsOverlap('10:00', '12:00', '09:00', '11:00'), true);
  assert.equal(doIntervalsOverlap('09:00', '12:00', '10:00', '11:00'), true);

  // Touching endpoints should NOT overlap (back-to-back classes)
  assert.equal(doIntervalsOverlap('09:00', '10:00', '10:00', '11:00'), false);
  assert.equal(doIntervalsOverlap('10:00', '11:00', '09:00', '10:00'), false);

  // Distinct intervals
  assert.equal(doIntervalsOverlap('08:00', '09:00', '11:00', '12:00'), false);
});

test('detectTimetableConflicts flags clashes on the same day', () => {
  const slot1: TimetableSlot = {
    id: 's1',
    courseCode: 'CS301',
    courseName: 'Distributed Systems',
    instructor: 'Dr. Aris Thorne',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '11:00',
    room: 'Turing Hall A',
    classType: 'Lecture',
  };

  const slot2: TimetableSlot = {
    id: 's2',
    courseCode: 'CS305',
    courseName: 'Database Internals',
    instructor: 'Prof. Helen Ross',
    dayOfWeek: 'Monday',
    startTime: '10:00',
    endTime: '12:00',
    room: 'Lovelace Lab 3',
    classType: 'Lab',
  };

  const slot3: TimetableSlot = {
    id: 's3',
    courseCode: 'MATH220',
    courseName: 'Discrete Structures',
    instructor: 'Dr. Eric Paul',
    dayOfWeek: 'Tuesday',
    startTime: '09:00',
    endTime: '11:00',
    room: 'Turing Hall A',
    classType: 'Lecture',
  };

  // slot1 and slot2 clash on Monday
  const resultClash = detectTimetableConflicts([slot1, slot2]);
  assert.equal(resultClash.hasConflict, true);
  assert.equal(resultClash.conflictingSlots.length, 1);

  // slot1 and slot3 are on different days, no conflict
  const resultNoClash = detectTimetableConflicts([slot1, slot3]);
  assert.equal(resultNoClash.hasConflict, false);
});

test('canAddSlotWithoutConflict checks new candidate slot correctly', () => {
  const existing: TimetableSlot[] = [
    {
      id: 'e1',
      courseCode: 'CS101',
      courseName: 'Introduction to Algorithms',
      instructor: 'Dr. Vance',
      dayOfWeek: 'Wednesday',
      startTime: '13:00',
      endTime: '15:00',
      room: 'Room 204',
      classType: 'Lecture',
    },
  ];

  const clashingCandidate: TimetableSlot = {
    id: 'c1',
    courseCode: 'ENG202',
    courseName: 'Signals & Systems',
    instructor: 'Prof. Gomez',
    dayOfWeek: 'Wednesday',
    startTime: '14:00',
    endTime: '16:00',
    room: 'Room 101',
    classType: 'Lecture',
  };

  const validCandidate: TimetableSlot = {
    id: 'c2',
    courseCode: 'ENG202',
    courseName: 'Signals & Systems',
    instructor: 'Prof. Gomez',
    dayOfWeek: 'Wednesday',
    startTime: '15:00',
    endTime: '17:00',
    room: 'Room 101',
    classType: 'Lecture',
  };

  assert.equal(canAddSlotWithoutConflict(existing, clashingCandidate).canAdd, false);
  assert.equal(canAddSlotWithoutConflict(existing, validCandidate).canAdd, true);
});

test('getRolePermissions grants appropriate capabilities per role', () => {
  const studentPerms = getRolePermissions('student');
  assert.equal(studentPerms.canUploadResources, false);
  assert.equal(studentPerms.canApproveForms, false);

  const lecturerPerms = getRolePermissions('lecturer');
  assert.equal(lecturerPerms.canUploadResources, true);
  assert.equal(lecturerPerms.canApproveForms, false);

  const adminPerms = getRolePermissions('admin_staff');
  assert.equal(adminPerms.canUploadResources, true);
  assert.equal(adminPerms.canApproveForms, true);

  const sysAdminPerms = getRolePermissions('system_admin');
  assert.equal(sysAdminPerms.canManageFacilities, true);
  assert.equal(sysAdminPerms.canApproveForms, true);
});
