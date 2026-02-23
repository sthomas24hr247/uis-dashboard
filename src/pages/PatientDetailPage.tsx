import { useParams, Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  MapPin,
  CreditCard,
  Edit,
  AlertCircle,
  DollarSign,
  Brain,
  Activity,
} from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';

const GET_PATIENT = gql`
  query GetPatient($patientId: ID!) {
    dentamindPatient(id: $patientId) {
      id
      firstName
      lastName
      dateOfBirth
      gender
      email
      phone
      address
      status
      balance
      lastVisit
      nextAppointment
    }
  }
`;

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { data, loading, error } = useQuery(GET_PATIENT, {
    variables: { patientId },
    skip: !patientId,
  });
  const patient = data?.dentamindPatient;

  const API_URL = import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'https://api.uishealth.com';
  const [prediction, setPrediction] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);

  useEffect(() => {
    if (!patient) return;
    fetch(`${API_URL}/api/predictions/patients`)
      .then(r => r.json())
      .then(d => {
        const match = d.predictions?.find((p: any) =>
          p.first_name?.toLowerCase() === patient.firstName?.toLowerCase() &&
          p.last_name?.toLowerCase() === patient.lastName?.toLowerCase()
        );
        if (match) setPrediction(match);
      }).catch(() => {});
    fetch(`${API_URL}/api/outcome-gap/stalled?min_days=0`)
      .then(r => r.json())
      .then(d => {
        const patientEps = d.stalled_episodes?.filter((e: any) =>
          e.first_name?.toLowerCase() === patient.firstName?.toLowerCase() &&
          e.last_name?.toLowerCase() === patient.lastName?.toLowerCase()
        ) || [];
        setEpisodes(patientEps);
      }).catch(() => {});
  }, [patient]);

  const calculateAge = (dob: string) => { try { return differenceInYears(new Date(), parseISO(dob)); } catch { return null; } };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-uis-200 border-t-uis-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">Loading patient...</p>
      </div>
    </div>
  );

  if (error || !patient) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 mb-4">Failed to load patient</p>
        <Link to="/patients" className="btn-secondary">Back to Patients</Link>
      </div>
    </div>
  );

  const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/patients" className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-14 h-14 bg-gradient-to-br from-uis-500 to-uis-700 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {patient.firstName?.[0]}{patient.lastName?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{patient.firstName} {patient.lastName}</h1>
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              {age && <span>{age} years old</span>}
              {patient.gender && <span>· {patient.gender}</span>}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${patient.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600'}`}>
                {patient.status}
              </span>
            </div>
          </div>
        </div>
        <button className="btn-secondary flex items-center gap-2"><Edit className="w-4 h-4" />Edit Patient</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Contact Information</h2>
            <div className="space-y-4">
              {patient.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center"><Phone className="w-5 h-5 text-slate-600 dark:text-slate-300" /></div>
                  <div><p className="text-sm text-slate-500 dark:text-slate-400">Phone</p><p className="font-medium text-slate-900 dark:text-white">{patient.phone}</p></div>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center"><Mail className="w-5 h-5 text-slate-600 dark:text-slate-300" /></div>
                  <div><p className="text-sm text-slate-500 dark:text-slate-400">Email</p><p className="font-medium text-slate-900 dark:text-white">{patient.email}</p></div>
                </div>
              )}
              {patient.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5 text-slate-600 dark:text-slate-300" /></div>
                  <div><p className="text-sm text-slate-500 dark:text-slate-400">Date of Birth</p><p className="font-medium text-slate-900 dark:text-white">{format(parseISO(patient.dateOfBirth), 'MMMM d, yyyy')}</p></div>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-slate-600 dark:text-slate-300" /></div>
                  <div><p className="text-sm text-slate-500 dark:text-slate-400">Address</p><p className="font-medium text-slate-900 dark:text-white">{patient.address}</p></div>
                </div>
              )}
            </div>
          </div>

          {/* Balance */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-uis-600" />Account Balance</h2>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">${(patient.balance || 0).toFixed(2)}</p>
            {patient.balance > 0 && (<button className="btn-primary w-full mt-4"><CreditCard className="w-4 h-4 mr-2" />Collect Payment</button>)}
          </div>

          {/* AI Predictions */}
          {prediction && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-700/30 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-indigo-600" />Dentamind Predictions</h2>
              <div className="space-y-3">
                {[
                  { label: 'Cancel Risk', tier: prediction.cancel_risk_tier, extra: `(${(prediction.cancel_risk_score * 100).toFixed(0)}%)` },
                  { label: 'Acceptance', tier: prediction.acceptance_tier, extra: '' },
                  { label: 'OOP Willing', tier: prediction.oop_willingness_tier, extra: `(max $${prediction.oop_threshold_estimate?.toLocaleString()})` },
                  { label: 'Attrition', tier: prediction.attrition_risk_tier, extra: '' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      ['high','critical','unlikely'].includes(item.tier) ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      ['moderate','possible'].includes(item.tier) ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>{item.tier?.toUpperCase()} {item.extra}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-indigo-200 dark:border-indigo-700/30 flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Channel</span>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 capitalize">{prediction.preferred_channel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Days Since Visit</span>
                  <span className={`text-sm font-bold ${(prediction.days_since_last_visit || 0) > 90 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>{prediction.days_since_last_visit}d</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visit Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-uis-600" />Visit Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Last Visit</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{patient.lastVisit ? format(parseISO(patient.lastVisit), 'MMM d, yyyy') : 'No visits'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Next Appointment</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{patient.nextAppointment ? format(parseISO(patient.nextAppointment), 'MMM d, yyyy') : 'None scheduled'}</p>
              </div>
            </div>
          </div>

          {/* Stalled Episodes */}
          {episodes.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-600" />Treatment Episodes at Risk
                <span className="ml-auto text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">{episodes.length} stalled</span>
              </h2>
              <div className="space-y-3">
                {episodes.map((ep: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{ep.stalled_at_stage?.replace(/_/g,' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} Gap</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Stalled {ep.days_stalled}d at {ep.stalled_at_stage}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 text-sm">${(ep.plan_value || 0).toLocaleString()}</p>
                      <p className="text-xs text-slate-500">at risk</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Calendar, label: 'Schedule' },
                { icon: Phone, label: 'Call' },
                { icon: Mail, label: 'Email' },
                { icon: CreditCard, label: 'Payment' },
              ].map((a, i) => (
                <button key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-uis-50 dark:hover:bg-uis-900/20 transition-colors group">
                  <a.icon className="w-6 h-6 text-slate-400 group-hover:text-uis-600" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
