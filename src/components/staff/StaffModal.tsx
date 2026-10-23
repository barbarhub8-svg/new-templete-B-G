import React, { useState, useEffect, useRef } from 'react';
import {
  X, Camera, User, Phone, Briefcase, Percent, Check,
  Clock, Scissors, Sparkles, Shield, AlertCircle, Loader2,
  Calendar, CheckCircle2, ChevronDown, Lock, Plus
} from 'lucide-react';
import {
  StaffMember,
  StaffPrimaryRole,
  StaffAppAccessRole,
  StaffStatus,
  StaffScheduleDay,
  DbService,
} from '../../types';
import { uploadStaffPhoto } from '../../lib/staffService';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staffData: Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editingStaff?: StaffMember | null;
  salonServices: DbService[];
  shopId: string;
}

const PRIMARY_ROLES: StaffPrimaryRole[] = [
  'Senior Stylist',
  'Junior Stylist',
  'Hair Dresser',
  'Makeup Artist',
  'Nail Artist',
  'Spa Therapist',
  'Salon Manager',
  'Receptionist',
];

const APP_ACCESS_ROLES: { role: StaffAppAccessRole; desc: string }[] = [
  {
    role: 'Manager (Full Access)',
    desc: 'Full salon administration: bookings, staff, services & financials.',
  },
  {
    role: 'Service Provider (Assigned)',
    desc: 'Restricted view: sees only their assigned appointments and calendar.',
  },
  {
    role: 'Receptionist (Frontdesk)',
    desc: 'Front-desk operations: manage customer check-ins and appointments.',
  },
];

