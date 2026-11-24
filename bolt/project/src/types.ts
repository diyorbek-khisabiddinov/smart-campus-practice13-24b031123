export interface Booking {
  start: number; // minutes from midnight
  end: number; // minutes from midnight
  label: string;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  blocked: boolean;
  bookings: Booking[];
}

export type ExplanationReason =
  | 'available'
  | 'overlap'
  | 'blocked'
  | 'past_start'
  | 'duration_limit';

export type AvailabilityOutcome =
  | { status: 'available'; reason: string; reasonCode: 'available' }
  | {
      status: 'unavailable';
      reason: string;
      reasonCode: Exclude<ExplanationReason, 'available'> | 'invalid_input' | 'unknown_room';
    };

export interface CheckRequest {
  roomId: string;
  now: number; // minutes from midnight, supplied current time
  start: number; // minutes from midnight
  end: number; // minutes from midnight
}
