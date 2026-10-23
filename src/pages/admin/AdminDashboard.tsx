import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Store, BookOpen, IndianRupee, Star, Users, Loader2,
  CheckCircle, Clock, XCircle, AlertCircle, RefreshCw,
  ChevronUp, ChevronDown, Activity, Percent, Ban,
  ShieldOff, ShieldCheck, X, Trash2, Eye, Search,
  ChevronLeft, ChevronRight, TrendingUp, BarChart2,
  Scissors, Home, Calendar, Plus, Edit2, Save, Image,
  Globe, Phone, Mail, Instagram, Facebook, Twitter,
  Settings, Upload, Layers, ExternalLink, Link
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminStats {
  totalShops: number;
  approvedShops: number;
  pendingShops: number;
  rejectedShops: number;
  suspendedShops: number;
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
  platformRevenue: number;
  totalTransactedAmount: number;
  totalUsers: number;
  completedBookingsAmount: number;
}

interface ShopRow {
  id: string; name: string; city: string; status: string;
  category: string | null; contact_phone: string | null;
  total_bookings: number; average_rating: number; total_reviews: number;
  owner_email: string; owner_name: string; created_at: string;
  home_service_available: boolean; services_count: number;
  gst_number: string | null; reject_reason: string | null;
  address: string; opening_time: string; closing_time: string;
  weekly_off: string;
}

interface ServiceRow {
  id: string; name: string; price: number; duration_minutes: number; is_active: boolean;
}

interface MediaRow {
  id: string; media_type: string; media_url: string; display_order: number;
}

interface BookingRow {
  id: string; shop_name: string; customer_name: string;
  customer_email: string; status: string; total_amount: number;
  created_at: string; requested_date: string; service_type: string;
}

interface UserRow {
  id: string; email: string; username: string; role: string;
  phone: string | null; created_at: string;
}

interface PlatformSettings {
  id: string;
  site_name: string;
  site_tagline: string;
  site_description: string;
  logo_url: string | null;
  contact_email: string;
  contact_phone: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  commission_percent: number;
  min_withdrawal: number;
}

type ActiveTab = 'overview' | 'shops' | 'bookings' | 'users' | 'settings';
type ShopStatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'suspended';
type DialogType = 'approve' | 'reject' | 'suspend' | 'unsuspend' | 'delete' | 'view' | 'manage';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fc(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v}`;
}

function fd(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const BOOKING_STATUS: Record<string, { label: string; color: string; ring: string }> = {
  pending: { label: 'Pending', color: 'text-amber-400', ring: 'bg-amber-400/15 border border-amber-400/30' },
  confirmed: { label: 'Confirmed', color: 'text-emerald-400', ring: 'bg-emerald-400/15 border border-emerald-400/30' },
  'time-suggested': { label: 'Suggested', color: 'text-blue-400', ring: 'bg-blue-400/15 border border-blue-400/30' },
  suggested: { label: 'Suggested', color: 'text-blue-400', ring: 'bg-blue-400/15 border border-blue-400/30' },
  completed: { label: 'Completed', color: 'text-gold', ring: 'bg-gold/15 border border-gold/30' },
  cancelled: { label: 'Cancelled', color: 'text-red-400', ring: 'bg-red-400/15 border border-red-400/30' },
};

const SHOP_STATUS: Record<string, { label: string; dot: string; badge: string }> = {
  approved: { label: 'Approved', dot: 'bg-emerald-400', badge: 'text-emerald-400 bg-emerald-400/15 border border-emerald-400/30' },
  pending: { label: 'Pending', dot: 'bg-amber-400', badge: 'text-amber-400 bg-amber-400/15 border border-amber-400/30' },
  rejected: { label: 'Rejected', dot: 'bg-red-400', badge: 'text-red-400 bg-red-400/15 border border-red-400/30' },
  suspended: { label: 'Suspended', dot: 'bg-orange-400', badge: 'text-orange-400 bg-orange-400/15 border border-orange-400/30' },
};

function BookingBadge({ status }: { status: string }) {
  const cfg = BOOKING_STATUS[status] || BOOKING_STATUS.pending;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cfg.ring} ${cfg.color}`}>{cfg.label}</span>;
}

function ShopBadge({ status }: { status: string }) {
  const s = SHOP_STATUS[status] || SHOP_STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string; icon: any; accent: string;
}) {
  return (
    <div className={`nexora-card rounded-2xl p-5 border ${accent}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${accent}`}>
        <Icon className="w-5 h-5 text-gold" />
      </div>
      <p className="text-2xl font-bold text-white mb-0.5 font-inter">{value}</p>
      <p className="text-sm text-white/70 font-playfair font-semibold">{label}</p>
      {sub && <p className="text-xs text-white/25 mt-0.5 font-inter">{sub}</p>}
    </div>
  );
}

// ─── Shop Manage Modal ────────────────────────────────────────────────────────