const STATUS_OPTIONS: { status: StaffStatus; label: string; color: string }[] = [
  { status: 'Available', label: 'Available', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { status: 'Busy', label: 'Busy (Serving Client)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { status: 'On Leave', label: 'On Leave', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { status: 'Unavailable', label: 'Unavailable', color: 'text-slate-700 bg-slate-100 border-slate-300' },
];

const DEFAULT_SPECIALIZATIONS = [
  'Hair Coloring',
  'Balayage',
  'Bridal Makeup',
  'Facial Treatments',
  'Nail Art',
  'Hair Extensions',
  'Threading & Waxing',
  'Deep Tissue Massage',
  'Beard Sculpting',
  'Keratin Treatment',
];

const DAYS_OF_WEEK: StaffScheduleDay['day'][] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function getDefaultSchedule(): StaffScheduleDay[] {
  return DAYS_OF_WEEK.map((day) => ({
    day,
    is_working: day !== 'Sunday',
    start_time: '10:00',
    end_time: '20:00',
  }));
}

export default function StaffModal({
  isOpen,
  onClose,
  onSave,
  editingStaff,
  salonServices,
  shopId,
}: StaffModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [primaryRole, setPrimaryRole] = useState<StaffPrimaryRole>('Senior Stylist');
  const [appAccessRole, setAppAccessRole] = useState<StaffAppAccessRole>('Service Provider (Assigned)');
  const [mobileNumber, setMobileNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [hideMobile, setHideMobile] = useState(false);
  const [commissionPercentage, setCommissionPercentage] = useState<number>(20);
  const [status, setStatus] = useState<StaffStatus>('Available');
  const [assignedServiceIds, setAssignedServiceIds] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<StaffScheduleDay[]>(getDefaultSchedule());
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [skillSearchQuery, setSkillSearchQuery] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Populate on edit or reset on create
  useEffect(() => {
    if (editingStaff) {
      setFullName(editingStaff.full_name || '');
      setAvatarUrl(editingStaff.avatar_url || null);
      setPrimaryRole(editingStaff.primary_role || 'Senior Stylist');
      setAppAccessRole(editingStaff.app_access_role || 'Service Provider (Assigned)');

      const rawPhone = editingStaff.mobile_number || '';
      if (rawPhone.startsWith('+')) {
        const parts = rawPhone.split(' ');
        setCountryCode(parts[0] || '+91');
        setMobileNumber(parts.slice(1).join(''));
      } else {
        setCountryCode('+91');
        setMobileNumber(rawPhone);
      }

      setHideMobile(Boolean(editingStaff.hide_mobile_from_public));
      setCommissionPercentage(editingStaff.commission_percentage ?? 20);
      setStatus(editingStaff.status || 'Available');
      setAssignedServiceIds(editingStaff.assigned_service_ids || []);
      setSpecializations(editingStaff.specializations || []);

      if (editingStaff.schedule && editingStaff.schedule.length > 0) {
        setSchedule(editingStaff.schedule);
      } else {
        setSchedule(getDefaultSchedule());
      }
    } else {
      setFullName('');
      setAvatarUrl(null);
      setPrimaryRole('Senior Stylist');
      setAppAccessRole('Service Provider (Assigned)');
      setMobileNumber('');
      setCountryCode('+91');
      setHideMobile(false);
      setCommissionPercentage(20);
      setStatus('Available');
      // By default select all services for new staff
      setAssignedServiceIds(salonServices.map((s) => s.id));
      setSchedule(getDefaultSchedule());
      setSpecializations(['Hair Coloring', 'Beard Sculpting']);
    }
    setErrors({});
  }, [editingStaff, isOpen, salonServices]);

  if (!isOpen) return null;

  // Handle Photo Upload
  async function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photo: 'Please select an image file (PNG/JPG)' }));
      return;
    }

    try {
      setUploadingPhoto(true);
      const uploadedUrl = await uploadStaffPhoto(shopId, file);
      setAvatarUrl(uploadedUrl);
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.photo;
        return copy;
      });
    } catch (err: any) {
      console.warn('Photo upload error, using local data preview:', err);
      const localUrl = URL.createObjectURL(file);
      setAvatarUrl(localUrl);
    } finally {
      setUploadingPhoto(false);
    }
  }

  // Toggle Service
  function toggleService(serviceId: string) {
    setAssignedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  }

  function handleSelectAllServices() {
    setAssignedServiceIds(salonServices.map((s) => s.id));
  }

  function handleClearAllServices() {
    setAssignedServiceIds([]);
  }

  // Handle Schedule Changes
  function handleDayToggle(dayName: StaffScheduleDay['day']) {
    setSchedule((prev) =>
      prev.map((s) => (s.day === dayName ? { ...s, is_working: !s.is_working } : s))
    );
  }

  function handleTimeChange(
    dayName: StaffScheduleDay['day'],
    field: 'start_time' | 'end_time',
    value: string
  ) {
    setSchedule((prev) =>
      prev.map((s) => (s.day === dayName ? { ...s, [field]: value } : s))
    );
  }

  function applyStandardSchedule() {
    setSchedule(getDefaultSchedule());
  }

  // Toggle Specialization Chip
  function toggleSpecialization(skill: string) {
    setSpecializations((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function handleAddCustomSkill() {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (!specializations.includes(trimmed)) {
      setSpecializations((prev) => [...prev, trimmed]);
    }
    setNewSkillInput('');
  }

  // Validate form
  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!cleanMobile) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (cleanMobile.length < 10) {
      newErrors.mobileNumber = 'Enter a valid 10-digit mobile number';
    }

    if (commissionPercentage < 0 || commissionPercentage > 100 || isNaN(commissionPercentage)) {
      newErrors.commission = 'Commission must be between 0% and 100%';
    }

    // Validate schedule: end time must be after start time for enabled days
    for (const day of schedule) {
      if (day.is_working) {
        if (!day.start_time || !day.end_time) {
          newErrors.schedule = `Start and end time required for ${day.day}`;
          break;
        }
        if (day.start_time >= day.end_time) {
          newErrors.schedule = `End time must be after start time on ${day.day}`;
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Submit Handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      const formattedPhone = `${countryCode} ${mobileNumber.trim().replace(/\s+/g, '')}`;

      const staffPayload = {
        shop_id: shopId,
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
        primary_role: primaryRole,
        app_access_role: appAccessRole,
        mobile_number: formattedPhone,
        hide_mobile_from_public: hideMobile,
        commission_percentage: Number(commissionPercentage),
        status,
        is_active: editingStaff ? editingStaff.is_active : true,
        assigned_service_ids: assignedServiceIds,
        specializations,
        schedule,
      };

      await onSave(staffPayload);
      onClose();
    } catch (err: any) {
      console.error('Failed to save staff member:', err);
      setErrors((prev) => ({ ...prev, submit: err.message || 'Failed to save staff member' }));
    } finally {
      setLoading(false);
    }
  }

  // Filter skills by search query
  const availableSkillPool = Array.from(
    new Set([...DEFAULT_SPECIALIZATIONS, ...specializations])
  );
  const filteredSkills = availableSkillPool.filter((s) =>
    s.toLowerCase().includes(skillSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 bg-white sticky top-0 z-20">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Enter staff profile details, service assignments, roles and weekly working hours
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Form Body (Scrollable) ─────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6 font-sans">
          {errors.submit && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* ════ SECTION A: Profile ════ */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>A. Profile & Personal Details</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              {/* Photo Upload */}
              <div className="relative group">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-300 hover:border-blue-500 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all shadow-sm group-hover:shadow"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-600">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-semibold">Photo</span>
                    </div>
                  )}
                </div>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAvatarUrl(null);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow hover:bg-red-600"
                    title="Remove photo"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Name & Primary Role */}
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    placeholder="e.g. Sameer Khan"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                      errors.fullName ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Primary Role <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={primaryRole}
                      onChange={(e) => setPrimaryRole(e.target.value as StaffPrimaryRole)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all appearance-none pr-8 cursor-pointer"
                    >
                      {PRIMARY_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ════ SECTION B: App Access Role ════ */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>B. App Access & Permissions</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                App Access Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={appAccessRole}
                  onChange={(e) => setAppAccessRole(e.target.value as StaffAppAccessRole)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all appearance-none pr-8 cursor-pointer"
                >
                  {APP_ACCESS_ROLES.map(({ role }) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Permission description */}
              <div className="mt-2.5 p-3 rounded-xl bg-purple-50/70 border border-purple-200/60 text-xs text-purple-900 flex items-start gap-2">
                <Shield className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">{appAccessRole}: </span>
                  <span>
                    {APP_ACCESS_ROLES.find((r) => r.role === appAccessRole)?.desc}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ════ SECTION C: Contact & Employment ════ */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>C. Contact & Employment Terms</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Mobile Number */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-xl shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-xs font-medium">
                    {countryCode}
                  </span>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => {
                      setMobileNumber(e.target.value);
                      if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: '' }));
                    }}
                    placeholder="98765 43210"
                    className={`w-full px-3 py-2.5 bg-white border rounded-r-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                      errors.mobileNumber ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.mobileNumber && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.mobileNumber}</p>
                )}
              </div>

              {/* Commission Percentage */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Commission Rate (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionPercentage}
                    onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                    placeholder="20"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all pr-8"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    %
                  </span>
                </div>
                {errors.commission && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.commission}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Staff Status <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StaffStatus)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all appearance-none pr-8 cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.status} value={opt.status}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Mobile Privacy Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={hideMobile}
                  onChange={(e) => setHideMobile(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <div className="text-xs">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Hide Mobile Number from Public Website / Staff List
                  </div>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    When checked, clients cannot see this personal number. All customer bookings will be routed through the platform.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* ════ SECTION D: Assign Services ════ */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Scissors className="w-3.5 h-3.5 text-blue-600" />
                <span>D. Assign Services ({assignedServiceIds.length} Selected)</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllServices}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Select All
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={handleClearAllServices}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {salonServices.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                No services configured for this salon yet. You can add services under the Services tab.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {salonServices.map((svc) => {
                  const isChecked = assignedServiceIds.includes(svc.id);
                  return (
                    <label
                      key={svc.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/50 text-slate-900 font-medium'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="truncate">{svc.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 flex-shrink-0 ml-2">
                        <span>{svc.duration_minutes}m</span>
                        <span className="font-semibold text-slate-900">₹{svc.price}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* ════ SECTION E: Weekly Schedule ════ */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>E. Weekly Schedule & Availability</span>
              </div>
              <button
                type="button"
                onClick={applyStandardSchedule}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Reset to Standard (Mon-Sat 10am-8pm)
              </button>
            </div>

            {errors.schedule && (
              <p className="text-xs text-red-500 font-medium bg-red-50 p-2.5 rounded-lg border border-red-200">
                {errors.schedule}
              </p>
            )}

            <div className="space-y-2 bg-white rounded-xl border border-slate-200 p-2.5">
              {schedule.map((dayItem) => (
                <div
                  key={dayItem.day}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg transition-colors ${
                    dayItem.is_working ? 'bg-slate-50' : 'bg-slate-100/50 opacity-60'
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer sm:w-36">
                    <input
                      type="checkbox"
                      checked={dayItem.is_working}
                      onChange={() => handleDayToggle(dayItem.day)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      {dayItem.day}
                    </span>
                  </label>

                  {dayItem.is_working ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">From</span>
                      <input
                        type="time"
                        value={dayItem.start_time}
                        onChange={(e) => handleTimeChange(dayItem.day, 'start_time', e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="time"
                        value={dayItem.end_time}
                        onChange={(e) => handleTimeChange(dayItem.day, 'end_time', e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 italic">
                      Weekly Off / Unavailable
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ════ SECTION F: Specializations / Skills ════ */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>F. Specializations & Skills ({specializations.length} Selected)</span>
            </div>

            {/* Quick search & custom skill add */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={skillSearchQuery}
                onChange={(e) => setSkillSearchQuery(e.target.value)}
                placeholder="Filter skills..."
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                  placeholder="Custom skill..."
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-36"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {filteredSkills.map((skill) => {
                const isSelected = specializations.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSpecialization(skill)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-blue-600 stroke-[3]" />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Modal Footer (Sticky) ─────────────────────────────────── */}
          <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-4 bg-white/95 backdrop-blur-sm border-t border-slate-200 flex items-center justify-end gap-3 z-20">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingStaff ? 'Save Changes' : 'Add Staff Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
