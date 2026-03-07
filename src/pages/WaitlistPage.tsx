import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Bell, Clock, CheckCircle2, XCircle, AlertTriangle,
  Phone, Mail, MessageSquare, Plus, Users, Calendar, Zap,
  ChevronRight, RefreshCw, Timer, UserPlus, Search,
  ArrowRight, Sparkles,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// WAITLIST AUTOMATION PAGE
// Live data from: api.uishealth.com/graphql
// Workflow: Cancel → Match waitlist → Notify via ACS → Confirm → Book
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GraphQL Queries ─────────────────────────────────────────────────────────

const GET_WAITLIST_SLOTS = gql`
  query GetWaitlistSlots {
    waitlistSlots {
      id
      practiceId
      originalPatientId
      providerId
      operatoryId
      slotDate
      slotTime
      duration
      procedureType
      status
      notifiedPatients
      confirmedPatientId
      createdAt
      expiresAt
    }
  }
`;

const GET_WAITLIST_ACTIONS = gql`
  query GetWaitlistActions {
    actionQueue(limit: 20) {
      id
      patientId
      patientName
      workflowType
      channel
      status
      priority
      estimatedRevenue
      attemptCount
      createdAt
      completedAt
      errorMessage
    }
  }
`;

const GET_DENTAMIND_PATIENTS = gql`
  query GetDentamindPatients($limit: Int) {
    dentamindPatients(limit: $limit) {
      id
      firstName
      lastName
      phone
      email
      riskScore
      lastVisit
      nextDue
      archetype
    }
  }
`;

const TRIGGER_WAITLIST_NOTIFY = gql`
  mutation TriggerWaitlistNotify(
    $workflowType: String!
    $patientId: String!
    $patientPhone: String
    $patientEmail: String
    $templateVars: String!
  ) {
    triggerWorkflow(
      workflowType: $workflowType
      patientId: $patientId
      patientPhone: $patientPhone
      patientEmail: $patientEmail
      templateVars: $templateVars
    ) {
      success
      actionId
      stepsScheduled
      error
    }
  }
`;

// ─── Types ───────────────────────────────────────────────────────────────────

type WaitlistStatus = 'waiting' | 'notified' | 'confirmed' | 'declined' | 'expired' | 'booked';
type SlotStatus = 'open' | 'filling' | 'filled' | 'expired';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  waiting: { color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock, label: 'Waiting' },
  notified: { color: 'text-amber-700', bg: 'bg-amber-100', icon: Bell, label: 'Notified' },
  confirmed: { color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2, label: 'Confirmed' },
  declined: { color: 'text-red-700', bg: 'bg-red-100', icon: XCircle, label: 'Declined' },
  expired: { color: 'text-slate-600', bg: 'bg-slate-100', icon: Timer, label: 'Expired' },
  booked: { color: 'text-teal-700', bg: 'bg-teal-100', icon: Calendar, label: 'Booked' },
};

const slotStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  open: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Open' },
  filling: { color: 'text-amber-700', bg: 'bg-amber-100', label: 'Filling' },
  filled: { color: 'text-slate-600', bg: 'bg-slate-100', label: 'Filled' },
  expired: { color: 'text-red-600', bg: 'bg-red-100', label: 'Expired' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTime(time: string): string {
  try {
    const [h, m] = time.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const hr12 = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
    return `${hr12}:${m} ${ampm}`;
  } catch {
    return time;
  }
}

// Demo waitlist entries (will be replaced by PMS integration data)
const demoWaitlistEntries = [
  {
    id: 'wl-1', patientId: 'P001', patientName: 'Maria Rodriguez', phone: '(555) 234-5678', email: 'maria.r@email.com',
    procedureNeeded: 'Cleaning', providerPreference: 'Dr. Sarah Palmer', preferredTimes: 'Morning',
    contactMethod: 'sms', dateAdded: '2026-02-28', daysWaiting: 7, urgency: 'routine' as const,
    status: 'waiting' as WaitlistStatus, priorityScore: 72,
  },
  {
    id: 'wl-2', patientId: 'P002', patientName: 'James Chen', phone: '(555) 345-6789', email: 'jchen@email.com',
    procedureNeeded: 'Crown Prep', providerPreference: 'Dr. Michael Torres', preferredTimes: 'Afternoon',
    contactMethod: 'email', dateAdded: '2026-03-01', daysWaiting: 6, urgency: 'soon' as const,
    status: 'waiting' as WaitlistStatus, priorityScore: 85,
  },
  {
    id: 'wl-3', patientId: 'P003', patientName: 'Sarah Mitchell', phone: '(555) 456-7890', email: 'sarah.m@email.com',
    procedureNeeded: 'Root Canal', providerPreference: 'Any', preferredTimes: 'Any',
    contactMethod: 'sms', dateAdded: '2026-02-25', daysWaiting: 10, urgency: 'urgent' as const,
    status: 'notified' as WaitlistStatus, priorityScore: 95,
  },
  {
    id: 'wl-4', patientId: 'P004', patientName: 'David Thompson', phone: '(555) 567-8901', email: 'dthompson@email.com',
    procedureNeeded: 'Cleaning', providerPreference: 'Dr. Sarah Palmer', preferredTimes: 'Morning',
    contactMethod: 'sms', dateAdded: '2026-03-03', daysWaiting: 4, urgency: 'routine' as const,
    status: 'confirmed' as WaitlistStatus, priorityScore: 60,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function WaitlistPage() {
  const [activeTab, setActiveTab] = useState<'waitlist' | 'slots' | 'history'>('waitlist');
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  const { data: slotsData, loading: slotsLoading, refetch: refetchSlots } = useQuery(GET_WAITLIST_SLOTS, {
    pollInterval: 30000,
  });
  const { data: actionsData } = useQuery(GET_WAITLIST_ACTIONS, {
    pollInterval: 30000,
  });

  const [triggerNotify] = useMutation(TRIGGER_WAITLIST_NOTIFY, {
    onCompleted: (data) => {
      setNotifyingId(null);
      if (data.triggerWorkflow.success) {
        alert(`Notification sent! Action ID: ${data.triggerWorkflow.actionId}`);
      } else {
        alert(`Failed: ${data.triggerWorkflow.error}`);
      }
      refetchSlots();
    },
    onError: (err) => {
      setNotifyingId(null);
      alert(`Error: ${err.message}`);
    },
  });

  const slots = slotsData?.waitlistSlots || [];
  const waitlistActions = (actionsData?.actionQueue || []).filter((a: any) => a.workflowType === 'waitlist_notify');

  // Use demo entries for now (PMS integration will replace)
  const entries = demoWaitlistEntries;

  const filteredEntries = entries.filter((e) => {
    const matchSearch = searchQuery === '' || e.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchUrgency = urgencyFilter === 'all' || e.urgency === urgencyFilter;
    return matchSearch && matchUrgency;
  });

  const handleNotify = (entry: typeof demoWaitlistEntries[0]) => {
    setNotifyingId(entry.id);
    triggerNotify({
      variables: {
        workflowType: 'waitlist_notify',
        patientId: entry.patientId,
        patientPhone: entry.phone.replace(/\D/g, ''),
        patientEmail: entry.email,
        templateVars: JSON.stringify({
          patientFirstName: entry.patientName.split(' ')[0],
          patientLastName: entry.patientName.split(' ').slice(1).join(' '),
          appointmentDate: 'Today',
          appointmentTime: '3:00 PM',
          providerName: entry.providerPreference || 'your provider',
          procedureType: entry.procedureNeeded,
          locationName: 'UIS Health Demo Practice',
          locationPhone: '(555) 100-0000',
          confirmationLink: 'https://uishealth.com/confirm',
        }),
      },
    });
  };

  // Stats
  const waitingCount = entries.filter(e => e.status === 'waiting').length;
  const notifiedCount = entries.filter(e => e.status === 'notified').length;
  const confirmedCount = entries.filter(e => e.status === 'confirmed').length;
  const openSlots = slots.filter((s: any) => s.status === 'open').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-500" /> Waitlist Automation
          </h1>
          <p className="text-slate-500 mt-1">Smart matching and automated notifications when slots open</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition">
            <UserPlus className="w-4 h-4" /> Add to Waitlist
          </button>
          <button onClick={() => refetchSlots()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Waiting', value: waitingCount, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Notified', value: notifiedCount, icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Confirmed', value: confirmedCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Open Slots', value: openSlots, icon: Calendar, color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map((kpi) => (
          <div key={kpi.label} className={`${kpi.bg} rounded-xl p-4 border border-slate-100`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{kpi.label}</span>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
        {(['waitlist', 'slots', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === tab ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'waitlist' ? 'Waitlist' : tab === 'slots' ? 'Open Slots' : 'Notification History'}
          </button>
        ))}
      </div>

      {/* Waitlist Tab */}
      {activeTab === 'waitlist' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {['all', 'urgent', 'soon', 'routine'].map((u) => (
              <button
                key={u}
                onClick={() => setUrgencyFilter(u)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  urgencyFilter === u ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {u === 'all' ? 'All' : u.charAt(0).toUpperCase() + u.slice(1)}
              </button>
            ))}
          </div>

          {filteredEntries.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-600 mb-1">No Waitlist Entries</h3>
              <p className="text-slate-400">Click "Add to Waitlist" to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.sort((a, b) => b.priorityScore - a.priorityScore).map((entry) => {
                const status = statusConfig[entry.status];
                const StatusIcon = status.icon;
                const urgencyColors: Record<string, string> = {
                  urgent: 'bg-red-500 text-white',
                  soon: 'bg-orange-500 text-white',
                  routine: 'bg-slate-400 text-white',
                };

                return (
                  <div key={entry.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-teal-600">{entry.priorityScore}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{entry.patientName}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgencyColors[entry.urgency]}`}>
                              {entry.urgency}
                            </span>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                              <StatusIcon className="w-3 h-3" /> {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                            <span>{entry.procedureNeeded}</span>
                            <span>·</span>
                            <span>{entry.providerPreference}</span>
                            <span>·</span>
                            <span>{entry.preferredTimes}</span>
                            <span>·</span>
                            <span>{entry.daysWaiting}d waiting</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm text-slate-400 mr-2">
                          {entry.contactMethod === 'sms' && <MessageSquare className="w-3 h-3" />}
                          {entry.contactMethod === 'email' && <Mail className="w-3 h-3" />}
                          {entry.contactMethod === 'phone' && <Phone className="w-3 h-3" />}
                          <span className="text-xs">{entry.contactMethod.toUpperCase()}</span>
                        </div>
                        {entry.status === 'waiting' && (
                          <button
                            onClick={() => handleNotify(entry)}
                            disabled={notifyingId === entry.id}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                              notifyingId === entry.id
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-teal-500 text-white hover:bg-teal-600'
                            }`}
                          >
                            {notifyingId === entry.id ? (
                              <><RefreshCw className="w-3 h-3 animate-spin" /> Sending...</>
                            ) : (
                              <><Bell className="w-3 h-3" /> Notify</>
                            )}
                          </button>
                        )}
                        {entry.status === 'notified' && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            <Timer className="w-3 h-3" /> Awaiting response
                          </div>
                        )}
                        {entry.status === 'confirmed' && (
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition">
                            <Calendar className="w-3 h-3" /> Book
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Data Source Notice */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Smart Matching Ready</h4>
              <p className="text-sm text-blue-700 mt-1">
                When connected to a PMS, the waitlist auto-populates from patient records. 
                Cancellations trigger smart matching — ranking patients by procedure fit, wait time, and urgency. 
                Notifications are sent via Azure Communication Services with GHL as fallback.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Open Slots Tab */}
      {activeTab === 'slots' && (
        <div>
          {slotsLoading ? (
            <div className="text-center py-16 text-slate-400">Loading open slots...</div>
          ) : slots.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-600 mb-1">No Open Slots</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Open slots appear here when appointments are cancelled. The system automatically 
                identifies the best waitlist matches and queues notifications.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot: any) => {
                const ss = slotStatusConfig[slot.status] || slotStatusConfig.open;
                return (
                  <div key={slot.id} className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">
                              {slot.slotDate} at {formatTime(slot.slotTime)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ss.bg} ${ss.color}`}>
                              {ss.label}
                            </span>
                          </div>
                          <div className="text-sm text-slate-500 mt-0.5">
                            {slot.procedureType} · {slot.duration} min · Provider {slot.providerId}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">
                          {slot.notifiedPatients || 0} notified
                        </span>
                        {slot.status === 'open' && (
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition">
                            <Zap className="w-3 h-3" /> Auto-Match
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notification History Tab */}
      {activeTab === 'history' && (
        <div>
          {waitlistActions.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-600 mb-1">No Notifications Sent Yet</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Notification history will appear here after waitlist notifications are triggered. 
                Click "Notify" on any waiting patient to send their first notification.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {waitlistActions.map((action: any) => {
                const actionStatus: Record<string, { color: string; bg: string; label: string }> = {
                  queued: { color: 'text-blue-700', bg: 'bg-blue-100', label: 'Queued' },
                  executing: { color: 'text-amber-700', bg: 'bg-amber-100', label: 'Sending' },
                  completed: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Delivered' },
                  failed: { color: 'text-red-700', bg: 'bg-red-100', label: 'Failed' },
                };
                const as = actionStatus[action.status] || actionStatus.queued;
                const ChannelIcon = action.channel === 'sms' ? MessageSquare : action.channel === 'email' ? Mail : Phone;

                return (
                  <div key={action.id} className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                          <ChannelIcon className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">{action.patientName || `Patient ${action.patientId}`}</span>
                          <div className="text-sm text-slate-500 mt-0.5">
                            {action.channel?.toUpperCase()} · {timeAgo(action.createdAt)}
                            {action.attemptCount > 1 && ` · Attempt ${action.attemptCount}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${as.bg} ${as.color}`}>
                          {as.label}
                        </span>
                      </div>
                    </div>
                    {action.errorMessage && (
                      <div className="mt-2 text-xs text-red-500 bg-red-50 rounded px-2 py-1">
                        {action.errorMessage}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
