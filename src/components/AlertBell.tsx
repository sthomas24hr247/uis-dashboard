import { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Clock, Phone, Calendar, Send, FileText, DollarSign, X, ChevronRight } from 'lucide-react';

interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'moderate' | 'info';
  title: string;
  message: string;
  patient_name: string;
  patient_id: string;
  value_at_risk: number;
  days_stalled?: number;
  stage?: string;
  suggested_action: string;
  action_type: string;
  created_at: string;
}

interface AlertSummary {
  critical: number;
  high: number;
  moderate: number;
  total: number;
  total_value_at_risk: number;
}

export default function AlertBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary>({ critical: 0, high: 0, moderate: 0, total: 0, total_value_at_risk: 0 });
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';

  // Fetch alert count on mount and every 60 seconds
  useEffect(() => {
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchAlertCount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/outcome-gap/alerts/count`);
      if (res.ok) {
        const data = await res.json();
        setSummary(prev => ({ ...prev, ...data }));
      }
    } catch (e) { /* silent fail */ }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/outcome-gap/alerts?limit=20`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setSummary(data.summary || summary);
      }
    } catch (e) { /* silent fail */ }
    setLoading(false);
  };

  const toggleOpen = () => {
    if (!isOpen) fetchAlerts();
    setIsOpen(!isOpen);
  };

  const dismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));
  const badgeCount = Math.max(0, summary.total - dismissed.size);

  const severityColors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    moderate: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  const severityBg: Record<string, string> = {
    critical: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700/30',
    high: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700/30',
    moderate: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/30',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/30',
  };

  const actionIcons: Record<string, typeof Phone> = {
    call: Phone,
    schedule: Calendar,
    send_reminder: Send,
    review: FileText,
    collect: DollarSign,
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={toggleOpen}
        className="relative p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
        aria-label="Alerts"
      >
        <Bell className={`w-5 h-5 ${badgeCount > 0 ? 'text-slate-600 dark:text-slate-300' : ''}`} />
        {badgeCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 w-5 h-5 ${
            summary.critical > 0 ? 'bg-red-500' : summary.high > 0 ? 'bg-orange-500' : 'bg-amber-500'
          } text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse`}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Dentamind Alerts
              </h3>
              <div className="flex gap-1.5">
                {summary.critical > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {summary.critical} critical
                  </span>
                )}
                {summary.high > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    {summary.high} high
                  </span>
                )}
              </div>
            </div>
            {summary.total_value_at_risk > 0 && (
              <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">
                ${summary.total_value_at_risk.toLocaleString()} total revenue at risk
              </p>
            )}
          </div>

          {/* Alert List */}
          <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-uis-200 border-t-uis-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading alerts...</p>
              </div>
            ) : visibleAlerts.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No active alerts</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">All treatment episodes are on track</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {visibleAlerts.map(alert => {
                  const ActionIcon = actionIcons[alert.action_type] || FileText;
                  return (
                    <div key={alert.id} className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors`}>
                      <div className="flex items-start gap-2.5">
                        {/* Severity dot */}
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severityColors[alert.severity]}`} />
                        
                        <div className="flex-1 min-w-0">
                          {/* Title row */}
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                              {alert.title}
                            </p>
                            <button
                              onClick={() => dismiss(alert.id)}
                              className="text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 flex-shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          {/* Message */}
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {alert.message}
                          </p>

                          {/* Meta badges */}
                          <div className="flex items-center gap-2 mt-1.5">
                            {alert.value_at_risk > 0 && (
                              <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                                ${alert.value_at_risk.toLocaleString()} at risk
                              </span>
                            )}
                            {alert.days_stalled && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />{alert.days_stalled}d stalled
                              </span>
                            )}
                          </div>

                          {/* Action button */}
                          <button className={`mt-2 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${severityBg[alert.severity]}`}>
                            <ActionIcon className="w-3 h-3" />
                            {alert.suggested_action}
                            <ChevronRight className="w-3 h-3 ml-auto" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {visibleAlerts.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => { window.location.href = '/outcome-gap'; setIsOpen(false); }}
                className="text-xs font-medium text-uis-600 dark:text-uis-400 hover:underline w-full text-center"
              >
                View all in Outcome Gap Dashboard →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
