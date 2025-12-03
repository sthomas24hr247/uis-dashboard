import { useParams, Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Shield,
  CreditCard,
  FileText,
  Edit,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';

const GET_PATIENT = gql`
  query GetPatient($patientId: ID!) {
    patient(id: $patientId) {
      patientId
      firstName
      lastName
      dateOfBirth
      gender
      email
      phone
      address {
        street
        city
        state
        zip
      }
      status
      preferredProvider {
        providerId
        firstName
        lastName
      }
      appointments {
        appointmentId
        dateTime
        duration
        status
        provider {
          firstName
          lastName
        }
      }
      procedures {
        procedureId
        procedureCode
        description
        status
        completedDate
        fee
      }
      insurancePlans {
        planId
        payerName
        memberId
        groupNumber
        subscriberName
        annualMax
        annualUsed
      }
      balance
      createdAt
    }
  }
`;

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  
  const { data, loading, error } = useQuery(GET_PATIENT, {
    variables: { patientId },
    skip: !patientId,
  });

  const patient = data?.patient;

  const calculateAge = (dateOfBirth: string) => {
    try {
      return differenceInYears(new Date(), parseISO(dateOfBirth));
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-uis-200 border-t-uis-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading patient...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Failed to load patient</p>
          <Link to="/patients" className="btn-secondary">
            Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;

  return (
    <div className="space-y-6 animate-in">
      {/* Back button */}
      <Link
        to="/patients"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Patients
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-uis-400 to-uis-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-glow">
              {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                {age !== null && <span>{age} years old</span>}
                {patient.gender && <span>· {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</span>}
                <span className={`badge ${patient.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {patient.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Patient
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Info */}
        <div className="space-y-6">
          {/* Contact info */}
          <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              {patient.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="font-medium text-slate-900">{patient.phone}</p>
                  </div>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">{patient.email}</p>
                  </div>
                </div>
              )}
              {patient.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Date of Birth</p>
                    <p className="font-medium text-slate-900">
                      {format(parseISO(patient.dateOfBirth), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Address</p>
                    <p className="font-medium text-slate-900">
                      {patient.address.street}<br />
                      {patient.address.city}, {patient.address.state} {patient.address.zip}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Insurance */}
          <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-uis-600" />
              Insurance
            </h2>
            {patient.insurancePlans?.length > 0 ? (
              <div className="space-y-4">
                {patient.insurancePlans.map((plan: any) => (
                  <div key={plan.planId} className="p-4 bg-slate-50 rounded-xl">
                    <p className="font-semibold text-slate-900">{plan.payerName}</p>
                    <p className="text-sm text-slate-500 mt-1">Member ID: {plan.memberId}</p>
                    {plan.groupNumber && <p className="text-sm text-slate-500">Group: {plan.groupNumber}</p>}
                    {plan.annualMax && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">Annual Benefits</span>
                          <span className="font-medium">${plan.annualUsed || 0} / ${plan.annualMax}</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-uis-500 rounded-full"
                            style={{ width: `${((plan.annualUsed || 0) / plan.annualMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No insurance on file</p>
            )}
          </div>

          {/* Balance */}
          <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-uis-600" />
              Account Balance
            </h2>
            <p className="text-3xl font-bold text-slate-900">
              ${(patient.balance || 0).toFixed(2)}
            </p>
            {patient.balance > 0 && (
              <button className="btn-primary w-full mt-4">
                <CreditCard className="w-4 h-4 mr-2" />
                Collect Payment
              </button>
            )}
          </div>
        </div>

        {/* Right column - Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming appointments */}
          <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-uis-600" />
                Appointments
              </h2>
              <button className="text-sm text-uis-600 hover:text-uis-700 font-medium">
                + Schedule New
              </button>
            </div>
            {patient.appointments?.length > 0 ? (
              <div className="space-y-3">
                {patient.appointments.slice(0, 5).map((apt: any) => (
                  <div key={apt.appointmentId} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-sm font-bold text-slate-900">
                          {format(parseISO(apt.dateTime), 'MMM d')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(parseISO(apt.dateTime), 'h:mm a')}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {apt.provider ? `Dr. ${apt.provider.lastName}` : 'Unassigned'}
                        </p>
                        <p className="text-sm text-slate-500">{apt.duration} minutes</p>
                      </div>
                    </div>
                    <span className={`badge ${
                      apt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                      apt.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No appointments scheduled</p>
            )}
          </div>

          {/* Treatment history */}
          <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-uis-600" />
              Treatment History
            </h2>
            {patient.procedures?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Code</th>
                      <th className="pb-3 font-medium">Description</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {patient.procedures.slice(0, 10).map((proc: any) => (
                      <tr key={proc.procedureId} className="border-b border-slate-50">
                        <td className="py-3 text-slate-600">
                          {proc.completedDate ? format(parseISO(proc.completedDate), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="py-3 font-mono text-slate-900">{proc.procedureCode}</td>
                        <td className="py-3 text-slate-900">{proc.description}</td>
                        <td className="py-3">
                          <span className={`badge ${
                            proc.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                            proc.status === 'PLANNED' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {proc.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium text-slate-900">
                          ${(proc.fee || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No treatment history</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
