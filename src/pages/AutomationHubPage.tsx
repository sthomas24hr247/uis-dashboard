import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Zap, Phone, Mail, MessageSquare, CheckCircle2,
  Clock, AlertTriangle, Play, Pause, Settings, Activity,
  Users, TrendingUp, Send, BarChart3, RefreshCw, Filter,
  ChevronRight, ExternalLink, Calendar, Target, Bell,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY ACTION AUTOMATION HUB
// Integration: Go High Level (primary), Twilio (fallback), Azure Comms
// Channels: SMS, Email, Phone (AI-assisted), In-App Push
// ═══════════════════════════════════════════════════════════════════════════════

type Channel = 'sms' | 'email' | 'phone' | 'in_app';
type ActionStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'paused';
type ActionType = 'recall_reminder' | 'no_show_followup' | 'treatment_acceptance' | 'waitlist_notify' | 'claims_followup' | 'reactivation' | 'birthday' | 'balance_reminder' | 'post_op_check';
type WorkflowStatus = 'active' | 'paused' | 'draft';

interface AutomationAction {
  id: string;
  patientName: string;
  patientId: string;
  actionType: ActionType;
  channel: Channel;
  status: ActionStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  scheduledAt: string;
  completedAt?: string;
  message: string;
  estimatedRevenue?: number;
  attempts: number;
  maxAttempts: number;
  workflowId: string;
  response?: string;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  actionType: ActionType;
  trigger: string;
  channels: Channel[];
  status: WorkflowStatus;
  actionsToday: number;
  actionsThisWeek: number;
  successRate: number;
  revenueRecovered: number;
  isGHLConnected: boolean;
}

// ── Demo Data ────────────────────────────────────────────────────────────────

const actionTypeLabels: Record<ActionType, { label: string; emoji: string; color: string }> = {
  recall_reminder: { label: 'Recall Reminder', emoji: '📅', color: 'text-blue-500' },
  no_show_followup: { label: 'No-Show Follow-Up', emoji: '📞', color: 'text-red-500' },
  treatment_acceptance: { label: 'Treatment Acceptance', emoji: '💰', color: 'text-emerald-500' },
  waitlist_notify: { label: 'Waitlist Notification', emoji: '⏰', color: 'text-amber-500' },
  claims_followup: { label: 'Claims Follow-Up', emoji: '📋', color: 'text-purple-500' },
  reactivation: { label: 'Patient Reactivation', emoji: '🔄', color: 'text-teal-500' },
  birthday: { label: 'Birthday Greeting', emoji: '🎂', color: 'text-pink-500' },
  balance_reminder: { label: 'Balance Reminder', emoji: '💳', color: 'text-orange-500' },
  post_op_check: { label: 'Post-Op Check-In', emoji: '🩺', color: 'text-cyan-500' },
};

