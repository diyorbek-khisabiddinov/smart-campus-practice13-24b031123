import type { Room } from './types';

export const ROOMS: Room[] = [
  {
    id: 'A101',
    name: 'Room A101',
    building: 'Engineering Block',
    capacity: 30,
    blocked: false,
    bookings: [
      { start: 600, end: 660, label: 'Calculus 201' }, // 10:00–11:00
    ],
  },
  {
    id: 'B202',
    name: 'Room B202',
    building: 'Science Block',
    capacity: 24,
    blocked: true,
    bookings: [],
  },
  {
    id: 'C303',
    name: 'Room C303',
    building: 'Library Wing',
    capacity: 18,
    blocked: false,
    bookings: [
      { start: 540, end: 600, label: 'Study Group' }, // 09:00–10:00
      { start: 780, end: 840, label: 'Faculty Meeting' }, // 13:00–14:00
    ],
  },
];

export const DEFAULT_NOW = 540; // 09:00 in minutes
