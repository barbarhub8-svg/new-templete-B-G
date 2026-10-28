import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, User, Store, Scissors, Home, Upload, Check,
  MapPin, Clock, IndianRupee, ImageIcon, Video, AlertCircle, CheckCircle,
  FileText, Phone, Tag, X, Sparkles
} from 'lucide-react';
import GmailOtpVerification from '../../components/forms/GmailOtpVerification';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';
import { signUp } from '../../lib/auth';
import { useAuthStore } from '../../stores/authStore';
import type { Service } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, name: 'Owner', icon: User },
  { id: 2, name: 'Shop', icon: Store },
  { id: 3, name: 'Services', icon: Scissors },
  { id: 4, name: 'Home', icon: Home },
  { id: 5, name: 'Media', icon: Upload },
  { id: 6, name: 'Review', icon: Check },
];

const SHOP_CATEGORIES = [
  'Nails Art Studio',
  'Barber Shop',
  'Unisex Salon',
  "Men's Salon",
  'Ladies Parlour',
  'Spa & Grooming',
  'Hair Studio',
  'Beauty & Grooming',
  'Other',
];

const DEDICATED_NAIL_SERVICES = [
  { id: 's-nail-1', name: 'Nail Art', emoji: '💅', price: 799, duration: 45, isNail: true },
  { id: 's-nail-2', name: 'Gel Extensions', emoji: '✨', price: 1999, duration: 75, isNail: true },
  { id: 's-nail-3', name: 'Russian Manicure', emoji: '👑', price: 1299, duration: 60, isNail: true },
  { id: 's-nail-4', name: 'Acrylic Extensions', emoji: '💎', price: 2499, duration: 90, isNail: true },
  { id: 's-nail-5', name: 'Chrome Glaze Finish', emoji: '🌟', price: 999, duration: 45, isNail: true },
  { id: 's-nail-6', name: 'Nail Spa & Cuticle Care', emoji: '🫧', price: 699, duration: 40, isNail: true },
];

const GENERAL_SERVICES = [
  { id: 's1', name: 'Hair Cut',   emoji: '✂️', price: 150, duration: 30, isNail: false },
  { id: 's2', name: 'Beard Trim', emoji: '🧔', price: 100, duration: 20, isNail: false },
  { id: 's3', name: 'Shaving',    emoji: '🪒', price: 80,  duration: 15, isNail: false },
  { id: 's4', name: 'Facial',     emoji: '✨', price: 300, duration: 45, isNail: false },
  { id: 's5', name: 'Massage',    emoji: '💆', price: 400, duration: 60, isNail: false },
  { id: 's6', name: 'Hair Color', emoji: '🎨', price: 800, duration: 90, isNail: false },
  { id: 's7', name: 'Hair Wash',  emoji: '🚿', price: 80,  duration: 20, isNail: false },
  { id: 's8', name: 'Keratin',    emoji: '💇', price: 2500,duration: 120, isNail: false },
];

const SERVICES_OPTIONS = [
  ...DEDICATED_NAIL_SERVICES,
  ...GENERAL_SERVICES,
];