function generateActions(): AutomationAction[] {
  return [
    { id: 'a1', patientName: 'Nancy Williams', patientId: '7', actionType: 'no_show_followup', channel: 'sms', status: 'queued', priority: 'high', scheduledAt: new Date(Date.now() + 30 * 60000).toISOString(), message: 'Hi Nancy, we missed you at your appointment today. Would you like to reschedule? Reply YES or call us at (602) 555-0100.', estimatedRevenue: 285, attempts: 0, maxAttempts: 3, workflowId: 'wf2' },
    { id: 'a2', patientName: 'Emily Chen', patientId: '1', actionType: 'treatment_acceptance', channel: 'email', status: 'queued', priority: 'critical', scheduledAt: new Date(Date.now() + 60 * 60000).toISOString(), message: 'Emily, your recommended crown on tooth #14 is covered at 50% by Delta Dental. With $1,550 remaining in your annual benefits, now is the ideal time. Schedule today →', estimatedRevenue: 1250, attempts: 0, maxAttempts: 2, workflowId: 'wf3' },
    { id: 'a3', patientName: 'Tom Richardson', patientId: '8', actionType: 'no_show_followup', channel: 'phone', status: 'in_progress', priority: 'high', scheduledAt: new Date(Date.now() - 15 * 60000).toISOString(), message: 'AI-assisted call: "Hi Tom, this is a courtesy call from Bright Smiles Dental regarding your missed appointment. Press 1 to reschedule, 2 to speak with our team."', estimatedRevenue: 195, attempts: 1, maxAttempts: 3, workflowId: 'wf2' },
    { id: 'a4', patientName: 'Patricia Davis', patientId: '3', actionType: 'claims_followup', channel: 'email', status: 'completed', priority: 'medium', scheduledAt: new Date(Date.now() - 2 * 3600000).toISOString(), completedAt: new Date(Date.now() - 110 * 60000).toISOString(), message: 'Automated claim follow-up sent to Cigna for claim CIG-2025-88234 (Root Canal #19, $1,050). Narrative and X-ray attached.', estimatedRevenue: 1050, attempts: 1, maxAttempts: 1, workflowId: 'wf5', response: 'Email delivered, read receipt confirmed' },
    { id: 'a5', patientName: 'Lisa Thompson', patientId: '12', actionType: 'recall_reminder', channel: 'sms', status: 'completed', priority: 'medium', scheduledAt: new Date(Date.now() - 4 * 3600000).toISOString(), completedAt: new Date(Date.now() - 3.5 * 3600000).toISOString(), message: 'Hi Lisa! It\'s been 7 months since your last cleaning. Your insurance covers 100% of preventive care. Book online →', estimatedRevenue: 165, attempts: 1, maxAttempts: 2, workflowId: 'wf1', response: 'Patient clicked booking link' },
    { id: 'a6', patientName: 'James Wilson', patientId: '6', actionType: 'balance_reminder', channel: 'sms', status: 'completed', priority: 'low', scheduledAt: new Date(Date.now() - 24 * 3600000).toISOString(), completedAt: new Date(Date.now() - 23 * 3600000).toISOString(), message: 'James, you have an outstanding balance of $39.00 from your recent visit. Pay securely online →', attempts: 1, maxAttempts: 3, workflowId: 'wf8', response: 'Payment received: $39.00' },
    { id: 'a7', patientName: 'Maria Garcia', patientId: '5', actionType: 'treatment_acceptance', channel: 'sms', status: 'failed', priority: 'high', scheduledAt: new Date(Date.now() - 6 * 3600000).toISOString(), message: 'Maria, your ceramic crown (tooth #3) is pre-authorized by Guardian. Your estimated cost: $675. Schedule before March →', estimatedRevenue: 1350, attempts: 3, maxAttempts: 3, workflowId: 'wf3', response: 'No response after 3 attempts. Escalated to front desk.' },
    { id: 'a8', patientName: 'Robert Brown', patientId: '2', actionType: 'recall_reminder', channel: 'email', status: 'queued', priority: 'medium', scheduledAt: new Date(Date.now() + 3 * 3600000).toISOString(), message: 'Robert, your 6-month checkup is due. Note: You have only $180 remaining in your MetLife annual max — schedule soon to use it. Book now →', estimatedRevenue: 165, attempts: 0, maxAttempts: 2, workflowId: 'wf1' },
    { id: 'a9', patientName: 'Sarah Martinez', patientId: '10', actionType: 'waitlist_notify', channel: 'sms', status: 'completed', priority: 'high', scheduledAt: new Date(Date.now() - 45 * 60000).toISOString(), completedAt: new Date(Date.now() - 40 * 60000).toISOString(), message: 'Sarah! A 2:00 PM slot just opened tomorrow with Dr. Palmer — perfect for your crown. Reply YES to book instantly.', estimatedRevenue: 1350, attempts: 1, maxAttempts: 1, workflowId: 'wf4', response: 'Awaiting reply...' },
    { id: 'a10', patientName: 'David Kim', patientId: '11', actionType: 'post_op_check', channel: 'sms', status: 'queued', priority: 'medium', scheduledAt: new Date(Date.now() + 5 * 3600000).toISOString(), message: 'Hi David, how are you feeling after your procedure yesterday? If you have any concerns, reply here or call us at (602) 555-0100.', attempts: 0, maxAttempts: 1, workflowId: 'wf9' },
  ];
}

