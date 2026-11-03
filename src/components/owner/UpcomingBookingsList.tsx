import React from 'react';
import { Bell, Clock, Calendar, MessageSquare } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export function UpcomingBookingsList({ bookings }: { bookings: any[] }) {
  const { toast } = useToast();

  const sendReminder = (booking: any) => {
    toast({
      title: 'Reminder Sent',
      description: `Notification sent to ${booking.customer_name} for their ${booking.final_time || booking.requested_time} appointment.`,
    });
  };

  return (
    <div className="nexora-card rounded-2xl p-6 border-gold/15">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-gold/10 border border-gold/25 rounded-xl flex items-center justify-center">
          <Bell className="w-4 h-4 text-gold" />
        </div>
        <h2 className="font-playfair font-semibold text-white text-lg">Upcoming Reminders</h2>
      </div>
      <div className="space-y-3">
        {bookings.length === 0 ? (
            <p className="text-sm text-white/20 text-center py-4 font-inter">No upcoming appointments</p>
        ) : (
            bookings.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate font-inter">{b.customer_name}</p>
                        <p className="text-xs text-white/40 flex items-center gap-1 mt-1 font-inter">
                            <Calendar className="w-3 h-3" /> {b.final_date || b.requested_date}
                            <Clock className="w-3 h-3 ml-2" /> {String(b.final_time || b.requested_time || '').slice(0, 5)}
                        </p>
                    </div>
                    <button onClick={() => sendReminder(b)} className="ml-3 p-2 bg-gold/10 hover:bg-gold/20 text-gold rounded-xl transition-all" title="Send Reminder">
                        <MessageSquare className="w-4 h-4" />
                    </button>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
