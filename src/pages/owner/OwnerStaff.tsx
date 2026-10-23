import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Search, Filter, Phone, Scissors,
  Clock, Percent, Shield, MoreVertical, Edit2, Trash2,
  CheckCircle2, XCircle, AlertCircle, Loader2, Sparkles,
  Lock, Eye, ChevronDown, Check, RefreshCw, LayoutGrid, List, Download
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../hooks/use-toast';
import {
  getShopByOwnerId,
  getShopServices,
} from '../../lib/api';
import {
  getShopStaff,
  createStaffMember,
  updateStaffMember,
  deactivateStaffMember,
  reactivateStaffMember,
} from '../../lib/staffService';
import {
  StaffMember,
  StaffPrimaryRole,
  StaffStatus,
  DbService,
  DbShop,
} from '../../types';
import StaffModal from '../../components/staff/StaffModal';
import StaffDetailsModal from '../../components/staff/StaffDetailsModal';

const ALL_ROLES: (StaffPrimaryRole | 'All')[] = [
  'All',
  'Senior Stylist',
  'Junior Stylist',
  'Hair Dresser',
  'Makeup Artist',
  'Nail Artist',
  'Spa Therapist',
  'Salon Manager',
  'Receptionist',
];

const ALL_STATUSES: (StaffStatus | 'All')[] = [
  'All',
  'Available',
  'Busy',
  'On Leave',
  'Unavailable',
];