function generateWorkflows(): AutomationWorkflow[] {
  return [
    { id: 'wf1', name: 'Recall & Hygiene Reminders', description: 'Automated reminders for patients overdue for 6-month recall appointments', actionType: 'recall_reminder', trigger: 'Patient overdue for recall by 30+ days', channels: ['sms', 'email'], status: 'active', actionsToday: 4, actionsThisWeek: 18, successRate: 72, revenueRecovered: 2970, isGHLConnected: true },
    { id: 'wf2', name: 'No-Show Recovery', description: 'Multi-channel follow-up when patients miss appointments without cancelling', actionType: 'no_show_followup', trigger: 'Appointment marked as No-Show', channels: ['sms', 'phone'], status: 'active', actionsToday: 2, actionsThisWeek: 8, successRate: 58, revenueRecovered: 1540, isGHLConnected: true },
    { id: 'wf3', name: 'Treatment Plan Acceptance', description: 'Follow up on unscheduled treatment plans with insurance-aware messaging', actionType: 'treatment_acceptance', trigger: 'Treatment plan presented but not scheduled within 14 days', channels: ['email', 'sms'], status: 'active', actionsToday: 3, actionsThisWeek: 12, successRate: 34, revenueRecovered: 8750, isGHLConnected: true },
    { id: 'wf4', name: 'Waitlist Auto-Notify', description: 'Instantly notify matched waitlist patients when slots open', actionType: 'waitlist_notify', trigger: 'Appointment cancelled or no-show detected', channels: ['sms'], status: 'active', actionsToday: 1, actionsThisWeek: 5, successRate: 85, revenueRecovered: 1700, isGHLConnected: true },
    { id: 'wf5', name: 'Claims Follow-Up', description: 'Automated carrier follow-up for claims past 30 days', actionType: 'claims_followup', trigger: 'Claim age exceeds 30 days without resolution', channels: ['email'], status: 'active', actionsToday: 1, actionsThisWeek: 3, successRate: 68, revenueRecovered: 3150, isGHLConnected: false },
    { id: 'wf6', name: 'Patient Reactivation', description: 'Re-engage patients who haven\'t visited in 12+ months', actionType: 'reactivation', trigger: 'Last visit > 12 months, patient is active', channels: ['email', 'sms'], status: 'paused', actionsToday: 0, actionsThisWeek: 0, successRate: 22, revenueRecovered: 1320, isGHLConnected: true },
    { id: 'wf7', name: 'Birthday Greetings', description: 'Send personalized birthday messages with special offers', actionType: 'birthday', trigger: 'Patient birthday within 7 days', channels: ['sms', 'email'], status: 'active', actionsToday: 1, actionsThisWeek: 4, successRate: 95, revenueRecovered: 0, isGHLConnected: true },
    { id: 'wf8', name: 'Balance Reminders', description: 'Gentle reminders for outstanding patient balances', actionType: 'balance_reminder', trigger: 'Outstanding balance > $25 for 30+ days', channels: ['sms'], status: 'active', actionsToday: 2, actionsThisWeek: 9, successRate: 61, revenueRecovered: 890, isGHLConnected: true },
    { id: 'wf9', name: 'Post-Op Check-In', description: 'Automated wellness check after surgical or major procedures', actionType: 'post_op_check', trigger: '24 hours after surgical/major procedure', channels: ['sms'], status: 'active', actionsToday: 1, actionsThisWeek: 6, successRate: 88, revenueRecovered: 0, isGHLConnected: true },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function ChannelIcon({ channel, size = 'sm' }: { channel: Channel; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  if (channel === 'sms') return <MessageSquare className={cls} />;
  if (channel === 'email') return <Mail className={cls} />;
  if (channel === 'phone') return <Phone className={cls} />;
  return <Bell className={cls} />;
}

function StatusBadge({ status }: { status: ActionStatus }) {
  const s: Record<ActionStatus, { bg: string; label: string }> = {
    queued: { bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', label: 'QUEUED' },
    in_progress: { bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', label: 'IN PROGRESS' },
    completed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', label: 'COMPLETED' },
    failed: { bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', label: 'FAILED' },
    paused: { bg: 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400', label: 'PAUSED' },
  };
  const st = s[status] || s.queued;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg}`}>{st.label}</span>;
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-500', low: 'bg-slate-400' };
  return <span className={`w-2 h-2 rounded-full ${colors[priority] || colors.low}`} title={priority} />;
}

function WorkflowStatusBadge({ status }: { status: WorkflowStatus }) {
  if (status === 'active') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />ACTIVE</span>;
  if (status === 'paused') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-500">PAUSED</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500">DRAFT</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function AutomationHubPage() {
  const navigate = useNavigate();
  const [actions] = useState<AutomationAction[]>(generateActions());
  const [workflows] = useState<AutomationWorkflow[]>(generateWorkflows());
  const [activeTab, setActiveTab] = useState<'actions' | 'workflows' | 'ghl'>('actions');
  const [actionFilter, setActionFilter] = useState<'all' | ActionStatus>('all');

  const filteredActions = actions.filter(a => actionFilter === 'all' || a.status === actionFilter);
  const totalQueued = actions.filter(a => a.status === 'queued').length;
  const totalCompleted = actions.filter(a => a.status === 'completed').length;
  const totalRevenue = actions.filter(a => a.status === 'completed' && a.estimatedRevenue).reduce((s, a) => s + (a.estimatedRevenue || 0), 0);
  const pipelineRevenue = actions.filter(a => a.status === 'queued' || a.status === 'in_progress').reduce((s, a) => s + (a.estimatedRevenue || 0), 0);
  const activeWorkflows = workflows.filter(w => w.status === 'active').length;
  const weeklyRevenue = workflows.reduce((s, w) => s + w.revenueRecovered, 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/home')} className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl"><Zap className="w-6 h-6 text-orange-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Priority Action Automation</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Automated SMS, email, and phone outreach powered by Go High Level</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-xs font-semibold rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> GHL Connected
            </span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'QUEUED', value: String(totalQueued), sub: 'actions pending', icon: Clock, color: 'text-blue-400' },
          { label: 'COMPLETED TODAY', value: String(totalCompleted), sub: 'actions executed', icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'REVENUE RECOVERED', value: `$${(totalRevenue / 1000).toFixed(1)}K`, sub: 'from completed actions', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'PIPELINE', value: `$${(pipelineRevenue / 1000).toFixed(1)}K`, sub: 'potential from queued', icon: Target, color: 'text-amber-400' },
          { label: 'WEEKLY TOTAL', value: `$${(weeklyRevenue / 1000).toFixed(1)}K`, sub: `${activeWorkflows} active workflows`, icon: BarChart3, color: 'text-violet-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{stat.label}</p>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('actions')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'actions' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500'}`}>
          <Activity className="w-4 h-4" /> Action Queue
          {totalQueued > 0 && <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">{totalQueued}</span>}
        </button>
        <button onClick={() => setActiveTab('workflows')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'workflows' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500'}`}>
          <Settings className="w-4 h-4" /> Workflows ({activeWorkflows} active)
        </button>
        <button onClick={() => setActiveTab('ghl')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'ghl' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500'}`}>
          <ExternalLink className="w-4 h-4" /> Go High Level
        </button>
      </div>

      {/* ═══ ACTION QUEUE TAB ═══ */}
      {activeTab === 'actions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400">Status:</span>
            {(['all', 'queued', 'in_progress', 'completed', 'failed'] as const).map(s => {
              const count = s === 'all' ? actions.length : actions.filter(a => a.status === s).length;
              return (
                <button key={s} onClick={() => setActionFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${actionFilter === s ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white hover:bg-slate-600'}`}>
                  {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s} <span className="ml-1 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            {filteredActions.sort((a, b) => {
              const p = { critical: 0, high: 1, medium: 2, low: 3 };
              const sp = { in_progress: 0, queued: 1, failed: 2, completed: 3, paused: 4 };
              return (sp[a.status] - sp[b.status]) || (p[a.priority] - p[b.priority]);
            }).map(a => {
              const typeInfo = actionTypeLabels[a.actionType];
              return (
                <div key={a.id} className={`bg-white dark:bg-slate-800/60 border rounded-xl p-4 transition-all ${
                  a.status === 'in_progress' ? 'border-amber-500/30 dark:border-amber-500/20' :
                  a.status === 'failed' ? 'border-red-500/30 dark:border-red-500/20' :
                  'border-slate-200 dark:border-slate-700/50'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-lg">
                      {typeInfo.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PriorityDot priority={a.priority} />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{a.patientName}</p>
                        <span className={`text-[10px] font-semibold ${typeInfo.color}`}>{typeInfo.label}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><ChannelIcon channel={a.channel} /> {a.channel.toUpperCase()}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(a.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                        {a.estimatedRevenue && <span className="flex items-center gap-1 text-emerald-500 font-semibold"><TrendingUp className="w-3 h-3" /> ${a.estimatedRevenue.toLocaleString()}</span>}
                        <span>Attempt {a.attempts}/{a.maxAttempts}</span>
                      </div>
                      {a.response && (
                        <p className="text-[11px] mt-2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-slate-600 dark:text-slate-300 italic">{a.response}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {a.status === 'queued' && (
                        <>
                          <button className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 transition-colors" title="Execute Now">
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-500 transition-colors" title="Pause">
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {a.status === 'failed' && (
                        <button className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors" title="Retry">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ WORKFLOWS TAB ═══ */}
      {activeTab === 'workflows' && (
        <div className="space-y-3">
          {workflows.map(w => {
            const typeInfo = actionTypeLabels[w.actionType];
            return (
              <div key={w.id} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 hover:border-teal-500/30 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-lg">
                      {typeInfo.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{w.name}</h3>
                        <WorkflowStatusBadge status={w.status} />
                        {w.isGHLConnected && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full font-semibold">GHL</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{w.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Target className="w-3 h-3" /> Trigger: {w.trigger}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          {w.channels.map(ch => (
                            <span key={ch} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700/50 text-slate-500 rounded">
                              <ChannelIcon channel={ch} /> {ch}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1 flex-shrink-0 ml-4">
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <p className="text-slate-400 text-[10px]">Today / Week</p>
                        <p className="font-bold text-slate-900 dark:text-white">{w.actionsToday} / {w.actionsThisWeek}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px]">Success</p>
                        <p className={`font-bold ${w.successRate >= 70 ? 'text-emerald-500' : w.successRate >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{w.successRate}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px]">Revenue</p>
                        <p className="font-bold text-emerald-500">${w.revenueRecovered.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-2">
                      {w.status === 'active' ? (
                        <button className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-amber-500 transition-colors" title="Pause Workflow">
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 transition-colors" title="Activate Workflow">
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-500 transition-colors" title="Settings">
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ GO HIGH LEVEL TAB ═══ */}
      {activeTab === 'ghl' && (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-emerald-400">Go High Level Connected</h3>
                <p className="text-sm text-slate-400 mt-0.5">All-Access subscription active · API connected · Workflows synced</p>
              </div>
              <button className="px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2">
                <ExternalLink className="w-4 h-4" /> Open GHL Dashboard
              </button>
            </div>
          </div>

          {/* Channel Configuration */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-teal-400" /> Channel Configuration</h3>
            <div className="space-y-3">
              {[
                { channel: 'SMS / Text', icon: MessageSquare, provider: 'Go High Level', status: 'active', description: 'Appointment reminders, waitlist notifications, recall messages, balance reminders', rate: '~$0.015/message' },
                { channel: 'Email', icon: Mail, provider: 'Go High Level', status: 'active', description: 'Treatment plan links, educational content, claims follow-up, detailed communications', rate: 'Included in plan' },
                { channel: 'Phone (AI-Assisted)', icon: Phone, provider: 'Go High Level Voice', status: 'active', description: 'No-show follow-up calls, high-value treatment acceptance, recall for unreachable patients', rate: '~$0.05/minute' },
                { channel: 'In-App Notifications', icon: Bell, provider: 'UIS Health (Native)', status: 'active', description: 'Real-time staff alerts, action items, decision prompts', rate: 'Free' },
              ].map((ch, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/20 rounded-lg">
                  <div className="p-2 bg-teal-500/10 rounded-lg"><ch.icon className="w-5 h-5 text-teal-400" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{ch.channel}</p>
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full font-semibold">{ch.status.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{ch.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-white">{ch.provider}</p>
                    <p className="text-[10px] text-slate-400">{ch.rate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GHL Workflow Sync */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><RefreshCw className="w-4 h-4 text-teal-400" /> Workflow Sync Status</h3>
            <p className="text-xs text-slate-500 mb-4">UIS Health workflows are synced to Go High Level for execution. GHL handles message delivery, scheduling, and response tracking.</p>
            <div className="space-y-2">
              {workflows.filter(w => w.isGHLConnected).map(w => (
                <div key={w.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{actionTypeLabels[w.actionType].emoji}</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{w.name}</p>
                      <p className="text-[10px] text-slate-400">{w.actionsThisWeek} actions this week · {w.successRate}% success</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] text-emerald-500 font-semibold">Synced</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dentamind Automation Intelligence */}
      <div className="bg-gradient-to-r from-orange-500/10 to-teal-500/10 border border-orange-500/20 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-orange-400" /> Dentamind Automation Intelligence</h3>
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {pipelineRevenue > 0 && <div className="flex items-start gap-2"><span>💰</span><span>${pipelineRevenue.toLocaleString()} in revenue pipeline from {actions.filter(a => a.status === 'queued' || a.status === 'in_progress').length} queued actions. Treatment acceptance messages sent within 14 days of presentation have 3x higher conversion.</span></div>}
          {actions.some(a => a.status === 'failed') && <div className="flex items-start gap-2"><span>⚠️</span><span>{actions.filter(a => a.status === 'failed').length} failed action{actions.filter(a => a.status === 'failed').length > 1 ? 's' : ''} — consider switching channel. SMS has 98% delivery vs 85% for email. Phone follow-up recovers 42% of SMS non-responders.</span></div>}
          <div className="flex items-start gap-2"><span>📊</span><span>Practices using automated multi-channel outreach see 34% higher recall compliance and 28% more treatment acceptance vs manual follow-up alone.</span></div>
          <div className="flex items-start gap-2"><span>🎯</span><span>{activeWorkflows} of {workflows.length} workflows active. Consider activating "Patient Reactivation" — your practice has patients with 12+ months since last visit who represent an estimated $15K+ in potential production.</span></div>
        </div>
      </div>

      <div className="text-center pb-4">
        <p className="text-xs text-slate-400">Dentamind AI — Priority Action Automation · Go High Level · Multi-Channel Outreach · Revenue Recovery</p>
      </div>
    </div>
  );
}
