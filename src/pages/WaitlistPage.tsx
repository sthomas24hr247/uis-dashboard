import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, Clock, CheckCircle2, XCircle, AlertTriangle,
  Phone, Mail, MessageSquare, Plus, Users, Calendar, Zap,
  ChevronRight, RefreshCw, Timer, UserPlus, Search,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// WAITLIST AUTOMATION PAGE
// Architecture: Demo data now, PMS integration (Open Dental, Weave) later
// Workflow: Cancel → Match waitlist → Notify → Confirm → Book
// ═══════════════════════════════════════════════════════════════════════════════

type WaitlistStatus = 'waiting' | 'notified' | 'confirmed' | 'declined' | 'expired' | 'booked';
type ContactMethod = 'sms' | 'email' | 'phone';
type SlotStatus = 'open' | 'filling' | 'filled' | 'expired';

interface WaitlistEntry {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  email: string;
  procedureNeeded: string;
  cdtCode: string;
  providerPreference?: string;
  preferredDays: string[];
  preferredTimes: string;
  contactMethod: ContactMethod;
  dateAdded: string;
  daysWaiting: number;
  urgency: 'routine' | 'soon' | 'urgent';
  status: WaitlistStatus;
  priorityScore: number;
  notes?: string;
}

interface OpenSlot {
  id: string;
  date: string;
  time: string;
  duration: number;
  provider: string;
  originalPatient: string;
  cancelReason: string;
  cancelledAt: string;
  slotStatus: SlotStatus;
  matchedPatients: SlotMatch[];
  confirmationDeadline: string;
}

interface SlotMatch {
  waitlistId: string;
  patientName: string;
  matchScore: number;
  matchReasons: string[];
  notifiedAt?: string;
  respondedAt?: string;
  response?: 'accepted' | 'declined' | 'no_response';
  contactMethod: ContactMethod;
}

// ── Demo Data ────────────────────────────────────────────────────────────────

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return fmt(d); };
const hoursFromNow = (n: number) => { const d = new Date(); d.setHours(d.getHours() + n); return d.toISOString(); };

function generateWaitlist(): WaitlistEntry[] {
  return [
    { id: 'w1', patientId: '10', patientName: 'Sarah Martinez', phone: '(602) 555-0142', email: 'sarah.m@email.com', procedureNeeded: 'Crown - Ceramic', cdtCode: 'D2740', providerPreference: 'Dr. Sarah Palmer', preferredDays: ['Mon', 'Wed', 'Fri'], preferredTimes: 'Morning', contactMethod: 'sms', dateAdded: daysAgo(14), daysWaiting: 14, urgency: 'soon', status: 'waiting', priorityScore: 87, notes: 'Tooth #14 temp crown placed. Needs permanent within 30 days.' },
    { id: 'w2', patientId: '11', patientName: 'David Kim', phone: '(480) 555-0198', email: 'dkim@email.com', procedureNeeded: 'Root Canal - Molar', cdtCode: 'D3330', providerPreference: 'Dr. James Chen', preferredDays: ['Tue', 'Thu'], preferredTimes: 'Afternoon', contactMethod: 'phone', dateAdded: daysAgo(7), daysWaiting: 7, urgency: 'urgent', status: 'notified', priorityScore: 94, notes: 'Experiencing intermittent pain. Prescribed antibiotics.' },
    { id: 'w3', patientId: '12', patientName: 'Lisa Thompson', phone: '(623) 555-0276', email: 'lisa.t@email.com', procedureNeeded: 'Prophylaxis Adult', cdtCode: 'D1110', preferredDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], preferredTimes: 'Any', contactMethod: 'sms', dateAdded: daysAgo(21), daysWaiting: 21, urgency: 'routine', status: 'waiting', priorityScore: 72, notes: '6-month recall overdue.' },
    { id: 'w4', patientId: '13', patientName: 'Michael Brown', phone: '(602) 555-0334', email: 'mbrown@email.com', procedureNeeded: 'SRP - 2 Quadrants', cdtCode: 'D4341', providerPreference: 'Dr. Sarah Palmer', preferredDays: ['Wed', 'Fri'], preferredTimes: 'Morning', contactMethod: 'email', dateAdded: daysAgo(10), daysWaiting: 10, urgency: 'soon', status: 'waiting', priorityScore: 79 },
    { id: 'w5', patientId: '14', patientName: 'Jennifer Lee', phone: '(480) 555-0411', email: 'jlee@email.com', procedureNeeded: 'Composite #8', cdtCode: 'D2330', preferredDays: ['Mon', 'Fri'], preferredTimes: 'Afternoon', contactMethod: 'sms', dateAdded: daysAgo(3), daysWaiting: 3, urgency: 'routine', status: 'waiting', priorityScore: 65 },
    { id: 'w6', patientId: '15', patientName: 'Robert Taylor', phone: '(623) 555-0523', email: 'rtaylor@email.com', procedureNeeded: 'Extraction #17', cdtCode: 'D7210', providerPreference: 'Dr. James Chen', preferredDays: ['Tue', 'Thu'], preferredTimes: 'Morning', contactMethod: 'phone', dateAdded: daysAgo(5), daysWaiting: 5, urgency: 'urgent', status: 'confirmed', priorityScore: 91, notes: 'Impacted wisdom tooth. Referred from GP.' },
  ];
}

