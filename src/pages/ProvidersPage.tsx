import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Search, Plus, Mail, Calendar, UserCheck, AlertCircle, Stethoscope } from 'lucide-react';

const GET_PROVIDERS = gql`
  query GetProviders {
    providers {
      id
      firstName
      lastName
      abbreviation
      npi
      deaNumber
      stateLicense
      isHygienist
      isActive
      specialty
      email
    }
  }
`;

interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  abbreviation?: string;
  npi?: string;
  deaNumber?: string;
  stateLicense?: string;
  isHygienist?: boolean;
  isActive?: boolean;
  specialty?: string;
  email?: string;
}

const specialtyColors: Record<string, string> = {
  'General Dentistry': 'bg-blue-100 text-blue-700',
  'Orthodontics': 'bg-purple-100 text-purple-700',
  'Periodontics': 'bg-green-100 text-green-700',
  'Endodontics': 'bg-orange-100 text-orange-700',
  'Oral Surgery': 'bg-red-100 text-red-700',
  'Pediatric Dentistry': 'bg-pink-100 text-pink-700',
  'Prosthodontics': 'bg-teal-100 text-teal-700',
  'Hygienist': 'bg-cyan-100 text-cyan-700',
};

export default function ProvidersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, loading, error } = useQuery(GET_PROVIDERS);

  const providers: Provider[] = data?.providers || [];

  const filteredProviders = providers.filter((provider) => {
    const fullName = `${provider.firstName} ${provider.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      fullName.includes(search) ||
      provider.email?.toLowerCase().includes(search) ||
      provider.specialty?.toLowerCase().includes(search) ||
      provider.npi?.includes(search)
    );
  });

  const getProviderType = (provider: Provider): string => {
    if (provider.isHygienist) return 'Hygienist';
    if (provider.specialty) return provider.specialty;
    return 'General';
  };

  const getProviderTypeColor = (provider: Provider): string => {
    const type = getProviderType(provider);
    return specialtyColors[type] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Providers</h1>
          <p className="text-slate-500 mt-1">
            {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Provider
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search providers by name, email, specialty, or NPI..."
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
          <p className="text-red-700 font-medium">Error loading providers</p>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
        </div>
      )}

      {!loading && !error && filteredProviders.length === 0 && (
        <div className="text-center py-12">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No providers found</p>
        </div>
      )}

      {!loading && !error && filteredProviders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <div
              key={provider.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-lg font-semibold">
                  {provider.firstName?.[0]}
                  {provider.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 truncate">
                      Dr. {provider.firstName} {provider.lastName}
                    </h3>
                    {provider.isActive !== false && (
                      <UserCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  {provider.abbreviation && (
                    <p className="text-sm text-slate-500">{provider.abbreviation}</p>
                  )}
                  <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${getProviderTypeColor(provider)}`}>
                    {getProviderType(provider)}
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
                {provider.npi && (
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                      NPI: {provider.npi}
                    </span>
                  </p>
                )}
                {provider.stateLicense && (
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                      License: {provider.stateLicense}
                    </span>
                  </p>
                )}
                {provider.deaNumber && (
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                      DEA: {provider.deaNumber}
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
