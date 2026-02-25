import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Play, Search, Filter, Send, Monitor,
  CheckCircle2, Clock, Video, FileText, Link2, ExternalLink,
  ChevronRight, ChevronDown, X, Zap, Mail, MessageSquare,
  Eye, Star, ThumbsUp, Users, Calendar, Settings,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// EDUCATIONAL RESOURCES PAGE
// Features: Video Library, In-Chair Playback, Auto-Send, Treatment Plan Links
// Architecture: Demo content now, CMS integration later
// ═══════════════════════════════════════════════════════════════════════════════

type ContentType = 'video' | 'article' | 'infographic' | 'interactive';
type Category = 'preventive' | 'restorative' | 'endodontic' | 'periodontic' | 'prosthodontic' | 'orthodontic' | 'surgical' | 'pediatric';

interface EducationalContent {
  id: string;
  title: string;
  description: string;
  category: Category;
  cdtCodes: string[];
  contentType: ContentType;
  duration?: string;
  thumbnailEmoji: string;
  videoUrl?: string;
  sourceLabel: string;
  language: string[];
  patientFacing: boolean;
  providerFacing: boolean;
  autoSendEnabled: boolean;
  viewCount: number;
  rating: number;
}

interface ScheduledSend {
  id: string;
  patientName: string;
  procedure: string;
  cdtCode: string;
  contentTitle: string;
  appointmentDate: string;
  sendDate: string;
  channel: 'sms' | 'email';
  status: 'sent' | 'scheduled' | 'opened' | 'watched';
}

// ── Demo Data ────────────────────────────────────────────────────────────────

