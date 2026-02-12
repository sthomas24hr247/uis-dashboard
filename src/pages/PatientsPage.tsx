import { useState } from 'react';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_PATIENTS, {
    variables: {
      search: searchQuery || null,
      status: statusFilter,
      limit: 50,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });

  const patients = data?.dentamindPatients || [];

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
          <p className="text-slate-500">{patients.length} patients</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((patient: any) => (
                <PatientRow key={patient.id} patient={patient} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PatientRow({ patient }: { patient: any }) {
  const statusColor = patient.status === 'ACTIVE' 
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
              {patient.firstName} {patient.lastName}
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
        {patient.insuranceProvider || 'Self-Pay'}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {patient.lastVisit || 'Never'}
      </td>
      <td className="px-4 py-3">
        <span className={`font-medium ${(patient.balance || 0) > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
          ${(patient.balance || 0).toFixed(2)}
        </span>
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