export default function OwnerStaff() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [shop, setShop] = useState<DbShop | null>(null);
  const [services, setServices] = useState<DbService[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffPrimaryRole | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<StaffStatus | 'All'>('All');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('All');
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [detailsStaff, setDetailsStaff] = useState<StaffMember | null>(null);

  // Deactivate confirmation modal
  const [deactivatingStaff, setDeactivatingStaff] = useState<StaffMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  async function loadData() {
    if (!user?.id) return;
    try {
      setLoading(true);
      const shopData = await getShopByOwnerId(user.id);
      if (!shopData) {
        toast({
          title: 'No Salon Found',
          description: 'Please register your salon profile first.',
          variant: 'destructive',
        });
        return;
      }
      setShop(shopData);

      // Load salon services
      const svcs = await getShopServices(shopData.id);
      setServices(svcs || []);

      // Load staff members (including deactivated if showDeactivated is selected)
      const staff = await getShopStaff(shopData.id, false);
      setStaffList(staff || []);
    } catch (err: any) {
      console.error('Failed to load staff data:', err);
      toast({
        title: 'Error Loading Staff',
        description: err.message || 'Could not fetch staff members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // Filter staff members
  const filteredStaff = useMemo(() => {
    return staffList.filter((member) => {
      // Active filter
      if (!showDeactivated && !member.is_active) return false;
      if (showDeactivated && member.is_active) return false;

      // Search query (name or phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = member.full_name?.toLowerCase().includes(q);
        const matchesPhone = member.mobile_number?.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
        const matchesRole = member.primary_role?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesRole) return false;
      }

      // Role filter
      if (selectedRole !== 'All' && member.primary_role !== selectedRole) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'All' && member.status !== selectedStatus) {
        return false;
      }

      // Service filter
      if (selectedServiceId !== 'All') {
        const hasService = (member.assigned_service_ids || []).includes(selectedServiceId);
        if (!hasService) return false;
      }

      return true;
    });
  }, [staffList, searchQuery, selectedRole, selectedStatus, selectedServiceId, showDeactivated]);

  // Stats
  const activeStaff = staffList.filter((s) => s.is_active);
  const availableCount = activeStaff.filter((s) => s.status === 'Available').length;
  const busyCount = activeStaff.filter((s) => s.status === 'Busy').length;
  const leaveCount = activeStaff.filter((s) => s.status === 'On Leave').length;

  // Save staff handler (create or update)
  async function handleSaveStaff(staffData: Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>) {
    if (!shop?.id) return;
    if (editingStaff) {
      const updated = await updateStaffMember(editingStaff.id, staffData);
      setStaffList((prev) =>
        prev.map((s) => (s.id === editingStaff.id ? updated : s))
      );
      toast({
        title: 'Staff Updated',
        description: `${updated.full_name}'s profile has been updated.`,
      });
    } else {
      const created = await createStaffMember(staffData);
      setStaffList((prev) => [created, ...prev]);
      toast({
        title: 'Staff Added',
        description: `${created.full_name} has been added to your salon.`,
      });
    }
    setEditingStaff(null);
  }

  // Deactivate handler
  async function handleConfirmDeactivate() {
    if (!deactivatingStaff) return;
    try {
      setActionLoading(true);
      await deactivateStaffMember(deactivatingStaff.id);
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === deactivatingStaff.id ? { ...s, is_active: false, status: 'Unavailable' } : s
        )
      );
      toast({
        title: 'Staff Deactivated',
        description: `${deactivatingStaff.full_name} has been marked as inactive. Historical records remain intact.`,
      });
      setDeactivatingStaff(null);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to deactivate staff member',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Reactivate handler
  async function handleReactivate(member: StaffMember) {
    try {
      await reactivateStaffMember(member.id);
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === member.id ? { ...s, is_active: true, status: 'Available' } : s
        )
      );
      toast({
        title: 'Staff Reactivated',
        description: `${member.full_name} is now active and available for bookings.`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to reactivate staff member',
        variant: 'destructive',
      });
    }
  }

  // Export CSV handler
  function handleExportCSV() {
    if (staffList.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'There are no staff members to export.',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'ID',
      'Full Name',
      'Primary Role',
      'App Access Level',
      'Mobile Number',
      'Commission (%)',
      'Status',
      'Privacy (Hidden)',
      'Active',
      'Working Days & Hours',
    ];

    const rows = filteredStaff.map((member) => {
      const workingScheduleStr = (member.schedule || [])
        .filter((s) => s.is_working)
        .map((s) => `${s.day}: ${s.start_time}-${s.end_time}`)
        .join(' | ');

      return [
        member.id,
        `"${(member.full_name || '').replace(/"/g, '""')}"`,
        `"${(member.primary_role || '').replace(/"/g, '""')}"`,
        `"${(member.app_access_role || '').replace(/"/g, '""')}"`,
        `"${(member.mobile_number || '').replace(/"/g, '""')}"`,
        member.commission_percentage,
        member.status,
        member.hide_mobile_from_public ? 'Yes' : 'No',
        member.is_active ? 'Yes' : 'No',
        `"${workingScheduleStr.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `staff-report-${shop?.name || 'salon'}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Successful',
      description: `Exported ${filteredStaff.length} staff records to CSV.`,
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-slate-500 text-sm">Loading staff members & schedules...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto font-sans">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">No Salon Found</h3>
        <p className="text-slate-500 text-sm mt-1 mb-4">
          Please register your salon profile to start managing your team.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {activeStaff.length} Members
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage your salon team, roles, commissions, and working hours for {shop.name}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingStaff(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Staff Member</span>
          </button>
        </div>
      </div>

      {/* ── Metrics Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Staff</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{activeStaff.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Active team members</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Available Today */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{availableCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Ready for bookings</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Busy / Serving */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Serving / Busy</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{busyCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">In appointment</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* On Leave */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">On Leave</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{leaveCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Not available today</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Search, Filters & Controls ─────────────────────────────── */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name or mobile number..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Active / Inactive Tab Switch & View Mode */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowDeactivated(false)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  !showDeactivated
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Active ({activeStaff.length})
              </button>
              <button
                type="button"
                onClick={() => setShowDeactivated(true)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  showDeactivated
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Inactive ({staffList.filter((s) => !s.is_active).length})
              </button>
            </div>

            <div className="hidden sm:flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-slate-500">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Role Filter */}
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer"
            >
              {ALL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role === 'All' ? 'All Roles' : role}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer"
            >
              {ALL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === 'All' ? 'All Statuses' : status}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Assigned Service Filter */}
          <div className="relative">
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer"
            >
              <option value="All">All Services</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} (₹{svc.price})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Staff List / Table ───────────────────────────────────────── */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Staff Members Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm mx-auto">
            {searchQuery || selectedRole !== 'All' || selectedStatus !== 'All' || selectedServiceId !== 'All'
              ? 'No staff members match the selected filters or search query.'
              : 'You have not added any staff members yet. Add your first stylist or specialist!'}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingStaff(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
          >
            <UserPlus className="w-4 h-4" /> Add Staff Member
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Roles & Access</th>
                  <th className="py-3.5 px-4">Mobile & Privacy</th>
                  <th className="py-3.5 px-4">Assigned Services</th>
                  <th className="py-3.5 px-4">Working Hours</th>
                  <th className="py-3.5 px-4">Commission</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((member) => {
                  const assignedCount = (member.assigned_service_ids || []).length;
                  const workingDaysCount = (member.schedule || []).filter((s) => s.is_working).length;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Photo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-slate-600 text-sm">
                                {member.full_name?.charAt(0) || 'S'}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{member.full_name}</p>
                            {member.specializations && member.specializations.length > 0 && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                                {member.specializations.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Roles */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {member.primary_role}
                          </span>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {member.app_access_role}
                          </p>
                        </div>
                      </td>

                      {/* Mobile & Privacy */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-800">{member.mobile_number}</p>
                          {member.hide_mobile_from_public ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600">
                              <Lock className="w-3 h-3" /> Private (Hidden)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                              <Check className="w-3 h-3" /> Public
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assigned Services */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-semibold text-slate-800">
                            {assignedCount === 0 ? 'All Services' : `${assignedCount} Services`}
                          </span>
                          {assignedCount > 0 && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                              {services
                                .filter((s) => (member.assigned_service_ids || []).includes(s.id))
                                .map((s) => s.name)
                                .slice(0, 2)
                                .join(', ')}
                              {assignedCount > 2 && ` +${assignedCount - 2} more`}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Working Hours */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px]">
                          <p className="font-semibold text-slate-800">{workingDaysCount} days / week</p>
                          <p className="text-slate-500">10:00 - 20:00</p>
                        </div>
                      </td>

                      {/* Commission */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-900 text-sm">
                          {member.commission_percentage}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            member.status === 'Available'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : member.status === 'Busy'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : member.status === 'On Leave'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              member.status === 'Available'
                                ? 'bg-emerald-500 animate-pulse'
                                : member.status === 'Busy'
                                ? 'bg-amber-500'
                                : member.status === 'On Leave'
                                ? 'bg-purple-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {member.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailsStaff(member)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="View Staff Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStaff(member);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Staff Member"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {member.is_active ? (
                            <button
                              type="button"
                              onClick={() => setDeactivatingStaff(member)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Deactivate Staff Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReactivate(member)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Reactivate Staff Member"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => {
            const assignedCount = (member.assigned_service_ids || []).length;
            const workingDaysCount = (member.schedule || []).filter((s) => s.is_working).length;

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow transition-all space-y-4"
              >
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-slate-700 text-base">
                          {member.full_name?.charAt(0) || 'S'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{member.full_name}</h3>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 mt-1">
                        {member.primary_role}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      member.status === 'Available'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : member.status === 'Busy'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : member.status === 'On Leave'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        member.status === 'Available'
                          ? 'bg-emerald-500'
                          : member.status === 'Busy'
                          ? 'bg-amber-500'
                          : member.status === 'On Leave'
                          ? 'bg-purple-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    {member.status}
                  </span>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Commission</span>
                    <p className="font-bold text-slate-900 mt-0.5">{member.commission_percentage}%</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Working Days</span>
                    <p className="font-bold text-slate-900 mt-0.5">{workingDaysCount} Days / Wk</p>
                  </div>
                </div>

                {/* Contact & Services */}
                <div className="text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {member.mobile_number}
                    </span>
                    {member.hide_mobile_from_public && (
                      <span className="text-[10px] font-medium text-amber-600 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Hidden
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-slate-400" />
                      {assignedCount === 0 ? 'All Services' : `${assignedCount} Assigned Services`}
                    </span>
                  </div>
                </div>

                {/* Skills preview */}
                {member.specializations && member.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {member.specializations.slice(0, 3).map((spec) => (
                      <span
                        key={spec}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                      >
                        {spec}
                      </span>
                    ))}
                    {member.specializations.length > 3 && (
                      <span className="text-[10px] text-slate-400">+{member.specializations.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDetailsStaff(member)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStaff(member);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {member.is_active ? (
                      <button
                        type="button"
                        onClick={() => setDeactivatingStaff(member)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Deactivate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReactivate(member)}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Reactivate"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Staff Member Modal ────────────────────────────── */}
      <StaffModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingStaff(null);
        }}
        onSave={handleSaveStaff}
        editingStaff={editingStaff}
        salonServices={services}
        shopId={shop.id}
      />

      {/* ── View Details Modal ───────────────────────────────────────── */}
      <StaffDetailsModal
        staff={detailsStaff}
        isOpen={Boolean(detailsStaff)}
        onClose={() => setDetailsStaff(null)}
        onEdit={(st) => {
          setDetailsStaff(null);
          setEditingStaff(st);
          setModalOpen(true);
        }}
        salonServices={services}
      />

      {/* ── Deactivate Confirmation Dialog ─────────────────────────── */}
      {deactivatingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Deactivate Staff Member?</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to deactivate <span className="font-semibold text-slate-800">{deactivatingStaff.full_name}</span>?
              They will be hidden from the public website and will not be available for new appointments. All past booking records will remain intact.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeactivatingStaff(null)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Deactivate Staff</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