const WEEKDAYS = ['None (Open All Days)','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// ─── Shared Input Style ───────────────────────────────────────────────────────

const inputCls =
  'w-full bg-[#0A0A0A] border border-white/12 focus:border-gold/50 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm font-inter outline-none transition-all';

const labelCls = 'text-white/50 text-xs font-semibold tracking-wider uppercase mb-2 block font-inter';

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between px-2">
      {STEPS.map((step, i) => {
        const StepIcon = step.icon;
        const done   = step.id < current;
        const active = step.id === current;
        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? 'bg-gold border-gold' :
                active ? 'bg-gold/20 border-gold ring-4 ring-gold/10' :
                         'bg-[#1E1E1E] border-white/15'
              }`}>
                {done
                  ? <Check className="w-4 h-4 text-[#0A0A0A]" />
                  : <StepIcon className={`w-4 h-4 ${active ? 'text-gold' : 'text-white/25'}`} />}
              </div>
              <p className={`text-[9px] mt-1.5 hidden sm:block font-semibold font-inter whitespace-nowrap ${
                done ? 'text-gold' : active ? 'text-gold' : 'text-white/20'
              }`}>{step.name}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 -mt-4 sm:-mt-5 rounded transition-all ${
                done ? 'bg-gold' : 'bg-white/10'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Gold Divider ─────────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-px bg-white/8 my-5" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OwnerRegisterPage() {
  const navigate = useNavigate();
  const { toast }  = useToast();
  const { login }  = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting]   = useState(false);

  // Step 1
  const [ownerName,       setOwnerName]       = useState('');
  const [ownerEmail,      setOwnerEmail]      = useState('');
  const [ownerPhone,      setOwnerPhone]      = useState('');
  const [ownerPassword,   setOwnerPassword]   = useState('');
  const [ownerPhoto,      setOwnerPhoto]      = useState<File | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Step 2
  const [shopName,     setShopName]     = useState('');
  const [shopCategory, setShopCategory] = useState('');
  const [shopAddress,  setShopAddress]  = useState('');
  const [shopCity,     setShopCity]     = useState('');
  const [gstNumber,    setGstNumber]    = useState('');
  const [openingTime,  setOpeningTime]  = useState('');
  const [closingTime,  setClosingTime]  = useState('');
  const [weeklyOff,    setWeeklyOff]    = useState('');

  // Step 3
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [serviceTab,       setServiceTab]       = useState<'all' | 'nails' | 'general'>('all');
  const [customService,    setCustomService]    = useState({ name: '', price: '', duration: '' });
  const [editingService,   setEditingService]   = useState<string | null>(null);
  const [editPrice,        setEditPrice]        = useState('');
  const [editDuration,     setEditDuration]     = useState('');

  // Step 4
  const [homeServiceEnabled, setHomeServiceEnabled] = useState(false);
  const [homeServiceCharge,  setHomeServiceCharge]  = useState('');
  const [serviceRadius,      setServiceRadius]      = useState('');

  // Step 5
  const [shopPhotos, setShopPhotos] = useState<File[]>([]);
  const [shopVideo,  setShopVideo]  = useState<File | null>(null);

  // ─── Service Handlers ─────────────────────────────────────────────────────

  function toggleService(option: typeof SERVICES_OPTIONS[0]) {
    const exists = selectedServices.find((s) => s.id === option.id);
    if (exists) {
      setSelectedServices((prev) => prev.filter((s) => s.id !== option.id));
    } else {
      setSelectedServices((prev) => [
        ...prev,
        { id: option.id, name: option.name, price: option.price, duration: option.duration, icon: 'scissors' },
      ]);
      setEditingService(option.id);
      setEditPrice(String(option.price));
      setEditDuration(String(option.duration));
    }
  }

  function saveServiceEdit(id: string) {
    if (!editPrice || !editDuration) return;
    setSelectedServices((prev) =>
      prev.map((s) => s.id === id ? { ...s, price: parseInt(editPrice), duration: parseInt(editDuration) } : s)
    );
    setEditingService(null);
  }

  function addCustomService() {
    if (!customService.name || !customService.price || !customService.duration) {
      toast({ title: 'Incomplete', description: 'Fill all service fields', variant: 'destructive' }); return;
    }
    setSelectedServices((prev) => [
      ...prev,
      { id: 'custom-' + Date.now(), name: customService.name, price: parseInt(customService.price), duration: parseInt(customService.duration), icon: 'scissors' },
    ]);
    setCustomService({ name: '', price: '', duration: '' });
  }

  // ─── File Handlers ────────────────────────────────────────────────────────

  function handleOwnerPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: 'Too Large', description: 'Max 2MB', variant: 'destructive' }); return; }
    setOwnerPhoto(file);
  }

  function handleShopPhotosUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (shopPhotos.length + files.length > 5) { toast({ title: 'Max 5 Photos', variant: 'destructive' }); return; }
    if (files.some((f) => f.size > 2 * 1024 * 1024)) { toast({ title: 'Each photo max 2MB', variant: 'destructive' }); return; }
    setShopPhotos((prev) => [...prev, ...files]);
  }

  function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast({ title: 'Video max 10MB', variant: 'destructive' }); return; }
    setShopVideo(file);
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  function handleNext() {
    if (currentStep === 1) {
      if (!ownerName.trim()) return toast({ title: 'Required', description: 'Enter your full name', variant: 'destructive' });
      if (!isEmailVerified) return toast({ title: 'Required', description: 'Verify your email first', variant: 'destructive' });
      if (!ownerPassword || ownerPassword.length < 6) return toast({ title: 'Required', description: 'Password min 6 characters', variant: 'destructive' });
      if (!ownerPhoto) return toast({ title: 'Required', description: 'Upload your profile photo', variant: 'destructive' });
    }
    if (currentStep === 2) {
      const ot = openingTime.trim();
      const ct = closingTime.trim();
      if (!shopName.trim()) return toast({ title: 'Required', description: 'Enter shop name', variant: 'destructive' });
      if (!shopCategory) return toast({ title: 'Required', description: 'Select a category', variant: 'destructive' });
      if (!shopAddress.trim()) return toast({ title: 'Required', description: 'Enter shop address', variant: 'destructive' });
      if (!shopCity.trim()) return toast({ title: 'Required', description: 'Enter city', variant: 'destructive' });
      if (!ot) return toast({ title: 'Required', description: 'Set opening time', variant: 'destructive' });
      if (!ct) return toast({ title: 'Required', description: 'Set closing time', variant: 'destructive' });
      if (!weeklyOff) return toast({ title: 'Required', description: 'Select weekly off day', variant: 'destructive' });
    }
    if (currentStep === 3 && selectedServices.length === 0)
      return toast({ title: 'Required', description: 'Add at least one service', variant: 'destructive' });
    if (currentStep === 4 && homeServiceEnabled && (!homeServiceCharge || !serviceRadius))
      return toast({ title: 'Required', description: 'Fill home service charge and radius', variant: 'destructive' });
    if (currentStep === 5 && shopPhotos.length === 0)
      return toast({ title: 'Required', description: 'Upload at least one shop photo', variant: 'destructive' });
    if (currentStep === 6) { handleSubmit(); return; }
    setCurrentStep((p) => Math.min(p + 1, STEPS.length));
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const authData: any = await signUp(ownerEmail, ownerPassword, ownerName);
      const authUser = authData?.user || authData?.session?.user;
      if (!authUser?.id) throw new Error('Account creation failed.');

      let avatarUrl: string | undefined;
      if (ownerPhoto) {
        try {
          const ext = ownerPhoto.name.split('.').pop();
          const { data: ud, error: ue } = await supabase.storage
            .from('avatars').upload(`${authUser.id}/avatar.${ext}`, ownerPhoto, { upsert: true });
          if (!ue && ud) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(ud.path);
            avatarUrl = urlData.publicUrl;
          }
        } catch (e) { console.warn('Avatar upload failed:', e); }
      }

      try {
        await supabase.from('user_profiles').update({ username: ownerName, phone: ownerPhone || null, avatar_url: avatarUrl || null }).eq('id', authUser.id);
      } catch (e) { console.warn('Profile update failed:', e); }

      const { data: shopData, error: shopError } = await supabase.from('shops').insert({
        owner_id: authUser.id, name: shopName, address: shopAddress, city: shopCity,
        category: shopCategory, gst_number: gstNumber || null, opening_time: openingTime,
        closing_time: closingTime, weekly_off: weeklyOff, home_service_available: homeServiceEnabled,
        home_service_charge: homeServiceEnabled ? parseInt(homeServiceCharge) : 0,
        service_radius_km: homeServiceEnabled ? parseInt(serviceRadius) : 0,
        contact_phone: ownerPhone || null, status: 'pending',
      }).select().single();

      if (shopError) throw new Error(shopError.message || 'Failed to create shop.');

      if (selectedServices.length > 0) {
        try {
          await supabase.from('services').insert(
            selectedServices.map((svc) => ({ shop_id: shopData.id, name: svc.name, price: svc.price, duration_minutes: svc.duration, is_active: true }))
          );
        } catch (e) { console.warn('Services insert failed:', e); }
      }

      for (let i = 0; i < shopPhotos.length; i++) {
        try {
          const photo = shopPhotos[i];
          const ext = photo.name.split('.').pop();
          const path = `${authUser.id}/${shopData.id}/photo_${i}.${ext}`;
          const { data: pu, error: pe } = await supabase.storage.from('shop-media').upload(path, photo, { upsert: true });
          if (!pe && pu) {
            const { data: pu2 } = supabase.storage.from('shop-media').getPublicUrl(pu.path);
            await supabase.from('shop_media').insert({ shop_id: shopData.id, media_type: 'photo', media_url: pu2.publicUrl, display_order: i });
          }
        } catch (e) { console.warn(`Photo ${i} upload failed:`, e); }
      }

      if (shopVideo) {
        try {
          const ext = shopVideo.name.split('.').pop();
          const path = `${authUser.id}/${shopData.id}/video.${ext}`;
          const { data: vu, error: ve } = await supabase.storage.from('shop-media').upload(path, shopVideo, { upsert: true });
          if (!ve && vu) {
            const { data: vu2 } = supabase.storage.from('shop-media').getPublicUrl(vu.path);
            await supabase.from('shop_media').insert({ shop_id: shopData.id, media_type: 'video', media_url: vu2.publicUrl, display_order: 99 });
          }
        } catch (e) { console.warn('Video upload failed:', e); }
      }

      login({ id: authUser.id, name: ownerName, email: ownerEmail, phone: ownerPhone || '', role: 'owner', shopId: shopData.id, shopStatus: 'pending' });
      toast({ title: 'Registration Submitted!', description: 'Your shop is pending admin approval.' });
      navigate('/owner/pending-approval');

    } catch (err: any) {
      console.error('Registration error:', err);
      toast({ title: 'Registration Failed', description: err.message || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Step Renderers ───────────────────────────────────────────────────────

  function renderStep() {
    switch (currentStep) {

      /* ── Step 1: Owner Details ─────────────────────────────────────────── */
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-playfair font-bold text-white text-xl mb-1">Owner Details</h2>
              <p className="text-white/35 text-sm font-inter">Verify your email and create your account</p>
            </div>
            <Divider />

            {/* Email Verification */}
            {!isEmailVerified ? (
              <div className="nexora-card rounded-2xl p-5 border-gold/20">
                <p className={labelCls + ' text-gold/70 mb-3'}>Gmail Verification</p>
                <GmailOtpVerification
                  onVerified={(email) => { setOwnerEmail(email); setIsEmailVerified(true); }}
                  buttonText="Verify & Continue"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-emerald-400/8 border border-emerald-400/20 rounded-2xl">
                <div className="w-10 h-10 bg-emerald-400/15 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-emerald-300 font-inter">Email Verified</p>
                  <p className="text-xs text-emerald-400/60 font-inter truncate">{ownerEmail}</p>
                </div>
                <button onClick={() => { setIsEmailVerified(false); setOwnerEmail(''); }}
                  className="text-xs text-white/30 hover:text-white transition-colors font-inter">Change</button>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className={labelCls}>Full Name *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Your full name" disabled={!isEmailVerified}
                  className={inputCls + ' pl-10 disabled:opacity-40'} />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={labelCls}>Mobile Number <span className="text-white/20 normal-case">(optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="+91 98765 43210" type="tel" disabled={!isEmailVerified}
                  className={inputCls + ' pl-10 disabled:opacity-40'} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={labelCls}>Password *</label>
              <input type="password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="Min. 6 characters" disabled={!isEmailVerified}
                className={inputCls + ' disabled:opacity-40'} />
              <p className="text-white/20 text-xs mt-1.5 font-inter">This will be your login password</p>
            </div>

            {/* Profile Photo */}
            <div>
              <label className={labelCls}>Profile Photo *</label>
              {ownerPhoto ? (
                <div className="flex items-center gap-3 p-4 nexora-card rounded-2xl">
                  <img src={URL.createObjectURL(ownerPhoto)} alt="Owner"
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0 ring-2 ring-gold/30" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white font-inter truncate">{ownerPhoto.name}</p>
                    <p className="text-xs text-white/30 font-inter">{(ownerPhoto.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setOwnerPhoto(null)}
                    className="w-7 h-7 bg-red-400/15 text-red-400 rounded-full flex items-center justify-center hover:bg-red-400/25 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label htmlFor="ownerPhoto"
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/12 rounded-2xl cursor-pointer hover:border-gold/30 hover:bg-gold/3 transition-all">
                  <ImageIcon className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-sm font-medium text-white/50 font-inter">Upload Profile Photo</p>
                  <p className="text-xs text-white/20 mt-0.5 font-inter">JPG, PNG · Max 2MB</p>
                  <input id="ownerPhoto" type="file" accept="image/*" onChange={handleOwnerPhotoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>
        );

      /* ── Step 2: Shop Info ─────────────────────────────────────────────── */
      case 2:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-playfair font-bold text-white text-xl mb-1">Shop Information</h2>
              <p className="text-white/35 text-sm font-inter">Tell us about your shop</p>
            </div>
            <Divider />

            <div>
              <label className={labelCls}>Shop Name *</label>
              <div className="relative">
                <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input value={shopName} onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g., Elite Cuts & Grooming"
                  className={inputCls + ' pl-10'} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Category *</label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 z-10" />
                <select value={shopCategory} onChange={(e) => setShopCategory(e.target.value)}
                  className={inputCls + ' pl-10 cursor-pointer appearance-none'}>
                  <option value="" className="bg-[#141414]">Select category</option>
                  {SHOP_CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#141414]">{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Full Address *</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25" />
                <input value={shopAddress} onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="Shop number, street, landmark"
                  className={inputCls + ' pl-10'} />
              </div>
            </div>

            <div>
              <label className={labelCls}>City *</label>
              <input value={shopCity} onChange={(e) => setShopCity(e.target.value)}
                placeholder="Enter city name" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Opening Time *</label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    onBlur={(e) => setOpeningTime(e.target.value)}
                    className={inputCls + ' pl-10 [color-scheme:dark]'}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Closing Time *</label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    onBlur={(e) => setClosingTime(e.target.value)}
                    className={inputCls + ' pl-10 [color-scheme:dark]'}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Weekly Off *</label>
              <select value={weeklyOff} onChange={(e) => setWeeklyOff(e.target.value)}
                className={inputCls + ' cursor-pointer appearance-none'}>
                <option value="" className="bg-[#141414]">Select weekly off day</option>
                {WEEKDAYS.map((d) => <option key={d} value={d} className="bg-[#141414]">{d}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>GST / License <span className="text-white/20 normal-case">(optional)</span></label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  className={inputCls + ' pl-10 font-mono'} />
              </div>
              <p className="text-white/20 text-xs mt-1.5 font-inter">Helps build trust with customers</p>
            </div>
          </div>
        );

      /* ── Step 3: Services ──────────────────────────────────────────────── */
      case 3: {
        const displayedServices = SERVICES_OPTIONS.filter((opt) => {
          if (serviceTab === 'nails') return opt.isNail;
          if (serviceTab === 'general') return !opt.isNail;
          return true;
        });

        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-playfair font-bold text-white text-xl mb-1">Services Setup</h2>
              <p className="text-white/35 text-sm font-inter">Add services you offer with pricing</p>
            </div>
            <Divider />

            {/* Nails Art Studio Preset Banner */}
            {shopCategory.toLowerCase().includes('nail') && (
              <div className="p-4 rounded-xl bg-gold/10 border border-gold/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_24px_rgba(212,175,55,0.15)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-xl flex-shrink-0">
                    💅
                  </div>
                  <div>
                    <h4 className="text-white font-playfair font-bold text-sm">Nails Art Studio Mode</h4>
                    <p className="text-white/60 text-xs font-inter">
                      Add dedicated nail services (Nail Art, Gel Extensions, Russian Manicure, Acrylics) in one tap.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newServices = [...selectedServices];
                    DEDICATED_NAIL_SERVICES.forEach((item) => {
                      if (!newServices.some((s) => s.id === item.id || s.name.toLowerCase() === item.name.toLowerCase())) {
                        newServices.push({
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          duration: item.duration,
                          icon: 'scissors',
                        });
                      }
                    });
                    setSelectedServices(newServices);
                    toast({
                      title: 'Nail Services Added',
                      description: 'All 6 dedicated nail studio services have been added to your profile.',
                    });
                  }}
                  className="px-3.5 py-2 bg-gold hover:bg-gold-light text-[#0A0A0A] font-inter font-bold text-xs rounded-xl shadow-gold hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Quick Add All Nail Services
                </button>
              </div>
            )}

            {/* Quick Add Tabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls}>Quick Add Services</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setServiceTab('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-inter transition-all ${
                      serviceTab === 'all'
                        ? 'bg-gold text-[#0A0A0A] font-bold shadow-sm'
                        : 'bg-[#141414] text-white/50 hover:text-white border border-white/8'
                    }`}
                  >
                    All ({SERVICES_OPTIONS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceTab('nails')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-inter flex items-center gap-1 transition-all ${
                      serviceTab === 'nails'
                        ? 'bg-gold text-[#0A0A0A] font-bold shadow-sm'
                        : 'bg-gold/10 text-gold border border-gold/30 hover:border-gold/60'
                    }`}
                  >
                    <span>💅 Nail Studio ({DEDICATED_NAIL_SERVICES.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceTab('general')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-inter transition-all ${
                      serviceTab === 'general'
                        ? 'bg-gold text-[#0A0A0A] font-bold shadow-sm'
                        : 'bg-[#141414] text-white/50 hover:text-white border border-white/8'
                    }`}
                  >
                    Hair & Grooming ({GENERAL_SERVICES.length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {displayedServices.map((option) => {
                  const selected = selectedServices.find((s) => s.id === option.id);
                  return (
                    <div key={option.id}>
                      <button type="button" onClick={() => toggleService(option)}
                        className={`w-full p-3 border-2 rounded-xl transition-all text-left ${
                          selected
                            ? 'border-gold bg-gold/10 shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                            : option.isNail
                            ? 'border-gold/30 bg-[#161616] hover:border-gold/60 hover:shadow-[0_0_16px_rgba(212,175,55,0.2)]'
                            : 'border-white/10 bg-[#141414] hover:border-gold/30'
                        }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{option.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white font-inter truncate">{option.name}</p>
                            <p className="text-xs text-white/30 font-inter">₹{option.price} · {option.duration}m</p>
                          </div>
                          {selected && (
                            <div className="w-5 h-5 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-[#0A0A0A]" />
                            </div>
                          )}
                        </div>
                      </button>

                      {selected && editingService === option.id && (
                        <div className="mt-1.5 p-3 bg-gold/8 border border-gold/20 rounded-xl">
                          <p className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-2 font-inter">Customize pricing</p>
                          <div className="flex gap-2">
                            <input type="number" placeholder="₹ Price" value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="flex-1 h-8 px-2 text-xs bg-[#0A0A0A] border border-white/12 focus:border-gold/50 text-white rounded-lg outline-none font-inter" />
                            <input type="number" placeholder="Mins" value={editDuration}
                              onChange={(e) => setEditDuration(e.target.value)}
                              className="flex-1 h-8 px-2 text-xs bg-[#0A0A0A] border border-white/12 focus:border-gold/50 text-white rounded-lg outline-none font-inter" />
                            <button type="button" onClick={() => saveServiceEdit(option.id)}
                              className="h-8 px-3 bg-gold text-[#0A0A0A] font-bold text-xs rounded-lg hover:bg-gold-light transition-colors font-inter">
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Services */}
            {selectedServices.length > 0 && (
              <div>
                <label className={labelCls}>Selected ({selectedServices.length})</label>
                <div className="space-y-2">
                  {selectedServices.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between p-3 bg-[#141414] border border-white/8 rounded-xl">
                      <div>
                        <p className="font-semibold text-sm text-white font-inter">{svc.name}</p>
                        <p className="text-xs text-gold/60 font-inter">₹{svc.price} · {svc.duration} mins</p>
                      </div>
                      <button onClick={() => setSelectedServices((prev) => prev.filter((s) => s.id !== svc.id))}
                        className="w-7 h-7 bg-red-400/10 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-400/20 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Service */}
            <div>
              <label className={labelCls}>Add Custom Service</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input placeholder="Service name" value={customService.name}
                  onChange={(e) => setCustomService((p) => ({ ...p, name: e.target.value }))}
                  className="col-span-1 h-10 px-3 text-sm bg-[#0A0A0A] border border-white/12 focus:border-gold/50 text-white rounded-xl outline-none font-inter placeholder-white/20" />
                <input type="number" placeholder="₹ Price" value={customService.price}
                  onChange={(e) => setCustomService((p) => ({ ...p, price: e.target.value }))}
                  className="h-10 px-3 text-sm bg-[#0A0A0A] border border-white/12 focus:border-gold/50 text-white rounded-xl outline-none font-inter placeholder-white/20" />
                <input type="number" placeholder="Mins" value={customService.duration}
                  onChange={(e) => setCustomService((p) => ({ ...p, duration: e.target.value }))}
                  className="h-10 px-3 text-sm bg-[#0A0A0A] border border-white/12 focus:border-gold/50 text-white rounded-xl outline-none font-inter placeholder-white/20" />
              </div>
              <button type="button" onClick={addCustomService}
                className="px-4 py-2 text-xs border border-gold/30 text-gold hover:bg-gold/8 rounded-xl transition-all font-semibold font-inter">
                + Add Custom Service
              </button>
            </div>
          </div>
        );
      }

      /* ── Step 4: Home Service ──────────────────────────────────────────── */
      case 4:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-playfair font-bold text-white text-xl mb-1">Home Service</h2>
              <p className="text-white/35 text-sm font-inter">Offer services at customers' locations</p>
            </div>
            <Divider />

            <button type="button" onClick={() => setHomeServiceEnabled(!homeServiceEnabled)}
              className={`w-full flex items-start gap-4 p-5 border-2 rounded-2xl transition-all text-left ${
                homeServiceEnabled
                  ? 'border-gold bg-gold/8 shadow-gold'
                  : 'border-white/10 bg-[#141414] hover:border-gold/30'
              }`}>
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                homeServiceEnabled ? 'bg-gold border-gold' : 'border-white/20'
              }`}>
                {homeServiceEnabled && <Check className="w-3.5 h-3.5 text-[#0A0A0A]" />}
              </div>
              <div>
                <p className="font-playfair font-semibold text-white">Enable Home Service</p>
                <p className="text-xs text-white/35 mt-0.5 font-inter">Customers can book you at their location for an extra charge</p>
              </div>
            </button>

            {homeServiceEnabled && (
              <div className="space-y-4 p-5 bg-gold/5 border border-gold/20 rounded-2xl">
                <div>
                  <label className={labelCls}>Extra Charge (₹) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input type="number" value={homeServiceCharge} onChange={(e) => setHomeServiceCharge(e.target.value)}
                      placeholder="e.g., 100"
                      className={inputCls + ' pl-10'} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Max Service Radius (km) *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input type="number" value={serviceRadius} onChange={(e) => setServiceRadius(e.target.value)}
                      placeholder="e.g., 5"
                      className={inputCls + ' pl-10'} />
                  </div>
                </div>
              </div>
            )}

            {!homeServiceEnabled && (
              <div className="flex items-start gap-3 p-4 bg-white/3 border border-white/8 rounded-2xl">
                <AlertCircle className="w-4 h-4 text-white/25 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-white/30 font-inter">You can enable home service anytime from your shop dashboard.</p>
              </div>
            )}
          </div>
        );

      /* ── Step 5: Media ─────────────────────────────────────────────────── */
      case 5:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-playfair font-bold text-white text-xl mb-1">Media Upload</h2>
              <p className="text-white/35 text-sm font-inter">Add photos and optionally a video of your shop</p>
            </div>
            <Divider />

            {/* Shop Photos */}
            <div>
              <label className={labelCls}>Shop Photos * <span className="text-white/20 normal-case">(max 5, 2MB each)</span></label>
              {shopPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {shopPhotos.map((photo, i) => (
                    <div key={i} className="relative group">
                      <img src={URL.createObjectURL(photo)} alt={`Shop ${i + 1}`}
                        className="w-full h-24 object-cover rounded-xl" />
                      <button type="button" onClick={() => setShopPhotos((p) => p.filter((_, j) => j !== i))}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {shopPhotos.length < 5 && (
                <label htmlFor="shopPhotos"
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/12 rounded-2xl cursor-pointer hover:border-gold/30 hover:bg-gold/3 transition-all">
                  <ImageIcon className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-sm font-medium text-white/50 font-inter">Add Shop Photos ({shopPhotos.length}/5)</p>
                  <p className="text-xs text-white/20 mt-0.5 font-inter">Click to upload</p>
                  <input id="shopPhotos" type="file" accept="image/*" multiple onChange={handleShopPhotosUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Shop Video */}
            <div>
              <label className={labelCls}>Shop Video <span className="text-white/20 normal-case">(optional · max 10MB)</span></label>
              {shopVideo ? (
                <div className="flex items-center gap-3 p-4 nexora-card rounded-2xl">
                  <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white font-inter truncate">{shopVideo.name}</p>
                    <p className="text-xs text-white/30 font-inter">{(shopVideo.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={() => setShopVideo(null)}
                    className="w-7 h-7 bg-red-400/15 text-red-400 rounded-full flex items-center justify-center hover:bg-red-400/25 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label htmlFor="shopVideo"
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/12 rounded-2xl cursor-pointer hover:border-gold/30 hover:bg-gold/3 transition-all">
                  <Video className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-sm font-medium text-white/50 font-inter">Upload Shop Video</p>
                  <p className="text-xs text-white/20 mt-0.5 font-inter">MP4, WebM · Max 10MB</p>
                  <input id="shopVideo" type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>
        );

      /* ── Step 6: Review ────────────────────────────────────────────────── */
      case 6:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-playfair font-bold text-white text-xl mb-1">Review & Submit</h2>
              <p className="text-white/35 text-sm font-inter">Confirm your details before submitting</p>
            </div>
            <Divider />

            {/* Owner Summary */}
            <div className="nexora-card rounded-2xl p-5">
              <h3 className="font-playfair font-semibold text-gold text-sm mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Owner Details
              </h3>
              <div className="space-y-2 text-sm font-inter">
                {[
                  ['Name', ownerName],
                  ['Email', ownerEmail],
                  ownerPhone ? ['Phone', ownerPhone] : null,
                  ['Profile Photo', '✓ Uploaded'],
                ].filter(Boolean).map(([k, v]: any) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-white/35">{k}</span>
                    <span className={`font-medium text-white ${v === '✓ Uploaded' ? 'text-emerald-400' : ''}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shop Summary */}
            <div className="nexora-card rounded-2xl p-5">
              <h3 className="font-playfair font-semibold text-gold text-sm mb-3 flex items-center gap-2">
                <Store className="w-4 h-4" /> Shop Details
              </h3>
              <div className="space-y-2 text-sm font-inter">
                {[
                  ['Name', shopName],
                  ['Category', shopCategory],
                  ['City', shopCity],
                  ['Hours', `${openingTime} – ${closingTime}`],
                  ['Weekly Off', weeklyOff],
                  gstNumber ? ['GST/License', gstNumber] : null,
                ].filter(Boolean).map(([k, v]: any) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-white/35">{k}</span>
                    <span className="font-medium text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Summary */}
            <div className="nexora-card rounded-2xl p-5">
              <h3 className="font-playfair font-semibold text-gold text-sm mb-3 flex items-center gap-2">
                <Scissors className="w-4 h-4" /> Services ({selectedServices.length})
              </h3>
              <div className="space-y-1.5 text-sm font-inter">
                {selectedServices.map((svc) => (
                  <div key={svc.id} className="flex justify-between">
                    <span className="text-white/40">{svc.name}</span>
                    <span className="font-medium text-gold">₹{svc.price} · {svc.duration}m</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Media + Home */}
            <div className="nexora-card rounded-2xl p-5">
              <div className="grid grid-cols-2 gap-5 text-sm font-inter">
                <div>
                  <h3 className="font-playfair font-semibold text-gold text-sm mb-2 flex items-center gap-1.5">
                    <Upload className="w-4 h-4" /> Media
                  </h3>
                  <p className="text-white/40">{shopPhotos.length} photo{shopPhotos.length !== 1 ? 's' : ''}</p>
                  <p className="text-white/40">{shopVideo ? '1 video' : 'No video'}</p>
                </div>
                <div>
                  <h3 className="font-playfair font-semibold text-gold text-sm mb-2 flex items-center gap-1.5">
                    <Home className="w-4 h-4" /> Home Service
                  </h3>
                  {homeServiceEnabled
                    ? <><p className="text-emerald-400 font-semibold">Enabled</p><p className="text-white/40">₹{homeServiceCharge} · {serviceRadius}km</p></>
                    : <p className="text-white/30">Not enabled</p>}
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-3 p-4 bg-gold/8 border border-gold/20 rounded-2xl">
              <AlertCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-playfair font-semibold text-gold text-sm mb-1">Admin Approval Required</p>
                <p className="text-white/40 text-xs font-inter leading-relaxed">
                  Your shop will be reviewed and typically approved within 24–48 hours. You'll be notified via email.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-10">

      {/* Header */}
      <header className="bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/8 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center">
                <span className="text-gold font-playfair font-bold text-sm">N</span>
              </div>
              <div>
                <h1 className="text-sm font-playfair font-bold text-white leading-tight">Shop Registration</h1>
                <p className="text-[10px] text-white/25 font-inter">Step {currentStep} of {STEPS.length}</p>
              </div>
            </div>
            <button onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-xs text-white/35 hover:text-gold transition-colors font-inter">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
      </header>

      {/* Step Bar */}
      <div className="bg-[#141414] border-b border-white/8">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <StepBar current={currentStep} />
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="nexora-card rounded-2xl p-6 md:p-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-5">
          {currentStep > 1 && (
            <button type="button" disabled={submitting}
              onClick={() => setCurrentStep((p) => Math.max(p - 1, 1))}
              className="flex-1 py-3.5 rounded-xl border border-white/12 text-white/50 hover:border-gold/30 hover:text-white transition-all text-sm font-semibold font-inter flex items-center justify-center gap-2 disabled:opacity-40">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button type="button" onClick={handleNext} disabled={submitting}
            className="flex-1 py-3.5 rounded-xl bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm shadow-gold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100 flex items-center justify-center gap-2 font-inter">
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full animate-spin" />Submitting…</>
            ) : currentStep === STEPS.length ? (
              <><Check className="w-4 h-4" />Submit Registration</>
            ) : (
              <>Next Step <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
