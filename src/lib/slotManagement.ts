// =====================================================
// SLOT MANAGEMENT ENGINE
// Generates available time slots based on shop hours,
// service duration, and existing bookings
// =====================================================

export interface TimeSlot {
  time: string; // HH:MM format
  available: boolean;
  reason?: string; // Why unavailable
}

export interface SlotGenerationParams {
  openingTime: string; // HH:MM format
  closingTime: string; // HH:MM format
  serviceDurationMinutes: number;
  existingBookings: Array<{
    date: string;
    time: string;
    durationMinutes: number;
  }>;
  selectedDate: string; // YYYY-MM-DD
  bufferMinutes?: number; // Buffer between appointments (default 15)
}

/**
 * Convert HH:MM time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to HH:MM format
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if two time slots overlap
 */
function slotsOverlap(
  slot1Start: number,
  slot1Duration: number,
  slot2Start: number,
  slot2Duration: number
): boolean {
  const slot1End = slot1Start + slot1Duration;
  const slot2End = slot2Start + slot2Duration;
  
  return (
    (slot1Start >= slot2Start && slot1Start < slot2End) ||
    (slot2Start >= slot1Start && slot2Start < slot1End)
  );
}

/**
 * Generate available time slots for a given date
 */
export function generateTimeSlots(params: SlotGenerationParams): TimeSlot[] {
  const {
    openingTime,
    closingTime,
    serviceDurationMinutes,
    existingBookings,
    selectedDate,
    bufferMinutes = 15,
  } = params;

  const slots: TimeSlot[] = [];
  
  const openMinutes = timeToMinutes(openingTime);
  const closeMinutes = timeToMinutes(closingTime);
  const totalDuration = serviceDurationMinutes + bufferMinutes;
  
  // Generate all possible slots
  let currentTime = openMinutes;
  
  while (currentTime + serviceDurationMinutes <= closeMinutes) {
    const slotTime = minutesToTime(currentTime);
    
    // Check if this slot conflicts with existing bookings
    let isAvailable = true;
    let conflictReason = '';
    
    for (const booking of existingBookings) {
      if (booking.date !== selectedDate) continue;
      
      const bookingStart = timeToMinutes(booking.time);
      const bookingDuration = booking.durationMinutes + bufferMinutes;
      
      if (slotsOverlap(currentTime, totalDuration, bookingStart, bookingDuration)) {
        isAvailable = false;
        conflictReason = 'Slot already booked';
        break;
      }
    }
    
    // Check if slot is in the past (for today's date)
    const now = new Date();
    const slotDate = new Date(selectedDate);
    
    if (
      slotDate.toDateString() === now.toDateString() &&
      currentTime < timeToMinutes(`${now.getHours()}:${now.getMinutes()}`)
    ) {
      isAvailable = false;
      conflictReason = 'Time has passed';
    }
    
    slots.push({
      time: slotTime,
      available: isAvailable,
      reason: conflictReason || undefined,
    });
    
    // Move to next slot (30 minute intervals by default)
    currentTime += 30;
  }
  
  return slots;
}

/**
 * Get next available slot after a given time
 */
export function getNextAvailableSlot(
  slots: TimeSlot[],
  afterTime?: string
): TimeSlot | null {
  const afterMinutes = afterTime ? timeToMinutes(afterTime) : 0;
  
  for (const slot of slots) {
    if (slot.available && timeToMinutes(slot.time) > afterMinutes) {
      return slot;
    }
  }
  
  return null;
}

/**
 * Get all available slots for a date range (for suggesting alternative times)
 */
export function getAvailableSlotsForDateRange(
  startDate: string,
  endDate: string,
  params: Omit<SlotGenerationParams, 'selectedDate'>
): Record<string, TimeSlot[]> {
  const result: Record<string, TimeSlot[]> = {};
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    result[dateStr] = generateTimeSlots({
      ...params,
      selectedDate: dateStr,
    });
  }
  
  return result;
}

/**
 * Calculate total duration for multiple services
 */
export function calculateTotalDuration(services: Array<{ duration_minutes: number }>): number {
  return services.reduce((total, service) => total + service.duration_minutes, 0);
}

/**
 * Check if a specific slot is available
 */
export function isSlotAvailable(
  time: string,
  date: string,
  params: Omit<SlotGenerationParams, 'selectedDate'>
): boolean {
  const slots = generateTimeSlots({ ...params, selectedDate: date });
  const slot = slots.find((s) => s.time === time);
  return slot?.available || false;
}
