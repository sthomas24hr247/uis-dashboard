import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Search, Plus, Phone, Mail, Calendar, ChevronRight, Users, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const GET_PATIENTS = gql`
  query GetPatients {
    patients(limit: 100) {
      id
      firstName
      lastName
      email
      phone
      dateOfBirth
      status
      lastVisitDate
      nextAppointmentDate
      balance
    }
  }
`;

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  status?: string;
  lastVisitDate?: string;
  nextAppointmentDate?: string;
  balance?: number;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  Active: 'bg-green-100 text-green-700',
  inactive: 'bg-slate-100 text-slate-600',
  Inactive: 'bg-slate-100 text-slate-600',
  pending: 'bg-yellow-100 text-yellow-700',
  Pending: 'bg-yellow-100 text-yellow-700',
};

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, loading, error } = useQuery(GET_PATIENTS);

  const patients: Patient[] = data?.patients || [];

  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      fullName.includes(search) ||
      patient.email?.toLowerCase().includes(search) ||
      patient.phone?.includes(search)
    );
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Patients</h1>
          <p className="text-slate-500 mt-1">
            {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search patients by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium">Error loading patients</p>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
        </div>
      )}

      {!loading && !error && filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No patients found</p>
        </div>
      )}

      {!loading && !error && filteredPatients.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Patient</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Last Visit</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Next Appt</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Balance</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-medium">
                        {patient.firstName?.[0]}
                        {patient.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {patient.firstName} {patient.lastName}
                        </p>
                        {patient.dateOfBirth && (
                          <p className="text-sm text-slate-500">
                            Age {calculateAge(patient.dateOfBirth)} • DOB {formatDate(patient.dateOfBirth)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {patient.phone && (
                        <p className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {patient.phone}
                        </p>
                      )}
                      {patient.email && (
                        <p className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {patient.email}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{formatDate(patient.lastVisitDate)}</p>
                  </td>
                  <td className="px-6 py-4">
                    {patient.nextAppointmentDate ? (
                      <p className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(patient.nextAppointmentDate)}
                      </p>
                    ) : (
                      <span className="text-sm text-slate-400">Not scheduled</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        statusColors[patient.status || ''] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {patient.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-medium ${
                        (patient.balance || 0) > 0 ? 'text-red-600' : 'text-slate-600'
                      }`}
                    >
                      ${(patient.balance || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/patients/${patient.id}`}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors inline-flex"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
