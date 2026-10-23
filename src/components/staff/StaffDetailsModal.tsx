import React, { useState } from 'react';
import {
  X, User, Phone, Shield, Percent, Scissors, Clock,
  Sparkles, CheckCircle2, AlertCircle, Edit, Calendar, Lock, TrendingUp, Star, Award, History, Activity
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { StaffMember, DbService } from '../../types';

interface StaffDetailsModalProps {
  staff: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (staff: StaffMember) => void;
  salonServices: DbService[];
}

// Generate realistic 30-day performance mock data for staff member
function generateStaffPerformanceData(staffId: string) {
  const data = [];
  const today = new Date();
  
  const seed = staffId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseAppts = isWeekend ? 6 : 3;
    const variance = (Math.sin(i + seed) + 1) * 2;
    const appointments = Math.max(1, Math.round(baseAppts + variance));

    const rating = Number((4.5 + ((Math.cos(i * 0.5 + seed) + 1) * 0.25)).toFixed(1));

    data.push({
      date: dateStr,
      appointments,
      rating: Math.min(5.0, rating),
    });
  }
  return data;
}

// Generate chronological activity log for staff member
function generateStaffActivityLog(staff: StaffMember) {
  const activities = [
    {
      id: 'act-1',
      type: 'profile',
      title: 'Profile Updated',
      description: `Commission percentage set to ${staff.commission_percentage}% and mobile number verified.`,
      timestamp: '2 hours ago',
      icon: Edit,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      id: 'act-2',
      type: 'schedule',
      title: 'Weekly Schedule Updated',
      description: 'Working hours adjusted for Monday through Saturday (10:00 AM - 8:00 PM).',
      timestamp: '1 day ago',
      icon: Clock,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      id: 'act-3',
      type: 'service',
      title: 'Service Assignments Modified',
      description: `Assigned to ${(staff.assigned_service_ids || []).length} salon service categories.`,
      timestamp: '3 days ago',
      icon: Scissors,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'act-4',
      type: 'status',
      title: 'Status Changed',
      description: `Staff availability status updated to "${staff.status}".`,
      timestamp: '5 days ago',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'act-5',
      type: 'created',
      title: 'Staff Member Added',
      description: `${staff.full_name} was successfully registered as ${staff.primary_role} in the salon team.`,
      timestamp: '2 weeks ago',
      icon: User,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  return activities;
}

export default function StaffDetailsModal({
  staff,
  isOpen,
  onClose,
  onEdit,
  salonServices,
}: StaffDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'activity'>('overview');

  if (!isOpen || !staff) return null;

  const assignedServices = salonServices.filter((s) =>
    (staff.assigned_service_ids || []).includes(s.id)
  );

  const performanceData = generateStaffPerformanceData(staff.id);
  const total30DayAppts = performanceData.reduce((sum, d) => sum + d.appointments, 0);
  const avg30DayRating = Number((performanceData.reduce((sum, d) => sum + d.rating, 0) / performanceData.length).toFixed(1));
  const activityLog = generateStaffActivityLog(staff);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm">
              {staff.avatar_url ? (
                <img src={staff.avatar_url} alt={staff.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{staff.full_name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {staff.primary_role}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-600 font-medium">
                  {staff.app_access_role}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/30 gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Overview & Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'performance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> 30-Day Performance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Activity Log
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' ? (
            <>
              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Status</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{staff.status}</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Commission</span>
                  <p className="text-sm font-bold text-blue-600 mt-0.5">{staff.commission_percentage}%</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Assigned Services</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{assignedServices.length}</p>
                </div>
              </div>

              {/* Contact & Privacy */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" /> Contact Details
                </h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Mobile Number:</span>
                  <span className="font-semibold text-slate-900">{staff.mobile_number}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-600" /> Public Privacy:
                  </span>
                  <span className={`font-semibold ${staff.hide_mobile_from_public ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {staff.hide_mobile_from_public ? 'Hidden from public' : 'Visible on public profile'}
                  </span>
                </div>
              </div>

              {/* Assigned Services */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-blue-600" /> Assigned Services
                </h4>
                {assignedServices.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No specific services assigned (general availability).</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {assignedServices.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 text-xs"
                      >
                        <span className="font-medium text-slate-800">{s.name}</span>
                        <span className="text-slate-500">₹{s.price} · {s.duration_minutes}m</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weekly Schedule */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> Working Schedule
                </h4>
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                  {(staff.schedule || []).map((day) => (
                    <div key={day.day} className="flex items-center justify-between px-3.5 py-2">
                      <span className="font-semibold text-slate-800">{day.day}</span>
                      {day.is_working ? (
                        <span className="text-slate-600 font-medium">
                          {day.start_time} - {day.end_time}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Off</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Specializations */}
              {staff.specializations && staff.specializations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Specializations & Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {staff.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : activeTab === 'performance' ? (
            /* PERFORMANCE TAB WITH RECHARTS */
            <div className="space-y-6">
              {/* Performance KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Completed Appts</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{total30DayAppts}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Last 30 days</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Average Rating</p>
                    <p className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-1">
                      {avg30DayRating} <Star className="w-4 h-4 fill-amber-500 text-amber-500 inline" />
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Client feedback score</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                    <Award className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Commission Rate</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{staff.commission_percentage}%</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Agreed tier</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <Percent className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Recharts Composed Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">30-Day Activity & Ratings Trend</h3>
                    <p className="text-xs text-slate-500">Daily appointment volume and average client ratings</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                    Past 30 Days
                  </span>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis yAxisId="left" stroke="#3b82f6" fontSize={11} tickLine={false} domain={[0, 'dataMax + 2']} />
                      <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} tickLine={false} domain={[3.5, 5.0]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar yAxisId="left" dataKey="appointments" name="Completed Appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                      <Line yAxisId="right" type="monotone" dataKey="rating" name="Average Rating (★)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVITY LOG TAB */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Chronological Activity Log</h3>
                  <p className="text-xs text-slate-500">Recent actions, schedule changes, and profile updates for {staff.full_name}</p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                  {activityLog.length} Recorded Events
                </span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {activityLog.map((act) => {
                  const IconComp = act.icon;
                  return (
                    <div key={act.id} className="relative flex items-start gap-4 group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-6 w-6 h-6 rounded-full border flex items-center justify-center text-xs shadow-sm ${act.color}`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1 space-y-1 hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                          <span className="text-[10px] font-medium text-slate-400">{act.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Account Status: {staff.is_active ? 'Active' : 'Deactivated'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-white"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(staff);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
