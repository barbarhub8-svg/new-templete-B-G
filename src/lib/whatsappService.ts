import { supabase } from './supabase';

export interface AppointmentReminder {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  shopName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  staffName?: string;
}

/**
 * Generate a WhatsApp click-to-chat URL with a reminder message 2 hours before appointment.
 */
export function generateWhatsAppReminderUrl(reminder: AppointmentReminder): string {
  const phone = (reminder.customerPhone || '').replace(/\D/g, '');
  const formattedTime = formatTime12h(reminder.appointmentTime);
  const staffPart = reminder.staffName ? ` with ${reminder.staffName}` : '';
  
  const message = `Hello ${reminder.customerName}! 🌸 This is a friendly reminder from *${reminder.shopName}* regarding your upcoming appointment for *${reminder.serviceName}*${staffPart} today at *${formattedTime}* (in ~2 hours). We look forward to seeing you! Please let us know if you need to reschedule.`;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone ? (phone.startsWith('91') ? phone : '91' + phone) : ''}?text=${encodedMessage}`;
}

function formatTime12h(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Check if a booking is roughly 2 hours away (or for demo/testing, any confirmed appointment today or matching window).
 */
export function isTwoHoursBefore(dateStr: string, timeStr: string): boolean {
  if (!dateStr || !timeStr) return false;
  try {
    const apptDateTime = new Date(`${dateStr}T${timeStr}:00`);
    const now = new Date();
    const diffMs = apptDateTime.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    // Between 0 and 180 minutes or exact 2-hour window (105 to 135 mins)
    // For robust user experience, we can also flag appointments happening today in confirmed status.
    return diffMinutes >= -30 && diffMinutes <= 180;
  } catch {
    return false;
  }
}
