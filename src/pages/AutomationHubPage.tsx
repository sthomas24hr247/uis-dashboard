import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Zap, Phone, Mail, MessageSquare, CheckCircle2,
  Clock, AlertTriangle, Play, Pause, Settings, Activity,
  Users, TrendingUp, Send, BarChart3, RefreshCw, Filter,
  ChevronRight, ExternalLink, Calendar, Target, Bell,
  Wifi, WifiOff, Server, XCircle,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY ACTION AUTOMATION HUB
// Live data from: api.uishealth.com/graphql
// Channels: ACS (primary) + GHL (fallback)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GraphQL Queries ─────────────────────────────────────────────────────────

const GET_ACTION_QUEUE = gql`
  query GetActionQueue($limit: Int) {
    actionQueue(limit: $limit) {
      id
      patientId
      patientName
      workflowType
      channel
      status
      priority
      estimatedRevenue
      attemptCount
      scheduledAt
      executedAt
      completedAt
      errorMessage
      createdAt
    }
  }
`;

const GET_ACTION_STATS = gql`
  query GetActionStats {
    actionQueueStats {
      queued
      completedToday
      failedToday
      revenueRecovered
      pipelineRevenue
    }
  }
`;

const GET_WORKFLOW_SUMMARY = gql`
  query GetWorkflowSummary {
    workflowSummary {
      workflowType
      totalActions
      completed
      failed
      revenueRecovered
      lastActionAt
    }
  }
`;

const GET_MESSAGING_HEALTH = gql`
  query GetMessagingHealth {
    messagingHealth {
      acs {
        connected
        phoneNumber
        email
      }
      ghl {
        enabled
        connected
      }
    }
    ghlStatus {
      connected
      locationName
      error
    }
  }
`;