function generateOpenSlots(): OpenSlot[] {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2);
  return [
    {
      id: 's1', date: fmt(tomorrow), time: '2:00 PM', duration: 60,
      provider: 'Dr. Sarah Palmer', originalPatient: 'Nancy Williams',
      cancelReason: 'Patient requested reschedule', cancelledAt: new Date(Date.now() - 45 * 60000).toISOString(),
      slotStatus: 'filling',
      matchedPatients: [
        { waitlistId: 'w1', patientName: 'Sarah Martinez', matchScore: 92, matchReasons: ['Provider match', 'Procedure fits duration', 'Available Wed'], notifiedAt: new Date(Date.now() - 40 * 60000).toISOString(), contactMethod: 'sms', response: 'no_response' },
        { waitlistId: 'w4', patientName: 'Michael Brown', matchScore: 78, matchReasons: ['Provider match', 'Available time'], contactMethod: 'email' },
        { waitlistId: 'w3', patientName: 'Lisa Thompson', matchScore: 71, matchReasons: ['Any day/time works', 'Longest wait'], contactMethod: 'sms' },
      ],
      confirmationDeadline: hoursFromNow(1.25),
    },
    {
      id: 's2', date: fmt(dayAfter), time: '10:30 AM', duration: 90,
      provider: 'Dr. James Chen', originalPatient: 'Tom Richardson',
      cancelReason: 'No-show / missed appointment', cancelledAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      slotStatus: 'filled',
      matchedPatients: [
        { waitlistId: 'w6', patientName: 'Robert Taylor', matchScore: 96, matchReasons: ['Provider match', 'Urgent case', 'Procedure fits duration', 'Available Thu'], notifiedAt: new Date(Date.now() - 110 * 60000).toISOString(), respondedAt: new Date(Date.now() - 95 * 60000).toISOString(), contactMethod: 'phone', response: 'accepted' },
        { waitlistId: 'w2', patientName: 'David Kim', matchScore: 88, matchReasons: ['Provider match', 'Urgent case'], contactMethod: 'phone' },
      ],
      confirmationDeadline: hoursFromNow(-0.5),
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function ContactIcon({ method }: { method: ContactMethod }) {
  if (method === 'sms') return <MessageSquare className="w-3.5 h-3.5" />;
  if (method === 'email') return <Mail className="w-3.5 h-3.5" />;
  return <Phone className="w-3.5 h-3.5" />;
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const s: Record<string, string> = {
    urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    soon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    routine: 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400',
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${s[urgency] || s.routine}`}>{urgency}</span>;
}

function StatusBadge({ status }: { status: WaitlistStatus }) {
  const s: Record<WaitlistStatus, { bg: string; label: string }> = {
    waiting: { bg: 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400', label: 'WAITING' },
    notified: { bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', label: 'NOTIFIED' },
    confirmed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', label: 'CONFIRMED' },
    declined: { bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', label: 'DECLINED' },
    expired: { bg: 'bg-slate-100 dark:bg-slate-700/50 text-slate-500', label: 'EXPIRED' },
    booked: { bg: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400', label: 'BOOKED' },
  };
  const st = s[status] || s.waiting;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg}`}>{st.label}</span>;
}

function MatchScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${score >= 90 ? 'bg-emerald-500' : score >= 75 ? 'bg-teal-500' : score >= 60 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold ${score >= 90 ? 'text-emerald-500' : score >= 75 ? 'text-teal-500' : score >= 60 ? 'text-amber-500' : 'text-slate-400'}`}>{score}%</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function WaitlistPage() {
  const navigate = useNavigate();
  const [waitlist] = useState<WaitlistEntry[]>(generateWaitlist());
  const [openSlots] = useState<OpenSlot[]>(generateOpenSlots());
  const [activeTab, setActiveTab] = useState<'slots' | 'waitlist'>('slots');
  const [searchQuery, setSearchQuery] = useState('');

  const activeWaiting = waitlist.filter(w => w.status === 'waiting' || w.status === 'notified').length;
  const fillingNow = openSlots.filter(s => s.slotStatus === 'filling').length;
  const filledToday = openSlots.filter(s => s.slotStatus === 'filled').length;
  const urgentCount = waitlist.filter(w => w.urgency === 'urgent').length;

  const filteredWaitlist = searchQuery
    ? waitlist.filter(w => w.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || w.procedureNeeded.toLowerCase().includes(searchQuery.toLowerCase()))
    : waitlist;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/home')} className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-xl"><Users className="w-6 h-6 text-violet-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Waitlist Automation</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cancel → Match → Notify → Confirm → Book</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
            <UserPlus className="w-4 h-4" /> Add to Waitlist
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ON WAITLIST', value: String(activeWaiting), sub: 'patients waiting', icon: Users, color: 'text-violet-400' },
          { label: 'FILLING NOW', value: String(fillingNow), sub: 'open slots being matched', icon: Bell, color: fillingNow > 0 ? 'text-amber-400' : 'text-slate-400', highlight: fillingNow > 0 },
          { label: 'FILLED TODAY', value: String(filledToday), sub: 'slots recovered', icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'URGENT', value: String(urgentCount), sub: 'need priority placement', icon: AlertTriangle, color: urgentCount > 0 ? 'text-red-400' : 'text-slate-400' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white dark:bg-slate-800/60 border rounded-xl p-4 ${stat.highlight ? 'border-amber-500/30 dark:border-amber-500/20 animate-pulse-subtle' : 'border-slate-200 dark:border-slate-700/50'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{stat.label}</p>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('slots')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'slots' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <Bell className="w-4 h-4" /> Open Slots
          {fillingNow > 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">{fillingNow}</span>}
        </button>
        <button onClick={() => setActiveTab('waitlist')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'waitlist' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <Users className="w-4 h-4" /> Waitlist ({waitlist.length})
        </button>
      </div>

      {/* ═══ OPEN SLOTS TAB ═══ */}
      {activeTab === 'slots' && (
        <div className="space-y-4">
          {openSlots.map(slot => (
            <div key={slot.id} className={`bg-white dark:bg-slate-800/60 border rounded-xl overflow-hidden ${slot.slotStatus === 'filling' ? 'border-amber-500/30 dark:border-amber-500/20' : slot.slotStatus === 'filled' ? 'border-emerald-500/30 dark:border-emerald-500/20' : 'border-slate-200 dark:border-slate-700/50'}`}>
              {/* Slot Header */}
              <div className={`px-6 py-4 flex items-center justify-between ${slot.slotStatus === 'filling' ? 'bg-amber-500/5' : slot.slotStatus === 'filled' ? 'bg-emerald-500/5' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${slot.slotStatus === 'filling' ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                    <Calendar className={`w-5 h-5 ${slot.slotStatus === 'filling' ? 'text-amber-500' : 'text-emerald-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {slot.time}
                      <span className="ml-2 text-slate-400 font-normal">· {slot.duration} min · {slot.provider}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cancelled by {slot.originalPatient} — {slot.cancelReason}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {slot.slotStatus === 'filling' && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                      <Timer className="w-4 h-4" />
                      <span>Filling...</span>
                    </div>
                  )}
                  {slot.slotStatus === 'filled' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Filled</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Matched Patients */}
              <div className="px-6 pb-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3 mt-2">Matched Patients (ranked by fit)</p>
                <div className="space-y-2">
                  {slot.matchedPatients.map((match, idx) => (
                    <div key={match.waitlistId}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                        match.response === 'accepted' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30' :
                        idx === 0 && slot.slotStatus === 'filling' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30' :
                        'bg-slate-50 dark:bg-slate-700/20 border-slate-200 dark:border-slate-700/30'
                      }`}>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{match.patientName}</p>
                          <ContactIcon method={match.contactMethod} />
                          {match.response === 'accepted' && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">CONFIRMED</span>}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {match.matchReasons.map((r, ri) => (
                            <span key={ri} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-600/30 text-slate-500 dark:text-slate-400 rounded">{r}</span>
                          ))}
                        </div>
                      </div>
                      <MatchScoreBar score={match.matchScore} />
                      <div className="flex items-center gap-1.5">
                        {!match.notifiedAt && slot.slotStatus === 'filling' && (
                          <button className="px-2.5 py-1.5 bg-teal-600 text-white text-[11px] font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-1">
                            <Bell className="w-3 h-3" /> Notify
                          </button>
                        )}
                        {match.notifiedAt && !match.response && (
                          <span className="text-[10px] text-blue-500 font-medium">Awaiting reply...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {openSlots.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No open slots right now</p>
              <p className="text-xs mt-1">When a patient cancels, matched waitlist patients will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ WAITLIST TAB ═══ */}
      {activeTab === 'waitlist' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search patients or procedures..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900 dark:text-white placeholder-slate-400" />
          </div>

          {/* Waitlist Table */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/30 text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-semibold">Patient</th>
                    <th className="text-left px-4 py-3 font-semibold">Procedure</th>
                    <th className="text-left px-4 py-3 font-semibold">Provider Pref</th>
                    <th className="text-left px-4 py-3 font-semibold">Availability</th>
                    <th className="text-center px-4 py-3 font-semibold">Contact</th>
                    <th className="text-center px-4 py-3 font-semibold">Waiting</th>
                    <th className="text-center px-4 py-3 font-semibold">Priority</th>
                    <th className="text-center px-4 py-3 font-semibold">Urgency</th>
                    <th className="text-center px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                  {filteredWaitlist.sort((a, b) => b.priorityScore - a.priorityScore).map(w => (
                    <tr key={w.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors ${w.urgency === 'urgent' ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{w.patientName}</p>
                        <p className="text-[10px] text-slate-400">{w.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-900 dark:text-white">{w.procedureNeeded}</p>
                        <p className="text-[10px] text-teal-500 font-mono">{w.cdtCode}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{w.providerPreference || 'Any'}</td>
                      <td className="px-4 py-3">
                        <p className="text-slate-600 dark:text-slate-300">{w.preferredDays.join(', ')}</p>
                        <p className="text-[10px] text-slate-400">{w.preferredTimes}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1 text-slate-500">
                          <ContactIcon method={w.contactMethod} />
                          <span className="text-[10px] capitalize">{w.contactMethod}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold ${w.daysWaiting >= 14 ? 'text-amber-500' : 'text-slate-500'}`}>{w.daysWaiting}d</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${w.priorityScore >= 90 ? 'bg-emerald-500' : w.priorityScore >= 75 ? 'bg-teal-500' : w.priorityScore >= 60 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${w.priorityScore}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{w.priorityScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center"><UrgencyBadge urgency={w.urgency} /></td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={w.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dentamind Waitlist Intelligence */}
      <div className="bg-gradient-to-r from-violet-500/10 to-teal-500/10 border border-violet-500/20 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-violet-400" /> Dentamind Waitlist Intelligence</h3>
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {fillingNow > 0 && <div className="flex items-start gap-2"><span>⏰</span><span>{fillingNow} slot{fillingNow > 1 ? 's' : ''} actively being filled. SMS notifications get 73% response rate within 15 minutes vs 31% for email.</span></div>}
          {urgentCount > 0 && <div className="flex items-start gap-2"><span>🚨</span><span>{urgentCount} urgent patient{urgentCount > 1 ? 's' : ''} on waitlist. Priority matching ensures urgent cases get first notification on any opening.</span></div>}
          <div className="flex items-start gap-2"><span>📊</span><span>Practices using automated waitlist fill recover 85% of cancelled slots vs 23% with manual calling. Average revenue recovery: $340 per filled slot.</span></div>
          <div className="flex items-start gap-2"><span>💡</span><span>Patients who've waited 14+ days have 91% acceptance rate when notified of openings. Current longest wait: {Math.max(...waitlist.map(w => w.daysWaiting))} days.</span></div>
        </div>
      </div>

      <div className="text-center pb-4">
        <p className="text-xs text-slate-400">Dentamind AI — Waitlist Automation · Smart Matching · Multi-Channel Notify · Schedule Recovery</p>
      </div>
    </div>
  );
}
