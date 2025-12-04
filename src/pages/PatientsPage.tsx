import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  User,
  Phone,
  Mail,
  ChevronRight,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';

const GET_PATIENTS = gql`
  query GetPatients {
    patients {
      data {
        patientId
        firstName
        lastName
        dateOfBirth
        email
        phonePrimaryPrimary
        status
        createdAt
      }
      pageInfo {
        total
        hasMore
      }
    }
  }
`;

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-600',
  ARCHIVED: 'bg-amber-100 text-amber-700',
  DECEASED: 'bg-red-100 text-red-600',
};

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_PATIENTS, {
    fetchPolicy: 'cache-and-network',
  });

  const patients = data?.patients?.data || [];
  const totalCount = data?.patients?.pageInfo?.total || 0;

  // Filter patients
  const filteredPatients = patients.filter((patient: any) => {
    const matchesSearch =
      !searchQuery ||
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phonePrimary?.includes(searchQuery);
    
    const matchesStatus = !statusFilter || patient.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const calculateAge = (dateOfBirth: string) => {
    try {
      return differenceInYears(new Date(), parseISO(dateOfBirth));
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500">{totalCount} total patients</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="btn-secondary flex items-center gap-2 !py-2.5"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button className="btn-primary flex items-center gap-2 !py-2.5">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Patient</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phonePrimary..."
              className="input-field pl-12"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-uis-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
        {loading && !data ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-uis-200 border-t-uis-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Loading patients...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Failed to load patients</p>
            <button onClick={() => refetch()} className="btn-secondary">
              Try Again
            </button>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">No patients found</p>
            <p className="text-sm text-slate-400">
              {searchQuery ? 'Try a different search term' : 'Add your first patient to get started'}
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100 text-sm font-medium text-slate-500">
              <div className="col-span-4">Patient</div>
              <div className="col-span-2">Age</div>
              <div className="col-span-3">Contact</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1"></div>
            </div>

            {/* Patient rows */}
            <div className="divide-y divide-slate-100">
              {filteredPatients.map((patient: any) => {
                const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;
                
                return (
                  <Link
                    key={patient.patientId}
                    to={`/patients/${patient.patientId}`}
                    className="block hover:bg-slate-50 transition-colors"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center">
                      {/* Patient info */}
                      <div className="col-span-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-uis-400 to-uis-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                          {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-slate-500">
                            ID: {patient.patientId.slice(0, 8)}...
                          </p>
                        </div>
                      </div>

                      {/* Age */}
                      <div className="col-span-2">
                        {age !== null ? (
                          <div>
                            <p className="font-medium text-slate-900">{age} years</p>
                            <p className="text-sm text-slate-500">
                              {patient.dateOfBirth && format(parseISO(patient.dateOfBirth), 'MMM d, yyyy')}
                            </p>
                          </div>
                        ) : (
                          <p className="text-slate-400">—</p>
                        )}
                      </div>

                      {/* Contact */}
                      <div className="col-span-3">
                        <div className="space-y-1">
                          {patient.phonePrimary && (
                            <p className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-4 h-4 text-slate-400" />
                              {patient.phonePrimary}
                            </p>
                          )}
                          {patient.email && (
                            <p className="flex items-center gap-2 text-sm text-slate-600 truncate">
                              <Mail className="w-4 h-4 text-slate-400" />
                              {patient.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className={`badge ${statusColors[patient.status] || statusColors.ACTIVE}`}>
                          {patient.status || 'Active'}
                        </span>
                      </div>

                      {/* Action */}
                      <div className="col-span-1 text-right">
                        <ChevronRight className="w-5 h-5 text-slate-400 inline-block" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination placeholder */}
      {filteredPatients.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <p>Showing {filteredPatients.length} of {totalCount} patients</p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50" disabled>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