const CANCEL_ACTION = gql`
  mutation CancelAction($actionId: ID!) {
    cancelAction(actionId: $actionId)
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const channelIcon: Record<string, any> = { sms: MessageSquare, email: Mail, phone: Phone, in_app: Bell };
const channelLabel: Record<string, string> = { sms: 'SMS', email: 'Email', phone: 'Phone', in_app: 'In-App' };

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  queued: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Queued' },
  executing: { color: 'bg-amber-100 text-amber-700', icon: Play, label: 'Executing' },
  completed: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'Completed' },
  failed: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Failed' },
  cancelled: { color: 'bg-slate-100 text-slate-600', icon: Pause, label: 'Cancelled' },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  urgent: { color: 'bg-red-500 text-white', label: 'Urgent' },
  high: { color: 'bg-orange-500 text-white', label: 'High' },
  medium: { color: 'bg-blue-500 text-white', label: 'Medium' },
  low: { color: 'bg-slate-400 text-white', label: 'Low' },
};

const workflowLabels: Record<string, string> = {
  waitlist_notify: 'Waitlist Notify',
  noshow_recovery: 'No-Show Recovery',
  treatment_acceptance: 'Treatment Acceptance',
  recall_reminder: 'Recall Reminder',
  claims_followup: 'Claims Follow-Up',
  balance_reminder: 'Balance Reminder',
  postop_check: 'Post-Op Check',
  birthday_greeting: 'Birthday Greeting',
  reactivation: 'Reactivation',
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AutomationHubPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'workflows' | 'integration'>('queue');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: queueData, loading: queueLoading, refetch: refetchQueue } = useQuery(GET_ACTION_QUEUE, {
    variables: { limit: 50 },
    pollInterval: 30000,
  });
  const { data: statsData, loading: statsLoading, refetch: refetchStats } = useQuery(GET_ACTION_STATS, {
    pollInterval: 30000,
  });
  const { data: workflowData, loading: workflowLoading } = useQuery(GET_WORKFLOW_SUMMARY);
  const { data: healthData, loading: healthLoading } = useQuery(GET_MESSAGING_HEALTH);

  const [cancelAction] = useMutation(CANCEL_ACTION, {
    onCompleted: () => { refetchQueue(); refetchStats(); },
  });

  const stats = statsData?.actionQueueStats || { queued: 0, completedToday: 0, failedToday: 0, revenueRecovered: 0, pipelineRevenue: 0 };
  const actions = queueData?.actionQueue || [];
  const workflows = workflowData?.workflowSummary || [];
  const health = healthData?.messagingHealth;
  const ghlStatus = healthData?.ghlStatus;

  const filteredActions = statusFilter === 'all' ? actions : actions.filter((a: any) => a.status === statusFilter);

  const handleRefresh = () => { refetchQueue(); refetchStats(); };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-teal-500" /> Automation Hub
          </h1>
          <p className="text-slate-500 mt-1">Patient communication workflows powered by Azure Communication Services</p>
        </div>
        <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Queued', value: stats.queued, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed Today', value: stats.completedToday, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Failed Today', value: stats.failedToday, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Revenue Recovered', value: formatCurrency(stats.revenueRecovered), icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Pipeline', value: formatCurrency(stats.pipelineRevenue), icon: Target, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map((kpi) => (
          <div key={kpi.label} className={`${kpi.bg} rounded-xl p-4 border border-slate-100`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{kpi.label}</span>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div className={`text-2xl font-bold ${kpi.color}`}>{statsLoading ? '...' : kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
        {(['queue', 'workflows', 'integration'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === tab ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'queue' ? 'Action Queue' : tab === 'workflows' ? 'Workflows' : 'Integration'}
          </button>
        ))}
      </div>

      {/* Action Queue Tab */}
      {activeTab === 'queue' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            {['all', 'queued', 'executing', 'completed', 'failed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  statusFilter === s ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== 'all' && ` (${actions.filter((a: any) => a.status === s).length})`}
              </button>
            ))}
          </div>

          {queueLoading ? (
            <div className="text-center py-16 text-slate-400">Loading action queue...</div>
          ) : filteredActions.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-600 mb-1">No Actions Yet</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Actions will appear here when workflows are triggered — such as waitlist notifications, 
                no-show follow-ups, and recall reminders. Connect a practice's PMS to start generating automated actions.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActions.map((action: any) => {
                const ChannelIcon = channelIcon[action.channel] || Send;
                const status = statusConfig[action.status] || statusConfig.queued;
                const priority = priorityConfig[action.priority] || priorityConfig.medium;
                const StatusIcon = status.icon;

                return (
                  <div key={action.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                          <ChannelIcon className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{action.patientName || `Patient ${action.patientId}`}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priority.color}`}>
                              {priority.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                            <span>{workflowLabels[action.workflowType] || action.workflowType}</span>
                            <span>·</span>
                            <span>{channelLabel[action.channel] || action.channel}</span>
                            <span>·</span>
                            <span>{timeAgo(action.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {action.estimatedRevenue > 0 && (
                          <span className="text-sm font-medium text-emerald-600">{formatCurrency(action.estimatedRevenue)}</span>
                        )}
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3" /> {status.label}
                        </span>
                        {action.status === 'queued' && (
                          <button
                            onClick={() => cancelAction({ variables: { actionId: action.id } })}
                            className="text-xs text-red-500 hover:text-red-700 transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    {action.errorMessage && (
                      <div className="mt-2 text-xs text-red-500 bg-red-50 rounded px-2 py-1">
                        Error: {action.errorMessage}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div>
          {workflowLoading ? (
            <div className="text-center py-16 text-slate-400">Loading workflows...</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(workflowLabels).map(([type, label]) => {
                const wf = workflows.find((w: any) => w.workflowType === type);
                return (
                  <div key={type} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                          <Zap className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{label}</h3>
                          <p className="text-sm text-slate-500">
                            {wf ? `${wf.totalActions} total · ${wf.completed} completed · ${wf.failed} failed` : 'No actions yet'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {wf && wf.revenueRecovered > 0 && (
                          <div className="text-right">
                            <div className="text-sm font-bold text-emerald-600">{formatCurrency(wf.revenueRecovered)}</div>
                            <div className="text-xs text-slate-400">recovered</div>
                          </div>
                        )}
                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </div>
                        {wf?.lastActionAt && (
                          <span className="text-xs text-slate-400">Last: {timeAgo(wf.lastActionAt)}</span>
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

      {/* Integration Tab */}
      {activeTab === 'integration' && (
        <div className="space-y-4">
          {healthLoading ? (
            <div className="text-center py-16 text-slate-400">Loading integration status...</div>
          ) : (
            <>
              {/* ACS Status */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-500" /> Azure Communication Services (Primary)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {health?.acs?.connected ? (
                        <Wifi className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium text-slate-700">Connection</span>
                    </div>
                    <div className={`text-lg font-bold ${health?.acs?.connected ? 'text-emerald-600' : 'text-red-600'}`}>
                      {health?.acs?.connected ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-slate-700">SMS Number</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900">{health?.acs?.phoneNumber || 'Not configured'}</div>
                    <div className="text-xs text-amber-500 mt-1">Toll-free verification pending</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-slate-700">Email Sender</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900">{health?.acs?.email || 'Not configured'}</div>
                    <div className="text-xs text-emerald-500 mt-1">Domain verified (SPF + DKIM)</div>
                  </div>
                </div>
              </div>

              {/* GHL Fallback Status */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-500" /> Go High Level (Fallback)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {health?.ghl?.connected ? (
                        <Wifi className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium text-slate-700">Connection</span>
                    </div>
                    <div className={`text-lg font-bold ${health?.ghl?.connected ? 'text-emerald-600' : 'text-red-600'}`}>
                      {health?.ghl?.connected ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-slate-700">Fallback Mode</span>
                    </div>
                    <div className={`text-lg font-bold ${health?.ghl?.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {health?.ghl?.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-slate-700">Location</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900">{ghlStatus?.locationName || 'Not configured'}</div>
                  </div>
                </div>
              </div>

              {/* Workflow Channels */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Channel Configuration</h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { channel: 'SMS', icon: MessageSquare, status: 'Pending Verification', color: 'text-amber-600', bg: 'bg-amber-50' },
                    { channel: 'Email', icon: Mail, status: 'Active', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { channel: 'Phone', icon: Phone, status: 'Coming Soon', color: 'text-slate-400', bg: 'bg-slate-50' },
                    { channel: 'In-App', icon: Bell, status: 'Active', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  ].map((ch) => (
                    <div key={ch.channel} className={`${ch.bg} rounded-lg p-4 text-center`}>
                      <ch.icon className={`w-8 h-8 ${ch.color} mx-auto mb-2`} />
                      <div className="font-medium text-slate-900">{ch.channel}</div>
                      <div className={`text-xs mt-1 ${ch.color}`}>{ch.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
