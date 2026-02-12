import { useState } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  User,
  Phone,
  Mail,
  Calendar,
  Stethoscope,
  Star,
} from 'lucide-react';

// Mock providers data - providers endpoint requires auth
// TODO: Add providers query to Dentamind API
const mockProviders = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    title: 'DMD',
    specialty: 'General Dentistry',
    email: 'sarah.johnson@uishealth.com',
    phone: '(555) 123-4567',
    status: 'ACTIVE',
    appointmentsToday: 8,
    rating: 4.9,
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Chen',
    title: 'DDS',
    specialty: 'Orthodontics',
    email: 'michael.chen@uishealth.com',
    phone: '(555) 234-5678',
    status: 'ACTIVE',
    appointmentsToday: 6,
    rating: 4.8,
  },
  {
    id: '3',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    title: 'RDH',
    specialty: 'Dental Hygiene',
    email: 'emily.rodriguez@uishealth.com',
    phone: '(555) 345-6789',
    status: 'ACTIVE',
    appointmentsToday: 12,
    rating: 4.9,
  },
  {
    id: '4',
    firstName: 'James',
    lastName: 'Wilson',
    title: 'DDS',
    specialty: 'Periodontics',
    email: 'james.wilson@uishealth.com',
    phone: '(555) 456-7890',
    status: 'ACTIVE',
    appointmentsToday: 5,
    rating: 4.7,
  },
];

export default function ProvidersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [providers] = useState(mockProviders);

  const filteredProviders = providers.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Providers</h1>
          <p className="text-slate-500">{providers.length} team members</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Provider
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search providers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProviders.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>

      {filteredProviders.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No providers found matching your search
        </div>
      )}
    </div>
  );
}

function ProviderCard({ provider }: { provider: any }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-7 h-7 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900">
            Dr. {provider.firstName} {provider.lastName}, {provider.title}
          </h3>
          <p className="text-sm text-slate-500">{provider.specialty}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-medium text-slate-700">{provider.rating}</span>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          provider.status === 'ACTIVE' 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-slate-100 text-slate-600'
        }`}>
          {provider.status}
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Mail className="w-4 h-4 text-slate-400" />
          {provider.email}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Phone className="w-4 h-4 text-slate-400" />
          {provider.phone}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          {provider.appointmentsToday} appointments today
        </div>
      </div>

      <button className="mt-4 w-full py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
        View Schedule
      </button>
    </div>
  );
}
