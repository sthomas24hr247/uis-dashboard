import { useQuery, gql } from '@apollo/client';
import {
  UserCog,
  RefreshCw,
  Plus,
  Calendar,
  Clock,
  Users,
  Star,
  Mail,
  Phone,
  AlertCircle,
} from 'lucide-react';

const GET_PROVIDERS = gql`
  query GetProviders {
    providers {
      providerId
      firstName
      lastName
      providerType
      npi
      email
      phone
      isActive
    }
  }
`;

const providerTypeColors: Record<string, string> = {
  'General Dentist': 'bg-blue-100 text-blue-700',
  'Hygienist': 'bg-emerald-100 text-emerald-700',
  'Orthodontist': 'bg-violet-100 text-violet-700',
  'Oral Surgeon': 'bg-amber-100 text-amber-700',
  'Periodontist': 'bg-rose-100 text-rose-700',
  'Endodontist': 'bg-cyan-100 text-cyan-700',
};

export default function ProvidersPage() {
  const { data, loading, error, refetch } = useQuery(GET_PROVIDERS, {
    fetchPolicy: 'cache-and-network',
  });

  const providers = data?.providers || [];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Providers</h1>
          <p className="text-slate-500">Manage your practice team</p>
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
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Provider</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-uis-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-uis-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{providers.length}</p>
              <p className="text-sm text-slate-500">Total Providers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserCog className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {providers.filter((p: any) => p.providerType === 'General Dentist').length}
              </p>
              <p className="text-sm text-slate-500">Dentists</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {providers.filter((p: any) => p.providerType === 'Hygienist').length}
              </p>
              <p className="text-sm text-slate-500">Hygienists</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {providers.filter((p: any) => p.isActive !== false).length}
              </p>
              <p className="text-sm text-slate-500">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Grid */}
      {loading && !data ? (
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-12 text-center">
          <div className="w-10 h-10 border-4 border-uis-200 border-t-uis-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading providers...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Failed to load providers</p>
          <button onClick={() => refetch()} className="btn-secondary">
            Try Again
          </button>
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-12 text-center">
          <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No providers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider: any) => (
            <div
              key={provider.providerId}
              className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-uis-400 to-uis-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                  {provider.firstName?.charAt(0)}{provider.lastName?.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Dr. {provider.firstName} {provider.lastName}
                  </h3>
                  <span className={`inline-block mt-1 badge ${
                    providerTypeColors[provider.providerType] || 'bg-slate-100 text-slate-700'
                  }`}>
                    {provider.providerType || 'General'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                {provider.email && (
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {provider.email}
                  </p>
                )}
                {provider.phone && (
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {provider.phone}
                  </p>
                )}
                {provider.npi && (
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                      NPI: {provider.npi}
                    </span>
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 btn-secondary !py-2 text-sm">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Schedule
                </button>
                <button className="flex-1 btn-secondary !py-2 text-sm">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