const categoryLabels: Record<Category, { label: string; color: string }> = {
  preventive: { label: 'Preventive', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  restorative: { label: 'Restorative', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  endodontic: { label: 'Endodontic', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  periodontic: { label: 'Periodontic', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  prosthodontic: { label: 'Prosthodontic', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  orthodontic: { label: 'Orthodontic', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  surgical: { label: 'Surgical', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  pediatric: { label: 'Pediatric', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
};

function generateContent(): EducationalContent[] {
  return [
    { id: 'e1', title: 'What to Expect During Your Dental Cleaning', description: 'A friendly walkthrough of the prophylaxis procedure, from initial exam to polishing. Helps reduce patient anxiety and sets expectations.', category: 'preventive', cdtCodes: ['D1110', 'D1120', 'D0120'], contentType: 'video', duration: '3:24', thumbnailEmoji: '🪥', sourceLabel: 'ADA Patient Library', language: ['English', 'Spanish'], patientFacing: true, providerFacing: false, autoSendEnabled: true, viewCount: 1284, rating: 4.8 },
    { id: 'e2', title: 'Understanding Dental X-Rays & Their Safety', description: 'Explains why X-rays are needed, radiation levels compared to everyday exposure, and what dentists look for on radiographs.', category: 'preventive', cdtCodes: ['D0210', 'D0274', 'D0330'], contentType: 'video', duration: '2:45', thumbnailEmoji: '📸', sourceLabel: 'ADA Patient Library', language: ['English'], patientFacing: true, providerFacing: false, autoSendEnabled: true, viewCount: 892, rating: 4.6 },
    { id: 'e3', title: 'Dental Fillings: Composite vs Amalgam', description: 'Compares filling materials, explains the procedure step by step, and covers aftercare instructions including sensitivity management.', category: 'restorative', cdtCodes: ['D2140', 'D2150', 'D2330', 'D2331', 'D2332', 'D2391', 'D2392'], contentType: 'video', duration: '4:12', thumbnailEmoji: '🦷', sourceLabel: 'DentalCare.com', language: ['English', 'Spanish'], patientFacing: true, providerFacing: true, autoSendEnabled: true, viewCount: 1056, rating: 4.7 },
    { id: 'e4', title: 'Crown Preparation & What to Expect', description: 'Full walkthrough of the crown procedure from preparation to cementation. Covers temporary crowns, impressions, and the final fitting.', category: 'restorative', cdtCodes: ['D2740', 'D2750', 'D2751', 'D2752'], contentType: 'video', duration: '5:30', thumbnailEmoji: '👑', sourceLabel: 'Spear Education', language: ['English'], patientFacing: true, providerFacing: true, autoSendEnabled: true, viewCount: 1432, rating: 4.9 },
    { id: 'e5', title: 'Root Canal Treatment Explained', description: 'Demystifies root canal therapy. Explains why it\'s needed, what happens during the procedure, and recovery expectations. Addresses common fears.', category: 'endodontic', cdtCodes: ['D3310', 'D3320', 'D3330'], contentType: 'video', duration: '4:48', thumbnailEmoji: '🔬', sourceLabel: 'AAE Patient Education', language: ['English', 'Spanish', 'Mandarin'], patientFacing: true, providerFacing: false, autoSendEnabled: true, viewCount: 2103, rating: 4.8 },
    { id: 'e6', title: 'Periodontal Disease: Stages & Treatment', description: 'Explains gingivitis vs periodontitis, shows what scaling and root planing involves, and emphasizes the importance of follow-up maintenance.', category: 'periodontic', cdtCodes: ['D4341', 'D4342', 'D4355', 'D4910'], contentType: 'video', duration: '6:15', thumbnailEmoji: '🩺', sourceLabel: 'AAP Patient Resources', language: ['English', 'Spanish'], patientFacing: true, providerFacing: true, autoSendEnabled: true, viewCount: 876, rating: 4.5 },
    { id: 'e7', title: 'Dental Implants: A Complete Guide', description: 'Covers the entire implant journey from consultation to final restoration. Includes timeline expectations, costs, and success rates.', category: 'prosthodontic', cdtCodes: ['D6010', 'D6056', 'D6058', 'D6065'], contentType: 'video', duration: '7:20', thumbnailEmoji: '🔩', sourceLabel: 'AAID Patient Education', language: ['English'], patientFacing: true, providerFacing: true, autoSendEnabled: false, viewCount: 1567, rating: 4.9 },
    { id: 'e8', title: 'Tooth Extraction: Before, During & After', description: 'What to expect before, during, and after a tooth extraction. Covers simple and surgical extractions, anesthesia options, and recovery tips.', category: 'surgical', cdtCodes: ['D7140', 'D7210', 'D7220', 'D7230'], contentType: 'video', duration: '4:05', thumbnailEmoji: '⚕️', sourceLabel: 'AAOMS', language: ['English', 'Spanish'], patientFacing: true, providerFacing: false, autoSendEnabled: true, viewCount: 1890, rating: 4.7 },
    { id: 'e9', title: 'Fluoride Treatment Benefits for Children', description: 'Explains why fluoride is important for developing teeth, how professional fluoride treatments work, and at-home fluoride guidance for parents.', category: 'pediatric', cdtCodes: ['D1206', 'D1208'], contentType: 'video', duration: '2:30', thumbnailEmoji: '👶', sourceLabel: 'AAPD', language: ['English', 'Spanish'], patientFacing: true, providerFacing: false, autoSendEnabled: true, viewCount: 654, rating: 4.6 },
    { id: 'e10', title: 'Orthodontic Options: Braces vs Clear Aligners', description: 'Compares traditional braces, ceramic braces, and clear aligners. Covers treatment timelines, cost ranges, and maintenance requirements.', category: 'orthodontic', cdtCodes: ['D8080', 'D8090'], contentType: 'video', duration: '5:55', thumbnailEmoji: '😁', sourceLabel: 'AAO Patient Library', language: ['English'], patientFacing: true, providerFacing: false, autoSendEnabled: false, viewCount: 723, rating: 4.4 },
    { id: 'e11', title: 'Post-Operative Care: Surgical Extractions', description: 'Detailed aftercare instructions following surgical extractions. Covers bleeding control, pain management, diet, and warning signs.', category: 'surgical', cdtCodes: ['D7210', 'D7220', 'D7230', 'D7240'], contentType: 'article', thumbnailEmoji: '📋', sourceLabel: 'Practice Custom', language: ['English', 'Spanish'], patientFacing: true, providerFacing: false, autoSendEnabled: true, viewCount: 445, rating: 4.3 },
    { id: 'e12', title: 'Understanding Your Dental Insurance Benefits', description: 'Helps patients understand annual maximums, deductibles, coverage tiers, and how to maximize their dental benefits before year-end.', category: 'preventive', cdtCodes: [], contentType: 'infographic', thumbnailEmoji: '💰', sourceLabel: 'Practice Custom', language: ['English'], patientFacing: true, providerFacing: false, autoSendEnabled: false, viewCount: 2340, rating: 4.8 },
  ];
}

function generateScheduledSends(): ScheduledSend[] {
  return [
    { id: 's1', patientName: 'Emily Chen', procedure: 'Crown - Ceramic #14', cdtCode: 'D2740', contentTitle: 'Crown Preparation & What to Expect', appointmentDate: '2026-03-05', sendDate: '2026-03-03', channel: 'email', status: 'scheduled' },
    { id: 's2', patientName: 'Robert Brown', procedure: 'Periodic Eval + BWX', cdtCode: 'D0120', contentTitle: 'What to Expect During Your Dental Cleaning', appointmentDate: '2026-02-28', sendDate: '2026-02-26', channel: 'sms', status: 'sent' },
    { id: 's3', patientName: 'Patricia Davis', procedure: 'Root Canal #19', cdtCode: 'D3330', contentTitle: 'Root Canal Treatment Explained', appointmentDate: '2026-03-12', sendDate: '2026-03-10', channel: 'email', status: 'scheduled' },
    { id: 's4', patientName: 'John Smith', procedure: 'Prophylaxis Adult', cdtCode: 'D1110', contentTitle: 'What to Expect During Your Dental Cleaning', appointmentDate: '2026-02-25', sendDate: '2026-02-23', channel: 'sms', status: 'watched' },
    { id: 's5', patientName: 'Maria Garcia', procedure: 'SRP - 2 Quadrants', cdtCode: 'D4341', contentTitle: 'Periodontal Disease: Stages & Treatment', appointmentDate: '2026-03-08', sendDate: '2026-03-06', channel: 'email', status: 'opened' },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function ContentTypeIcon({ type }: { type: ContentType }) {
  if (type === 'video') return <Video className="w-3.5 h-3.5" />;
  if (type === 'article') return <FileText className="w-3.5 h-3.5" />;
  if (type === 'infographic') return <Eye className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
}

function SendStatusBadge({ status }: { status: ScheduledSend['status'] }) {
  const styles: Record<string, { bg: string; label: string }> = {
    scheduled: { bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', label: 'SCHEDULED' },
    sent: { bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', label: 'SENT' },
    opened: { bg: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400', label: 'OPENED' },
    watched: { bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', label: 'WATCHED' },
  };
  const s = styles[status] || styles.scheduled;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg}`}>{s.label}</span>;
}

// ── In-Chair Playback Modal ──────────────────────────────────────────────────

function InChairModal({ content, onClose }: { content: EducationalContent; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/80">
        <div className="flex items-center gap-3">
          <Monitor className="w-5 h-5 text-teal-400" />
          <span className="text-white font-semibold text-sm">In-Chair Playback Mode</span>
          <span className="text-slate-400 text-xs">— Present to patient</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-8">
          <div className="w-32 h-32 rounded-3xl bg-slate-800 flex items-center justify-center mx-auto mb-8">
            <span className="text-6xl">{content.thumbnailEmoji}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">{content.title}</h1>
          <p className="text-lg text-slate-300 mb-8">{content.description}</p>
          {content.contentType === 'video' && (
            <button className="inline-flex items-center gap-3 px-8 py-4 bg-teal-600 text-white text-lg font-semibold rounded-2xl hover:bg-teal-700 transition-colors">
              <Play className="w-6 h-6" /> Play Video {content.duration && `(${content.duration})`}
            </button>
          )}
          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400" /> {content.rating}/5</span>
            <span>·</span>
            <span>{content.language.join(', ')}</span>
            <span>·</span>
            <span>{content.sourceLabel}</span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-6 py-4 bg-black/80 flex items-center justify-center gap-4">
        <span className="text-xs text-slate-500">Powered by Dentamind AI — UIS Health Educational Resources</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function EducationalResourcesPage() {
  const navigate = useNavigate();
  const [content] = useState<EducationalContent[]>(generateContent());
  const [scheduledSends] = useState<ScheduledSend[]>(generateScheduledSends());
  const [activeTab, setActiveTab] = useState<'library' | 'autosend' | 'settings'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedContent, setSelectedContent] = useState<EducationalContent | null>(null);
  const [inChairMode, setInChairMode] = useState<EducationalContent | null>(null);
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'patient' | 'provider'>('all');

  const filtered = content.filter(c => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (audienceFilter === 'patient' && !c.patientFacing) return false;
    if (audienceFilter === 'provider' && !c.providerFacing) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.cdtCodes.some(code => code.toLowerCase().includes(q));
    }
    return true;
  });

  const totalVideos = content.filter(c => c.contentType === 'video').length;
  const autoSendEnabled = content.filter(c => c.autoSendEnabled).length;
  const totalViews = content.reduce((s, c) => s + c.viewCount, 0);
  const watchedCount = scheduledSends.filter(s => s.status === 'watched').length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* In-Chair Modal */}
      {inChairMode && <InChairModal content={inChairMode} onClose={() => setInChairMode(null)} />}

      {/* Header */}
      <div>
        <button onClick={() => navigate('/home')} className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 rounded-xl"><BookOpen className="w-6 h-6 text-teal-400" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Educational Resources</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Video library, patient education, in-chair playback, and auto-send management</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
            <Video className="w-4 h-4" /> Add Content
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'VIDEO LIBRARY', value: String(totalVideos), sub: `${content.length} total resources`, icon: Video, color: 'text-teal-400' },
          { label: 'AUTO-SEND ACTIVE', value: String(autoSendEnabled), sub: 'procedures configured', icon: Send, color: 'text-blue-400' },
          { label: 'TOTAL VIEWS', value: totalViews.toLocaleString(), sub: 'patient + provider views', icon: Eye, color: 'text-violet-400' },
          { label: 'WATCH RATE', value: `${scheduledSends.length > 0 ? Math.round((watchedCount / scheduledSends.length) * 100) : 0}%`, sub: `${watchedCount} of ${scheduledSends.length} sent watched`, icon: ThumbsUp, color: 'text-emerald-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{stat.label}</p>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('library')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'library' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <BookOpen className="w-4 h-4" /> Video Library
        </button>
        <button onClick={() => setActiveTab('autosend')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'autosend' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <Send className="w-4 h-4" /> Auto-Send Queue
          {scheduledSends.filter(s => s.status === 'scheduled').length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">{scheduledSends.filter(s => s.status === 'scheduled').length}</span>
          )}
        </button>
        <button onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <Settings className="w-4 h-4" /> Auto-Send Settings
        </button>
      </div>

      {/* ═══ VIDEO LIBRARY TAB ═══ */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search by title, description, or CDT code..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900 dark:text-white placeholder-slate-400" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(['all', ...Object.keys(categoryLabels)] as (Category | 'all')[]).map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg capitalize transition-all ${selectedCategory === cat ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  {cat === 'all' ? 'All' : categoryLabels[cat].label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-700/50 p-0.5 rounded-lg">
              {(['all', 'patient', 'provider'] as const).map(a => (
                <button key={a} onClick={() => setAudienceFilter(a)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-all ${audienceFilter === a ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>
                  {a === 'all' ? 'All' : a === 'patient' ? '👤 Patient' : '🩺 Provider'}
                </button>
              ))}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => (
              <div key={c.id} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden hover:border-teal-500/30 transition-all group">
                {/* Thumbnail */}
                <div className="relative h-36 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700/50 dark:to-slate-800 flex items-center justify-center">
                  <span className="text-5xl">{c.thumbnailEmoji}</span>
                  {c.contentType === 'video' && (
                    <button onClick={() => setInChairMode(c)}
                      className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/90 dark:bg-slate-900/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        <Play className="w-5 h-5 text-teal-600 dark:text-teal-400 ml-0.5" />
                      </div>
                    </button>
                  )}
                  {c.duration && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-mono rounded">{c.duration}</span>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${categoryLabels[c.category].color}`}>{categoryLabels[c.category].label}</span>
                  </div>
                  {c.autoSendEnabled && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center gap-0.5">
                      <Send className="w-2.5 h-2.5" /> Auto-Send
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-2">{c.title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{c.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-0.5"><ContentTypeIcon type={c.contentType} /> {c.contentType}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400" /> {c.rating}</span>
                      <span>·</span>
                      <span>{c.viewCount.toLocaleString()} views</span>
                    </div>
                  </div>

                  {c.cdtCodes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {c.cdtCodes.slice(0, 4).map(code => (
                        <span key={code} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700/50 text-teal-600 dark:text-teal-400 rounded">{code}</span>
                      ))}
                      {c.cdtCodes.length > 4 && <span className="text-[9px] text-slate-400">+{c.cdtCodes.length - 4} more</span>}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/30">
                    {c.contentType === 'video' && (
                      <button onClick={() => setInChairMode(c)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg hover:bg-teal-500/20 transition-colors">
                        <Monitor className="w-3 h-3" /> In-Chair
                      </button>
                    )}
                    <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors">
                      <Send className="w-3 h-3" /> Send to Patient
                    </button>
                    <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-500 rounded-lg hover:text-slate-700 dark:hover:text-slate-300 transition-colors ml-auto">
                      <Link2 className="w-3 h-3" /> Copy Link
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No content matches your filters</p>
              <p className="text-xs mt-1">Try adjusting your search or category filters</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ AUTO-SEND QUEUE TAB ═══ */}
      {activeTab === 'autosend' && (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg"><Send className="w-5 h-5 text-blue-400" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-400">Auto-Send is Active</p>
              <p className="text-xs text-slate-400 mt-0.5">Educational content is automatically sent to patients 48 hours before their scheduled procedure</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/30 text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-semibold">Patient</th>
                    <th className="text-left px-4 py-3 font-semibold">Procedure</th>
                    <th className="text-left px-4 py-3 font-semibold">Content Sent</th>
                    <th className="text-left px-4 py-3 font-semibold">Appointment</th>
                    <th className="text-center px-4 py-3 font-semibold">Channel</th>
                    <th className="text-center px-4 py-3 font-semibold">Send Date</th>
                    <th className="text-center px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                  {scheduledSends.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{s.patientName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-900 dark:text-white">{s.procedure}</p>
                        <p className="text-[10px] text-teal-500 font-mono">{s.cdtCode}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-600 dark:text-slate-300">{s.contentTitle}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(s.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          {s.channel === 'sms' ? <MessageSquare className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                          <span className="text-[10px] uppercase">{s.channel}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">{new Date(s.sendDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td className="px-4 py-3 text-center"><SendStatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ AUTO-SEND SETTINGS TAB ═══ */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Global Settings */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-teal-400" /> Auto-Send Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/30">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Auto-Send Enabled</p>
                  <p className="text-xs text-slate-500">Automatically send educational content before scheduled procedures</p>
                </div>
                <div className="w-10 h-6 bg-teal-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/30">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Send Timing</p>
                  <p className="text-xs text-slate-500">How far in advance to send educational content</p>
                </div>
                <select className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-slate-700 dark:text-slate-300">
                  <option>24 hours before</option>
                  <option selected>48 hours before</option>
                  <option>72 hours before</option>
                  <option>1 week before</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/30">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Default Channel</p>
                  <p className="text-xs text-slate-500">Preferred delivery method (uses patient preference if available)</p>
                </div>
                <select className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-slate-700 dark:text-slate-300">
                  <option>SMS / Text</option>
                  <option selected>Email</option>
                  <option>Patient preference</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/30">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Include Treatment Plan Link</p>
                  <p className="text-xs text-slate-500">Attach a secure link to the patient's treatment plan alongside educational content</p>
                </div>
                <div className="w-10 h-6 bg-teal-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Communication Platform</p>
                  <p className="text-xs text-slate-500">Integration used for sending messages</p>
                </div>
                <select className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-slate-700 dark:text-slate-300">
                  <option selected>Go High Level</option>
                  <option>Twilio</option>
                  <option>Azure Communication Services</option>
                  <option>Weave</option>
                </select>
              </div>
            </div>
          </div>

          {/* CDT Code Mappings */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Link2 className="w-4 h-4 text-teal-400" /> CDT Code → Content Mappings</h3>
            <p className="text-xs text-slate-500 mb-4">When a patient is scheduled for a procedure matching these CDT codes, the linked content is automatically sent.</p>
            <div className="space-y-2">
              {content.filter(c => c.autoSendEnabled).map(c => (
                <div key={c.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/20 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <span className="text-lg">{c.thumbnailEmoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{c.title}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.cdtCodes.map(code => (
                        <span key={code} className="text-[9px] font-mono px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded">{code}</span>
                      ))}
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dentamind Education Intelligence */}
      <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/20 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-teal-400" /> Dentamind Education Intelligence</h3>
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <div className="flex items-start gap-2"><span>📊</span><span>Patients who watch educational videos before their appointment have a 34% higher treatment acceptance rate and 28% fewer cancellations.</span></div>
          <div className="flex items-start gap-2"><span>🎯</span><span>{autoSendEnabled} of {content.length} resources are configured for auto-send. Consider enabling auto-send for implant and orthodontic content to boost acceptance of high-value treatments.</span></div>
          {watchedCount > 0 && <div className="flex items-start gap-2"><span>✅</span><span>{watchedCount} of {scheduledSends.length} recent sends were watched — that's a {Math.round((watchedCount / scheduledSends.length) * 100)}% engagement rate, above the 15% industry average.</span></div>}
          <div className="flex items-start gap-2"><span>💡</span><span>In-chair video playback during treatment presentation increases case acceptance by 41%. Use the "In-Chair" button on any video to present directly to patients.</span></div>
        </div>
      </div>

      <div className="text-center pb-4">
        <p className="text-xs text-slate-400">Dentamind AI — Educational Resources · Auto-Send · In-Chair Playback · Treatment Plan Links</p>
      </div>
    </div>
  );
}
