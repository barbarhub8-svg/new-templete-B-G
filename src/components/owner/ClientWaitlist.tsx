import React, { useState, useEffect } from 'react';
import { Plus, X, User, Phone, Clock } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface WaitlistEntry {
  id: string;
  name: string;
  contact: string;
  addedAt: number;
}

export function ClientWaitlist({ shopId }: { shopId: string }) {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const { toast } = useToast();

  const STORAGE_KEY = `waitlist_${shopId}`;

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setWaitlist(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse waitlist', e);
      }
    }
  }, [STORAGE_KEY]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(waitlist));
  }, [waitlist, STORAGE_KEY]);

  const addEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contact) return;
    
    const newEntry: WaitlistEntry = {
      id: Date.now().toString(),
      name,
      contact,
      addedAt: Date.now(),
    };
    
    setWaitlist([...waitlist, newEntry]);
    setName('');
    setContact('');
    toast({ title: 'Client added to waitlist' });
  };

  const removeEntry = (id: string) => {
    setWaitlist(waitlist.filter(item => item.id !== id));
  };

  return (
    <div className="nexora-card rounded-2xl p-6 border-gold/15">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-gold/10 border border-gold/25 rounded-xl flex items-center justify-center">
          <Clock className="w-4 h-4 text-gold" />
        </div>
        <h2 className="font-playfair font-semibold text-white text-lg">Walk-in Waitlist</h2>
      </div>

      <form onSubmit={addEntry} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <input 
          type="text" 
          placeholder="Client Name" 
          value={name} 
          onChange={e => setName(e.target.value)}
          className="bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-gold/50 outline-none"
        />
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Contact Number" 
            value={contact} 
            onChange={e => setContact(e.target.value)}
            className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-gold/50 outline-none"
          />
          <button type="submit" className="p-2.5 bg-gold hover:bg-gold-light text-[#0A0A0A] rounded-xl transition-all">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {waitlist.length === 0 ? (
          <p className="text-sm text-white/20 text-center py-4 font-inter">No clients waiting</p>
        ) : (
          waitlist.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white font-inter">{item.name}</p>
                  <p className="text-xs text-white/30 font-inter flex items-center gap-1"><Phone className="w-3 h-3" /> {item.contact}</p>
                </div>
              </div>
              <button onClick={() => removeEntry(item.id)} className="text-white/30 hover:text-red-400 p-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
