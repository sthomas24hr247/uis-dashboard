import { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  Search,
  Plus,
  RefreshCw,
  User,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Filter,
  Brain,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

// Dentrix sometimes prefixes archived or duplicate records with marks such as . ` +
const cleanName = (s: any) => String(s || '').replace(/^[^A-Za-z]+/, '');

// Using Dentamind query (works without auth)
const GET_PATIENTS = gql`
  query GetPatients($status: String, $search: String, $limit: Int, $offset: Int) {
    dentamindPatients(status: $status, search: $search, limit: $limit, offset: $offset) {
      id
      firstName
      lastName
      email
      phone
      dateOfBirth
      gender
      insuranceProvider
      status
      balance
      lastVisit
      nextAppointment
    }
  }
`;

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>('ACTIVE');
  const PAGE_SIZE = 50;
  const [page, setPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350); return () => clearTimeout(t); }, [searchQuery]);
  useEffect(() => { setPage(0); }, [debouncedSearch, statusFilter]);

  const { data, loading, error, refetch } = useQuery(GET_PATIENTS, {
    variables: {
      search: debouncedSearch || null,
      status: statusFilter,
      limit: PAGE_SIZE + 1,
      offset: page * PAGE_SIZE,
    },
    fetchPolicy: 'cache-and-network',
  });

  const fetched = data?.dentamindPatients || [];
  const hasNext = fetched.length > PAGE_SIZE;
  const patients = fetched.slice(0, PAGE_SIZE);
  const rangeStart = patients.length ? page * PAGE_SIZE + 1 : 0;
  const rangeEnd = page * PAGE_SIZE + patients.length;

  const [predictions, setPredictions] = useState<any[]>([]);
  useEffect(() => {
    apiFetch("/api/predictions/patients")
      .then(r => r.json())
      .then(d => setPredictions(d.predictions || []))
      .catch(() => {});
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading patients: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500">{statusFilter === 'ACTIVE' ? 'Active patients' : statusFilter === 'INACTIVE' ? 'Inactive patients' : 'All patients'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button disabled title="Patients sync automatically from Dentrix Ascend" className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed">
            <Plus className="w-4 h-4" />
            Add Patient
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>{patients.length ? `Showing ${rangeStart} to ${rangeEnd}` : 'No matching patients'}{statusFilter ? ` (${statusFilter === 'ACTIVE' ? 'active' : 'inactive'} patients)` : ''}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(pg => Math.max(0, pg - 1))} disabled={page === 0}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40">Previous</button>
          <button onClick={() => setPage(pg => pg + 1)} disabled={!hasNext}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40">Next</button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading && !data ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No patients found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Patient</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Insurance</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Last Visit</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Balance</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">AI Risk</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((patient: any) => (
                <PatientRow key={patient.id} patient={patient} prediction={predictions.find((p: any) => p.first_name?.toLowerCase() === patient.firstName?.toLowerCase() && p.last_name?.toLowerCase() === patient.lastName?.toLowerCase())} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PatientRow({ patient, prediction }: { patient: any; prediction?: any }) {
  const statusColor = String(patient.status || '').toUpperCase() === 'ACTIVE' 
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-slate-100 text-slate-600';

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">
              {cleanName(patient.firstName)} {cleanName(patient.lastName)}
            </p>
            <p className="text-sm text-slate-500">
              DOB: {patient.dateOfBirth || 'N/A'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          {patient.phone && (
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Phone className="w-3 h-3" />
              {patient.phone}
            </div>
          )}
          {patient.email && (
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <Mail className="w-3 h-3" />
              {patient.email}
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {patient.insuranceProvider || 'Not on file'}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {patient.lastVisit || 'None on record'}
      </td>
      <td className="px-4 py-3">
        <span className={`font-medium ${(patient.balance || 0) > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
          {patient.balance ? '$' + Number(patient.balance).toFixed(2) : '\u2014'}
        </span>
      </td>
      <td className="px-4 py-3">
        {prediction ? (
          <div className="flex flex-col gap-1">
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${prediction.cancel_risk_tier === "high" || prediction.cancel_risk_tier === "critical" ? "bg-red-100 text-red-700" : prediction.cancel_risk_tier === "moderate" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>CANCEL {(prediction.cancel_risk_score * 100).toFixed(0)}%</span>
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${prediction.acceptance_tier === "likely" ? "bg-emerald-100 text-emerald-700" : prediction.acceptance_tier === "possible" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{prediction.acceptance_tier?.toUpperCase()}</span>
            {(prediction.days_since_last_visit || 0) > 90 && <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">{prediction.days_since_last_visit}d AWAY</span>}
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {patient.status || 'ACTIVE'}
        </span>
      </td>
      <td className="px-4 py-3">
        <Link
          to={`/patients/${patient.id}`}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors inline-block"
        >
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>
      </td>
    </tr>
  );
}