function ShopManageModal({ shop, onClose }: { shop: ShopRow; onClose: () => void }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'services' | 'media'>('services');
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [newService, setNewService] = useState({ name: '', price: '', duration: '' });
  const [addingService, setAddingService] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadShopContent();
  }, [shop.id]);

  async function loadShopContent() {
    setLoading(true);
    const [svcRes, mediaRes] = await Promise.all([
      supabase.from('services').select('*').eq('shop_id', shop.id).order('created_at'),
      supabase.from('shop_media').select('*').eq('shop_id', shop.id).order('display_order'),
    ]);
    setServices(svcRes.data || []);
    setMedia(mediaRes.data || []);
    setLoading(false);
  }

  function startEdit(svc: ServiceRow) {
    setEditingId(svc.id);
    setEditName(svc.name);
    setEditPrice(String(svc.price));
    setEditDuration(String(svc.duration_minutes));
  }

  async function saveService(id: string) {
    if (!editName.trim() || !editPrice || !editDuration) return;
    setSaving(true);
    const { error } = await supabase.from('services').update({
      name: editName.trim(),
      price: parseInt(editPrice),
      duration_minutes: parseInt(editDuration),
    }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setEditingId(null);
      await loadShopContent();
      toast({ title: 'Service updated' });
    }
    setSaving(false);
  }

  async function deleteService(id: string) {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    await loadShopContent();
    toast({ title: 'Service deleted' });
  }

  async function toggleServiceActive(svc: ServiceRow) {
    await supabase.from('services').update({ is_active: !svc.is_active }).eq('id', svc.id);
    await loadShopContent();
  }

  async function addNewService() {
    if (!newService.name.trim() || !newService.price || !newService.duration) {
      toast({ title: 'Fill all fields', variant: 'destructive' }); return;
    }
    setSaving(true);
    const { error } = await supabase.from('services').insert({
      shop_id: shop.id,
      name: newService.name.trim(),
      price: parseInt(newService.price),
      duration_minutes: parseInt(newService.duration),
      is_active: true,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setNewService({ name: '', price: '', duration: '' });
      setAddingService(false);
      await loadShopContent();
      toast({ title: 'Service added' });
    }
    setSaving(false);
  }

  async function deleteMedia(item: MediaRow) {
    const { error } = await supabase.from('shop_media').delete().eq('id', item.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    await loadShopContent();
    toast({ title: 'Media removed' });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'Max 5MB', variant: 'destructive' }); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `admin/${shop.id}/img_${Date.now()}.${ext}`;
      const { data: upData, error: upError } = await supabase.storage.from('shop-media').upload(path, file, { upsert: true });
      if (upError) throw upError;
      const { data: urlData } = supabase.storage.from('shop-media').getPublicUrl(upData.path);
      await supabase.from('shop_media').insert({
        shop_id: shop.id, media_type: 'photo',
        media_url: urlData.publicUrl,
        display_order: media.length,
      });
      await loadShopContent();
      toast({ title: 'Image uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const inputCls = 'h-9 px-3 text-xs bg-[#0A0A0A] border border-white/12 focus:border-gold/40 text-white rounded-xl outline-none font-inter placeholder-white/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#141414] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/8 flex items-center justify-between gap-4 flex-shrink-0">
          <div>
            <h3 className="font-playfair font-bold text-white">Manage Shop Content</h3>
            <p className="text-xs text-gold/70 font-inter mt-0.5">{shop.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10">
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b border-white/8 flex-shrink-0">
          {[{ key: 'services', label: 'Services', icon: Scissors }, { key: 'media', label: 'Media / Images', icon: Image }].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all font-inter ${tab === key ? 'bg-gold text-[#0A0A0A]' : 'text-white/40 hover:text-white'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gold" />
            </div>
          ) : tab === 'services' ? (
            <div className="space-y-3">
              {/* Services List */}
              {services.map((svc) => (
                <div key={svc.id} className="bg-[#0E0E0E] border border-white/8 rounded-xl overflow-hidden">
                  {editingId === svc.id ? (
                    <div className="p-3 space-y-2">
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className={`${inputCls} w-full`} placeholder="Service name" />
                      <div className="flex gap-2">
                        <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                          className={`${inputCls} flex-1`} placeholder="₹ Price" />
                        <input type="number" value={editDuration} onChange={e => setEditDuration(e.target.value)}
                          className={`${inputCls} flex-1`} placeholder="Duration (mins)" />
                        <button onClick={() => saveService(svc.id)} disabled={saving}
                          className="h-9 px-4 bg-gold text-[#0A0A0A] rounded-xl text-xs font-bold hover:bg-gold-light transition-colors font-inter flex items-center gap-1">
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="h-9 px-3 border border-white/12 text-white/40 rounded-xl text-xs hover:text-white transition-colors font-inter">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3">
                      <div className="w-8 h-8 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Scissors className="w-3.5 h-3.5 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold font-inter ${svc.is_active ? 'text-white' : 'text-white/30 line-through'}`}>{svc.name}</p>
                        <p className="text-xs text-gold/60 font-inter">₹{svc.price} · {svc.duration_minutes} mins</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => toggleServiceActive(svc)} title={svc.is_active ? 'Deactivate' : 'Activate'}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${svc.is_active ? 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20' : 'bg-white/5 text-white/30 hover:text-emerald-400'}`}>
                          {svc.is_active ? '✓' : '○'}
                        </button>
                        <button onClick={() => startEdit(svc)}
                          className="w-7 h-7 bg-white/5 text-white/40 hover:text-gold hover:bg-gold/10 rounded-lg flex items-center justify-center transition-colors">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteService(svc.id)}
                          className="w-7 h-7 bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg flex items-center justify-center transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add New Service */}
              {addingService ? (
                <div className="p-4 bg-gold/5 border border-gold/20 rounded-xl space-y-2">
                  <p className="text-xs font-semibold text-gold uppercase tracking-wider font-inter">New Service</p>
                  <input value={newService.name} onChange={e => setNewService(p => ({ ...p, name: e.target.value }))}
                    className={`${inputCls} w-full`} placeholder="Service name (e.g., Hair Cut)" />
                  <div className="flex gap-2">
                    <input type="number" value={newService.price} onChange={e => setNewService(p => ({ ...p, price: e.target.value }))}
                      className={`${inputCls} flex-1`} placeholder="₹ Price" />
                    <input type="number" value={newService.duration} onChange={e => setNewService(p => ({ ...p, duration: e.target.value }))}
                      className={`${inputCls} flex-1`} placeholder="Duration (mins)" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addNewService} disabled={saving}
                      className="flex-1 py-2 bg-gold text-[#0A0A0A] rounded-xl text-xs font-bold hover:bg-gold-light transition-colors font-inter">
                      {saving ? 'Adding…' : 'Add Service'}
                    </button>
                    <button onClick={() => { setAddingService(false); setNewService({ name: '', price: '', duration: '' }); }}
                      className="flex-1 py-2 border border-white/12 text-white/40 rounded-xl text-xs hover:text-white transition-colors font-inter">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingService(true)}
                  className="w-full py-3 border-2 border-dashed border-white/12 hover:border-gold/30 hover:bg-gold/3 rounded-xl text-xs font-semibold text-white/40 hover:text-gold transition-all flex items-center justify-center gap-2 font-inter">
                  <Plus className="w-3.5 h-3.5" /> Add New Service
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Media Grid */}
              {media.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {media.map((item) => (
                    <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-square bg-[#0E0E0E] border border-white/8">
                      {item.media_type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#1E1E1E]">
                          <div className="text-center">
                            <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-1">
                              <span className="text-gold text-lg">▶</span>
                            </div>
                            <p className="text-white/30 text-[10px] font-inter">Video</p>
                          </div>
                        </div>
                      ) : (
                        <img src={item.media_url} alt="Shop media"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200/141414/D4AF37?text=IMG'; }} />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a href={item.media_url} target="_blank" rel="noreferrer"
                          className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => deleteMedia(item)}
                          className="w-8 h-8 bg-red-500/80 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/70 to-transparent">
                        <span className={`text-[10px] font-inter font-semibold ${item.media_type === 'video' ? 'text-gold' : 'text-white/60'}`}>
                          {item.media_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-white/20">
                  <Image className="w-12 h-12 mb-2" />
                  <p className="text-sm font-inter">No media uploaded yet</p>
                </div>
              )}

              {/* Upload New Image */}
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="adminMediaUpload" />
                <label htmlFor="adminMediaUpload"
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploading ? 'border-gold/40 bg-gold/5' : 'border-white/12 hover:border-gold/30 hover:bg-gold/3'}`}>
                  {uploading ? (
                    <>
                      <Loader2 className="w-6 h-6 text-gold animate-spin mb-1" />
                      <p className="text-xs text-gold font-inter">Uploading…</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-white/20 mb-1" />
                      <p className="text-xs text-white/40 font-inter font-semibold">Upload New Image</p>
                      <p className="text-[10px] text-white/20 font-inter mt-0.5">JPG, PNG, WebP · Max 5MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/8 flex-shrink-0">
          <button onClick={onClose} className="w-full py-2.5 border border-white/12 text-white/50 hover:text-white hover:border-gold/30 rounded-xl text-sm font-semibold transition-all font-inter">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Dialog ────────────────────────────────────────────────────────────

function ShopDialog({
  shop, type, onConfirm, onCancel, processing,
}: {
  shop: ShopRow; type: DialogType;
  onConfirm: (r?: string) => void;
  onCancel: () => void; processing: boolean;
}) {
  const [reason, setReason] = useState('');

  const cfg = {
    approve: { title: 'Approve Shop', desc: 'The shop will go live and the owner can start receiving bookings.', icon: CheckCircle, accent: 'text-emerald-400', btnCls: 'bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0A]', lbl: 'Approve' },
    reject: { title: 'Reject Shop', desc: 'Provide a reason so the owner knows how to improve their listing.', icon: XCircle, accent: 'text-red-400', btnCls: 'bg-red-500 hover:bg-red-400 text-white', lbl: 'Reject' },
    suspend: { title: 'Suspend Shop', desc: 'The shop will be hidden from customers immediately.', icon: ShieldOff, accent: 'text-orange-400', btnCls: 'bg-orange-500 hover:bg-orange-400 text-[#0A0A0A]', lbl: 'Suspend' },
    unsuspend: { title: 'Unsuspend Shop', desc: 'The shop will be visible to customers again.', icon: ShieldCheck, accent: 'text-emerald-400', btnCls: 'bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0A]', lbl: 'Unsuspend' },
    delete: { title: 'Delete Shop', desc: 'Permanently delete this shop and all related data. Cannot be undone.', icon: Trash2, accent: 'text-red-400', btnCls: 'bg-red-600 hover:bg-red-500 text-white', lbl: 'Delete Permanently' },
    view: { title: 'Shop Details', desc: '', icon: Eye, accent: 'text-gold', btnCls: '', lbl: '' },
    manage: { title: '', desc: '', icon: Layers, accent: 'text-gold', btnCls: '', lbl: '' },
  }[type];

  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="bg-[#141414] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-white/8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
              <Icon className={`w-5 h-5 ${cfg.accent}`} />
            </div>
            <div>
              <h3 className="font-playfair font-bold text-white">{cfg.title}</h3>
              <p className={`text-xs font-semibold ${cfg.accent} font-inter`}>{shop.name}</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {type === 'view' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Shop Name', shop.name], ['Owner', shop.owner_name],
                  ['Email', shop.owner_email], ['Phone', shop.contact_phone || '—'],
                  ['City', shop.city], ['Category', shop.category || '—'],
                  ['Services', `${shop.services_count} services`], ['Bookings', shop.total_bookings],
                  ['Rating', `${Number(shop.average_rating || 0).toFixed(1)} ★ (${shop.total_reviews})`],
                  ['Hours', `${shop.opening_time || '—'}–${shop.closing_time || '—'}`],
                  ['Weekly Off', shop.weekly_off || '—'], ['Joined', fd(shop.created_at)],
                ].map(([k, v]) => (
                  <div key={String(k)} className="p-3 bg-white/4 border border-white/8 rounded-xl">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5 font-inter">{k}</p>
                    <p className="text-white text-sm font-medium truncate font-inter">{v}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-white/4 border border-white/8 rounded-xl">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5 font-inter">Address</p>
                <p className="text-white text-sm font-inter">{shop.address}</p>
              </div>
              {shop.gst_number && (
                <div className="p-3 bg-white/4 border border-white/8 rounded-xl">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5 font-inter">GST / License</p>
                  <p className="text-white text-sm font-mono">{shop.gst_number}</p>
                </div>
              )}
              {shop.reject_reason && (
                <div className="p-3 bg-red-400/8 border border-red-400/20 rounded-xl">
                  <p className="text-[10px] text-red-400 uppercase tracking-wider mb-0.5 font-inter">Rejection Reason</p>
                  <p className="text-red-300 text-sm font-inter">{shop.reject_reason}</p>
                </div>
              )}
              <div className="flex items-center gap-2"><p className="text-xs text-white/30 font-inter">Status:</p><ShopBadge status={shop.status} /></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-white/4 border border-white/8 rounded-xl">
                <div className="w-9 h-9 bg-gold/10 rounded-xl flex items-center justify-center text-gold font-bold font-playfair">{shop.name.charAt(0)}</div>
                <div>
                  <p className="text-white font-semibold text-sm font-inter">{shop.name}</p>
                  <p className="text-white/30 text-xs font-inter">{shop.city} · {shop.owner_email}</p>
                </div>
              </div>
              {cfg.desc && <p className="text-white/50 text-sm leading-relaxed font-inter">{cfg.desc}</p>}
              {(type === 'reject' || type === 'suspend') && (
                <div>
                  <label className="text-xs text-white/40 font-medium block mb-1.5 font-inter">
                    {type === 'reject' ? 'Rejection Reason *' : 'Suspension Reason (optional)'}
                  </label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                    placeholder={type === 'reject' ? 'e.g., Incomplete shop photos, invalid license…' : 'e.g., Policy violation, complaints received…'}
                    className="w-full px-3 py-2.5 text-sm bg-[#0A0A0A] border border-white/12 focus:border-gold/40 rounded-xl text-white placeholder-white/20 outline-none resize-none font-inter" />
                </div>
              )}
              {type === 'delete' && (
                <div className="flex items-start gap-2 p-3 bg-red-400/8 border border-red-400/20 rounded-xl text-xs text-red-300 font-inter">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Permanently deletes the shop, services, bookings, reviews, and all media. Cannot be undone.</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-5 border-t border-white/8 flex gap-3">
          <button onClick={onCancel} disabled={processing}
            className="flex-1 py-2.5 rounded-xl border border-white/12 text-white/50 hover:border-gold/30 hover:text-white transition-all text-sm font-semibold font-inter disabled:opacity-40">
            {type === 'view' ? 'Close' : 'Cancel'}
          </button>
          {type !== 'view' && (
            <button onClick={() => { if (type === 'reject' && !reason.trim()) return; onConfirm(reason || undefined); }}
              disabled={processing || (type === 'reject' && !reason.trim())}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2 font-inter ${cfg.btnCls}`}>
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</> : cfg.lbl}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#141414] border border-gold/20 rounded-xl p-3 text-xs shadow-lg">
      <p className="font-playfair font-semibold text-white mb-1">{label}</p>
      {payload.map((e: any) => (
        <p key={e.dataKey} className="font-inter" style={{ color: e.color }}>
          {e.dataKey === 'revenue' ? fc(e.value) : `${e.value} bookings`}
        </p>
      ))}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center">
        <Icon className="w-4 h-4 text-gold" />
      </div>
      <div>
        <h3 className="font-playfair font-semibold text-white text-lg leading-none">{title}</h3>
        {sub && <p className="text-xs text-white/30 mt-0.5 font-inter">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Platform Settings Tab ────────────────────────────────────────────────────

function PlatformSettingsPanel() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase.from('platform_settings').select('*').limit(1).single();
    setSettings(data);
    setLoading(false);
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: 'Max 2MB for logo', variant: 'destructive' }); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      let logo_url = settings.logo_url;

      // Upload logo if changed
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `platform/logo.${ext}`;
        const { data: upData, error: upErr } = await supabase.storage.from('shop-media').upload(path, logoFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('shop-media').getPublicUrl(upData.path);
        logo_url = urlData.publicUrl;
      }

      const { error } = await supabase.from('platform_settings')
        .update({ ...settings, logo_url, updated_at: new Date().toISOString() })
        .eq('id', settings.id);

      if (error) throw error;
      await loadSettings();
      setLogoFile(null);
      setLogoPreview(null);
      toast({ title: 'Settings saved successfully' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full px-4 py-3 text-sm bg-[#0A0A0A] border border-white/12 focus:border-gold/40 text-white placeholder-white/20 rounded-xl outline-none transition-all font-inter';
  const labelCls = 'text-white/50 text-xs font-semibold tracking-wider uppercase mb-2 block font-inter';

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-gold" />
    </div>
  );

  if (!settings) return (
    <div className="text-center py-20 text-white/20 font-inter">Settings not found</div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Branding */}
      <div className="nexora-card rounded-2xl p-6">
        <SectionHeader icon={Globe} title="Website Branding" sub="Name, logo, and key messages shown to users" />

        {/* Logo */}
        <div className="mb-6">
          <label className={labelCls}>Website Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#0A0A0A] border-2 border-white/12 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoPreview || settings.logo_url ? (
                <img src={logoPreview || settings.logo_url!} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-2xl font-playfair font-bold text-gold">
                  {settings.site_name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" id="logoUpload" />
              <label htmlFor="logoUpload"
                className="flex items-center gap-2 px-4 py-2.5 border border-white/12 hover:border-gold/40 text-white/50 hover:text-gold rounded-xl text-xs font-semibold cursor-pointer transition-all font-inter w-fit">
                <Upload className="w-3.5 h-3.5" />
                {logoFile ? logoFile.name : 'Upload Logo Image'}
              </label>
              {settings.logo_url && (
                <div className="flex items-center gap-2 mt-2">
                  <Link className="w-3 h-3 text-white/20" />
                  <span className="text-white/20 text-[10px] font-inter truncate max-w-xs">Current: {settings.logo_url}</span>
                </div>
              )}
              <p className="text-white/20 text-[10px] mt-1.5 font-inter">JPG, PNG, WebP · Max 2MB · Recommended 200×200px</p>
              {logoFile && (
                <button onClick={() => { setLogoFile(null); setLogoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="text-red-400 text-[10px] hover:underline mt-1 font-inter">Remove</button>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Website / Brand Name *</label>
            <input value={settings.site_name} onChange={e => setSettings(p => p ? { ...p, site_name: e.target.value } : p)}
              className={inputCls} placeholder="e.g., Nexora Salonos" />
          </div>
          <div>
            <label className={labelCls}>Tagline *</label>
            <input value={settings.site_tagline} onChange={e => setSettings(p => p ? { ...p, site_tagline: e.target.value } : p)}
              className={inputCls} placeholder="e.g., Where Style Meets Luxury" />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelCls}>Site Description</label>
          <textarea value={settings.site_description || ''} onChange={e => setSettings(p => p ? { ...p, site_description: e.target.value } : p)}
            rows={3} className={`${inputCls} resize-none`} placeholder="Short description shown in search results and hero section" />
        </div>
      </div>

      {/* Contact */}
      <div className="nexora-card rounded-2xl p-6">
        <SectionHeader icon={Phone} title="Contact Information" sub="Displayed in footer and About page" />
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}><Mail className="w-3 h-3 inline mr-1" />Contact Email</label>
            <input type="email" value={settings.contact_email} onChange={e => setSettings(p => p ? { ...p, contact_email: e.target.value } : p)}
              className={inputCls} placeholder="hello@yourdomain.com" />
          </div>
          <div>
            <label className={labelCls}><Phone className="w-3 h-3 inline mr-1" />Contact Phone</label>
            <input value={settings.contact_phone || ''} onChange={e => setSettings(p => p ? { ...p, contact_phone: e.target.value } : p)}
              className={inputCls} placeholder="+91 98765 43210" />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="nexora-card rounded-2xl p-6">
        <SectionHeader icon={Link} title="Social Media Links" sub="Links shown in footer" />
        <div className="space-y-3">
          {[
            { key: 'instagram_url', label: 'Instagram URL', icon: Instagram, placeholder: 'https://instagram.com/yourprofile' },
            { key: 'facebook_url', label: 'Facebook URL', icon: Facebook, placeholder: 'https://facebook.com/yourpage' },
            { key: 'twitter_url', label: 'Twitter / X URL', icon: Twitter, placeholder: 'https://twitter.com/yourhandle' },
          ].map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key} className="relative">
              <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                value={(settings as any)[key] || ''}
                onChange={e => setSettings(p => p ? { ...p, [key]: e.target.value } : p)}
                className={`${inputCls} pl-10`}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Platform Config */}
      <div className="nexora-card rounded-2xl p-6">
        <SectionHeader icon={Percent} title="Platform Configuration" sub="Commission and withdrawal settings" />
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Commission Percent (%)</label>
            <input type="number" min="0" max="100"
              value={settings.commission_percent}
              onChange={e => setSettings(p => p ? { ...p, commission_percent: parseInt(e.target.value) || 0 } : p)}
              className={inputCls} />
            <p className="text-white/20 text-xs mt-1 font-inter">Taken from each completed booking's total amount</p>
          </div>
          <div>
            <label className={labelCls}>Minimum Withdrawal (₹)</label>
            <input type="number" min="0"
              value={settings.min_withdrawal}
              onChange={e => setSettings(p => p ? { ...p, min_withdrawal: parseInt(e.target.value) || 0 } : p)}
              className={inputCls} />
            <p className="text-white/20 text-xs mt-1 font-inter">Minimum amount shop owners can withdraw</p>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold rounded-xl shadow-gold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-inter text-sm">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save All Changes</>}
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const PER_PAGE = 10;

export default function AdminDashboard() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [shopFilter, setShopFilter] = useState<ShopStatusFilter>('all');
  const [shopSearch, setShopSearch] = useState('');
  const [shopPage, setShopPage] = useState(1);
  const [shopSort, setShopSort] = useState<{ key: keyof ShopRow; dir: 'asc' | 'desc' }>({ key: 'created_at', dir: 'desc' });

  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatus, setBookingStatus] = useState('all');
  const [bookingPage, setBookingPage] = useState(1);

  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);

  const [dialog, setDialog] = useState<{ shop: ShopRow; type: DialogType } | null>(null);
  const [dialogProcessing, setDialogProcessing] = useState(false);
  const [manageShop, setManageShop] = useState<ShopRow | null>(null);

  const [chartData, setChartData] = useState<any[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadStats(), loadShops(), loadBookings(), loadUsers()]);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Admin load error:', err);
      toast({ title: 'Load Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, []);

  async function loadStats() {
    const [shopsRes, bookingsRes, usersRes] = await Promise.all([
      supabase.from('shops').select('id,status'),
      supabase.from('bookings').select('id,status,total_amount,created_at'),
      supabase.from('user_profiles').select('id,role'),
    ]);
    const shopData = shopsRes.data || [];
    const bookData = bookingsRes.data || [];
    const userData = usersRes.data || [];

    const byStatus: Record<string, number> = {};
    let completedAmt = 0;
    for (const b of bookData) {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
      if (b.status === 'completed') completedAmt += b.total_amount || 0;
    }

    setStats({
      totalShops: shopData.length,
      approvedShops: shopData.filter(s => s.status === 'approved').length,
      pendingShops: shopData.filter(s => s.status === 'pending').length,
      rejectedShops: shopData.filter(s => s.status === 'rejected').length,
      suspendedShops: shopData.filter(s => s.status === 'suspended').length,
      totalBookings: bookData.length,
      bookingsByStatus: byStatus,
      platformRevenue: Math.floor(completedAmt * 0.1),
      totalTransactedAmount: completedAmt,
      completedBookingsAmount: completedAmt,
      totalUsers: userData.length,
    });

    const days: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const day = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const dayBooks = bookData.filter((b: any) => b.created_at?.startsWith(ds));
      const completed = dayBooks.filter((b: any) => b.status === 'completed');
      days.push({ day, bookings: dayBooks.length, revenue: completed.reduce((s: number, b: any) => s + (b.total_amount || 0) * 0.1, 0) });
    }
    setChartData(days);
  }

  async function loadShops() {
    const { data, error } = await supabase
      .from('shops')
      .select(`id,name,city,status,total_bookings,average_rating,total_reviews,
        home_service_available,created_at,category,gst_number,reject_reason,
        address,contact_phone,opening_time,closing_time,weekly_off,
        services(id),
        user_profiles!shops_owner_id_fkey(email,username)`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    setShops((data || []).map((s: any) => ({
      id: s.id, name: s.name, city: s.city, status: s.status,
      category: s.category || null, contact_phone: s.contact_phone || null,
      total_bookings: s.total_bookings || 0, average_rating: s.average_rating || 0,
      total_reviews: s.total_reviews || 0,
      owner_email: s.user_profiles?.email || '—',
      owner_name: s.user_profiles?.username || '—',
      created_at: s.created_at, home_service_available: s.home_service_available || false,
      services_count: s.services?.length || 0, gst_number: s.gst_number || null,
      reject_reason: s.reject_reason || null, address: s.address || '',
      opening_time: s.opening_time || '', closing_time: s.closing_time || '',
      weekly_off: s.weekly_off || '',
    })));
  }

  async function loadBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('id,customer_name,customer_email,status,total_amount,created_at,requested_date,service_type,shops!bookings_shop_id_fkey(name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    setBookings((data || []).map((b: any) => ({
      id: b.id, shop_name: b.shops?.name || '—',
      customer_name: b.customer_name, customer_email: b.customer_email,
      status: b.status, total_amount: b.total_amount || 0,
      created_at: b.created_at, requested_date: b.requested_date,
      service_type: b.service_type,
    })));
  }

  async function loadUsers() {
    const { data, error } = await supabase.from('user_profiles').select('id,email,username,role,phone,created_at').order('created_at', { ascending: false });
    if (error) throw error;
    setUsers(data || []);
  }

  async function handleDialogConfirm(reason?: string) {
    if (!dialog) return;
    const { shop, type } = dialog;
    setDialogProcessing(true);
    try {
      if (type === 'delete') {
        const { error } = await supabase.from('shops').delete().eq('id', shop.id);
        if (error) throw error;
        toast({ title: 'Shop Deleted' });
      } else {
        const statusMap: Record<string, string> = { approve: 'approved', reject: 'rejected', suspend: 'suspended', unsuspend: 'approved' };
        const upd: any = { status: statusMap[type] };
        if (type === 'reject') upd.reject_reason = reason || null;
        if (type === 'suspend' && reason) upd.reject_reason = reason;
        if (type === 'approve' || type === 'unsuspend') upd.reject_reason = null;
        const { error } = await supabase.from('shops').update(upd).eq('id', shop.id);
        if (error) throw error;
        toast({ title: `Shop ${type.charAt(0).toUpperCase() + type.slice(1)}d successfully` });
      }
      setDialog(null);
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setDialogProcessing(false); }
  }

  const filteredShops = useMemo(() => {
    let list = shopFilter === 'all' ? shops : shops.filter(s => s.status === shopFilter);
    if (shopSearch.trim()) {
      const q = shopSearch.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) ||
        s.owner_email.toLowerCase().includes(q) || s.owner_name.toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const av = a[shopSort.key] as any, bv = b[shopSort.key] as any;
      return shopSort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }, [shops, shopFilter, shopSearch, shopSort]);

  const filteredBookings = useMemo(() => {
    let list = bookingStatus === 'all' ? bookings : bookings.filter(b => b.status === bookingStatus);
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase();
      list = list.filter(b => b.customer_name.toLowerCase().includes(q) || b.shop_name.toLowerCase().includes(q) || b.customer_email.toLowerCase().includes(q));
    }
    return list;
  }, [bookings, bookingStatus, bookingSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(u => u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
  }, [users, userSearch]);

  function toggleSort(key: keyof ShopRow) {
    setShopSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
    setShopPage(1);
  }

  const shopPages = Math.max(1, Math.ceil(filteredShops.length / PER_PAGE));
  const pagedShops = filteredShops.slice((shopPage - 1) * PER_PAGE, shopPage * PER_PAGE);
  const bookingPages = Math.max(1, Math.ceil(filteredBookings.length / PER_PAGE));
  const pagedBookings = filteredBookings.slice((bookingPage - 1) * PER_PAGE, bookingPage * PER_PAGE);
  const userPages = Math.max(1, Math.ceil(filteredUsers.length / PER_PAGE));
  const pagedUsers = filteredUsers.slice((userPage - 1) * PER_PAGE, userPage * PER_PAGE);

  const PIE_COLORS = ['#10b981', '#D4AF37', '#ef4444', '#f97316'];
  const pieData = [
    { name: 'Approved', value: stats?.approvedShops || 0 },
    { name: 'Pending', value: stats?.pendingShops || 0 },
    { name: 'Rejected', value: stats?.rejectedShops || 0 },
    { name: 'Suspended', value: stats?.suspendedShops || 0 },
  ].filter(d => d.value > 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-14 h-14 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center mb-4">
        <Loader2 className="w-7 h-7 animate-spin text-gold" />
      </div>
      <p className="text-white/30 font-inter text-sm">Loading platform data…</p>
    </div>
  );

  const bs = stats?.bookingsByStatus || {};

  return (
    <div className="space-y-6">
      {/* Dialogs */}
      {dialog && dialog.type !== 'manage' && (
        <ShopDialog shop={dialog.shop} type={dialog.type} onConfirm={handleDialogConfirm} onCancel={() => setDialog(null)} processing={dialogProcessing} />
      )}
      {manageShop && <ShopManageModal shop={manageShop} onClose={() => setManageShop(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="gold-divider w-8 mb-3" />
          <h1 className="font-playfair font-bold text-white text-2xl">Platform Overview</h1>
          <p className="text-white/25 text-xs font-inter mt-0.5">
            Last updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>
        <button onClick={loadAll}
          className="flex items-center gap-2 text-xs font-semibold text-white/40 hover:text-gold border border-white/12 hover:border-gold/30 px-3 py-2 rounded-xl transition-all font-inter">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Pending Alert */}
      {(stats?.pendingShops ?? 0) > 0 && (
        <div className="flex items-center justify-between p-4 bg-gold/8 border border-gold/20 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-gold" />
            <div>
              <p className="font-playfair font-semibold text-white">{stats?.pendingShops} shop{stats!.pendingShops !== 1 ? 's' : ''} awaiting approval</p>
              <p className="text-xs text-white/35 font-inter">Review and approve or reject from the Shops tab</p>
            </div>
          </div>
          <button onClick={() => { setActiveTab('shops'); setShopFilter('pending'); }}
            className="text-xs font-bold text-[#0A0A0A] bg-gold hover:bg-gold-light px-3 py-2 rounded-xl transition-all shadow-gold flex items-center gap-1 font-inter">
            Review <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#141414] rounded-xl p-1 border border-white/8 flex-wrap">
        {([
          { key: 'overview', label: 'Overview', icon: BarChart2 },
          { key: 'shops', label: 'Shops', icon: Store, count: stats?.pendingShops },
          { key: 'bookings', label: 'Bookings', icon: BookOpen },
          { key: 'users', label: 'Users', icon: Users },
          { key: 'settings', label: 'Settings', icon: Settings },
        ] as const).map(({ key, label, icon: Icon, count }: any) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all font-inter ${activeTab === key ? 'bg-gold text-[#0A0A0A] shadow-gold' : 'text-white/40 hover:text-white'}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
            {count ? <span className={`px-1.5 rounded-full text-[9px] font-bold ${activeTab === key ? 'bg-[#0A0A0A]/20' : 'bg-amber-500 text-white'}`}>{count}</span> : null}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW TAB ══════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Shops" value={stats?.totalShops ?? 0} sub={`${stats?.approvedShops} live`} icon={Store} accent="border-gold/20 bg-gold/5" />
            <StatCard label="Total Bookings" value={stats?.totalBookings ?? 0} sub={`${bs.completed || 0} completed`} icon={BookOpen} accent="border-emerald-400/20 bg-emerald-400/5" />
            <StatCard label="Platform Revenue" value={fc(stats?.platformRevenue ?? 0)} sub="10% commission" icon={IndianRupee} accent="border-gold/20 bg-gold/5" />
            <StatCard label="Registered Users" value={stats?.totalUsers ?? 0} sub="Owners & admins" icon={Users} accent="border-blue-400/20 bg-blue-400/5" />
          </div>

          <div className="nexora-card rounded-2xl p-6">
            <SectionHeader icon={Activity} title="Booking Status Breakdown" sub="All shops · All time" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map(status => {
                const cfg = BOOKING_STATUS[status];
                const count = bs[status] || 0;
                const pct = stats?.totalBookings ? Math.round(count / stats.totalBookings * 100) : 0;
                return (
                  <div key={status} className={`p-4 rounded-xl border ${cfg.ring}`}>
                    <p className={`text-2xl font-bold mb-0.5 ${cfg.color}`}>{count}</p>
                    <p className="text-xs text-white/50 font-inter mb-2">{cfg.label}</p>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cfg.color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className={`text-[10px] mt-1 font-inter ${cfg.color}`}>{pct}%</p>
                  </div>
                );
              })}
              <div className="p-4 rounded-xl border border-white/8 bg-white/3">
                <p className="text-2xl font-bold text-gold mb-0.5">{stats?.totalBookings || 0}</p>
                <p className="text-xs text-white/50 font-inter mb-2">Total</p>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gold rounded-full w-full" /></div>
                <p className="text-[10px] text-gold mt-1 font-inter">100%</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="nexora-card rounded-2xl p-6 lg:col-span-2">
              <SectionHeader icon={TrendingUp} title="7-Day Activity" sub="Bookings and platform revenue" />
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="book" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} fill="url(#book)" dot={{ r: 3, fill: '#10b981' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#rev)" dot={{ r: 3, fill: '#D4AF37' }} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-5 mt-3">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400" /><span className="text-xs text-white/40 font-inter">Bookings</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gold" /><span className="text-xs text-white/40 font-inter">Revenue (₹)</span></div>
              </div>
            </div>

            <div className="nexora-card rounded-2xl p-6">
              <SectionHeader icon={Store} title="Shop Status" />
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#141414', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} /><span className="text-white/50 font-inter">{d.name}</span></div>
                        <span className="font-bold text-white font-inter">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-white/20">
                  <Store className="w-8 h-8 mb-2" /><p className="text-xs font-inter">No shops yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="nexora-card rounded-2xl p-6">
            <SectionHeader icon={Percent} title="Revenue Summary" sub="10% platform commission on completed bookings" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Transacted', value: `₹${(stats?.completedBookingsAmount ?? 0).toLocaleString('en-IN')}`, color: 'text-white' },
                { label: 'Platform Revenue (10%)', value: `₹${(stats?.platformRevenue ?? 0).toLocaleString('en-IN')}`, color: 'text-gold' },
                { label: 'Paid to Shops (90%)', value: `₹${Math.floor((stats?.completedBookingsAmount ?? 0) * 0.9).toLocaleString('en-IN')}`, color: 'text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-5 bg-white/3 border border-white/8 rounded-2xl">
                  <p className="text-xs text-white/30 font-inter mb-2">{label}</p>
                  <p className={`text-2xl font-bold font-inter ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ SHOPS TAB ══════════════ */}
      {activeTab === 'shops' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
              <input value={shopSearch} onChange={e => { setShopSearch(e.target.value); setShopPage(1); }}
                placeholder="Search shops, owners, cities…"
                className="w-full h-9 pl-9 pr-3 text-xs bg-[#141414] border border-white/12 focus:border-gold/40 text-white placeholder-white/20 rounded-xl outline-none font-inter" />
            </div>
            <div className="flex gap-1 bg-[#141414] rounded-xl p-1 border border-white/8 flex-wrap">
              {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map(f => (
                <button key={f} onClick={() => { setShopFilter(f); setShopPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all font-inter whitespace-nowrap ${shopFilter === f ? 'bg-gold text-[#0A0A0A]' : 'text-white/40 hover:text-white'}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === 'pending' && (stats?.pendingShops ?? 0) > 0 && <span className="ml-1 px-1 rounded-full text-[9px] bg-amber-500 text-white">{stats?.pendingShops}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="nexora-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/8">
                    {[{ k: 'name', l: 'Shop' }, { k: 'city', l: 'City' }, { k: 'status', l: 'Status' }, { k: 'total_bookings', l: 'Bookings' }, { k: 'average_rating', l: 'Rating' }, { k: 'created_at', l: 'Joined' }].map(({ k, l }) => (
                      <th key={k} onClick={() => toggleSort(k as keyof ShopRow)}
                        className="text-left px-4 py-3.5 text-white/25 font-semibold uppercase tracking-wider cursor-pointer hover:text-gold transition-colors select-none">
                        <div className="flex items-center gap-1">
                          {l}
                          {shopSort.key === k ? (shopSort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-gold" /> : <ChevronDown className="w-3 h-3 text-gold" />) : <ChevronUp className="w-3 h-3 opacity-20" />}
                        </div>
                      </th>
                    ))}
                    <th className="text-left px-4 py-3.5 text-white/25 font-semibold uppercase tracking-wider">Owner</th>
                    <th className="text-left px-4 py-3.5 text-white/25 font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pagedShops.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-16 text-center text-white/20">
                      <Store className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="font-inter">{shopSearch ? 'No shops match your search' : 'No shops found'}</p>
                    </td></tr>
                  ) : pagedShops.map(shop => (
                    <tr key={shop.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-gold text-xs font-bold font-playfair">{shop.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-white font-semibold font-inter">{shop.name}</p>
                            {shop.home_service_available && <span className="text-[10px] text-gold/60">Home Service</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-white/50 font-inter">{shop.city}</td>
                      <td className="px-4 py-4"><ShopBadge status={shop.status} /></td>
                      <td className="px-4 py-4 text-white font-bold font-inter">{shop.total_bookings}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3 h-3 fill-gold text-gold" />
                          <span className="text-gold font-bold font-inter">{Number(shop.average_rating || 0).toFixed(1)}</span>
                          <span className="text-white/20 font-inter">({shop.total_reviews})</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-white/35 font-inter">{fd(shop.created_at)}</td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-white/60 font-semibold font-inter">{shop.owner_name}</p>
                          <p className="text-white/25 truncate max-w-[130px] font-inter">{shop.owner_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setDialog({ shop, type: 'view' })} title="View Details"
                            className="w-7 h-7 bg-white/5 text-white/40 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg flex items-center justify-center transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Manage Services & Media */}
                          <button onClick={() => setManageShop(shop)} title="Manage Services & Media"
                            className="w-7 h-7 bg-white/5 text-white/40 hover:text-gold hover:bg-gold/10 rounded-lg flex items-center justify-center transition-colors">
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                          {(shop.status === 'pending' || shop.status === 'rejected') && (
                            <button onClick={() => setDialog({ shop, type: 'approve' })} title="Approve"
                              className="w-7 h-7 bg-white/5 text-white/40 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg flex items-center justify-center transition-colors">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {shop.status === 'pending' && (
                            <button onClick={() => setDialog({ shop, type: 'reject' })} title="Reject"
                              className="w-7 h-7 bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg flex items-center justify-center transition-colors">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {shop.status === 'approved' && (
                            <button onClick={() => setDialog({ shop, type: 'suspend' })} title="Suspend"
                              className="w-7 h-7 bg-white/5 text-white/40 hover:text-orange-400 hover:bg-orange-400/10 rounded-lg flex items-center justify-center transition-colors">
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {shop.status === 'suspended' && (
                            <button onClick={() => setDialog({ shop, type: 'unsuspend' })} title="Unsuspend"
                              className="w-7 h-7 bg-white/5 text-white/40 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg flex items-center justify-center transition-colors">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => setDialog({ shop, type: 'delete' })} title="Delete"
                            className="w-7 h-7 bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg flex items-center justify-center transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-white/8 flex items-center justify-between">
              <p className="text-xs text-white/25 font-inter">{filteredShops.length} shops · page {shopPage}/{shopPages}</p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setShopPage(p => Math.max(1, p - 1))} disabled={shopPage === 1}
                  className="w-7 h-7 bg-white/5 text-white/40 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-white/40 font-inter px-2">{shopPage}/{shopPages}</span>
                <button onClick={() => setShopPage(p => Math.min(shopPages, p + 1))} disabled={shopPage === shopPages}
                  className="w-7 h-7 bg-white/5 text-white/40 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ BOOKINGS TAB ══════════════ */}
      {activeTab === 'bookings' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
              <input value={bookingSearch} onChange={e => { setBookingSearch(e.target.value); setBookingPage(1); }}
                placeholder="Search by customer, shop…"
                className="w-full h-9 pl-9 pr-3 text-xs bg-[#141414] border border-white/12 focus:border-gold/40 text-white placeholder-white/20 rounded-xl outline-none font-inter" />
            </div>
            <div className="flex gap-1 bg-[#141414] rounded-xl p-1 border border-white/8 flex-wrap">
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
                <button key={s} onClick={() => { setBookingStatus(s); setBookingPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all font-inter ${bookingStatus === s ? 'bg-gold text-[#0A0A0A]' : 'text-white/40 hover:text-white'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="nexora-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/8">
                    {['Customer', 'Shop', 'Service Type', 'Date', 'Amount', 'Status', 'Created'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-white/25 font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pagedBookings.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-16 text-center text-white/20 font-inter">No bookings found</td></tr>
                  ) : pagedBookings.map(b => (
                    <tr key={b.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-white font-semibold font-inter">{b.customer_name}</p>
                        <p className="text-white/25 truncate max-w-[140px] font-inter">{b.customer_email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-white/60 font-inter">{b.shop_name}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${b.service_type === 'home' ? 'bg-gold/15 border-gold/30 text-gold' : 'bg-white/8 border-white/12 text-white/60'}`}>
                          {b.service_type === 'home' ? <Home className="w-2.5 h-2.5" /> : <Scissors className="w-2.5 h-2.5" />}
                          {b.service_type === 'home' ? 'Home' : 'In-Shop'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-white/50 font-inter">{b.requested_date}</td>
                      <td className="px-4 py-3.5 text-gold font-bold font-inter">₹{b.total_amount}</td>
                      <td className="px-4 py-3.5"><BookingBadge status={b.status} /></td>
                      <td className="px-4 py-3.5 text-white/25 font-inter">{fd(b.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-white/8 flex items-center justify-between">
              <p className="text-xs text-white/25 font-inter">{filteredBookings.length} bookings</p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setBookingPage(p => Math.max(1, p - 1))} disabled={bookingPage === 1}
                  className="w-7 h-7 bg-white/5 text-white/40 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-white/40 px-2 font-inter">{bookingPage}/{bookingPages}</span>
                <button onClick={() => setBookingPage(p => Math.min(bookingPages, p + 1))} disabled={bookingPage === bookingPages}
                  className="w-7 h-7 bg-white/5 text-white/40 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ USERS TAB ══════════════ */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
              placeholder="Search users by name or email…"
              className="w-full h-9 pl-9 pr-3 text-xs bg-[#141414] border border-white/12 focus:border-gold/40 text-white placeholder-white/20 rounded-xl outline-none font-inter" />
          </div>
          <div className="nexora-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/8">
                    {['User', 'Role', 'Phone', 'Joined'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-white/25 font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pagedUsers.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-16 text-center text-white/20 font-inter">No users found</td></tr>
                  ) : pagedUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white/60 text-xs font-bold font-playfair">{u.username?.charAt(0)?.toUpperCase() || 'U'}</span>
                          </div>
                          <div>
                            <p className="text-white font-semibold font-inter">{u.username}</p>
                            <p className="text-white/30 font-inter">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${u.role === 'admin' ? 'bg-gold/15 border-gold/30 text-gold' : u.role === 'owner' ? 'bg-blue-400/15 border-blue-400/30 text-blue-400' : 'bg-white/8 border-white/12 text-white/50'}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3.5 text-white/40 font-inter">{u.phone || '—'}</td>
                      <td className="px-4 py-3.5 text-white/30 font-inter">{fd(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-white/8 flex items-center justify-between">
              <p className="text-xs text-white/25 font-inter">{filteredUsers.length} users</p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}
                  className="w-7 h-7 bg-white/5 text-white/40 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-white/40 px-2 font-inter">{userPage}/{userPages}</span>
                <button onClick={() => setUserPage(p => Math.min(userPages, p + 1))} disabled={userPage === userPages}
                  className="w-7 h-7 bg-white/5 text-white/40 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ SETTINGS TAB ══════════════ */}
      {activeTab === 'settings' && <PlatformSettingsPanel />}
    </div>
  );
}
