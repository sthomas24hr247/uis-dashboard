/**
 * CommandCenterPage.tsx
 * Embeds command.uishealth.com inside the UIS dashboard
 * Add to uis-dashboard-github/src/pages/CommandCenterPage.tsx
 * Route: /command-center
 */
import { useState } from 'react';
import { ExternalLink, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

export default function CommandCenterPage() {
  const [fullscreen, setFullscreen] = useState(false);
  const [key, setKey] = useState(0);
  const url = 'https://command.uishealth.com';

  return (
    <div className={`flex flex-col ${fullscreen ? 'fixed inset-0 z-50 bg-slate-950' : 'h-[calc(100vh-64px)]'}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-xs font-mono tracking-widest text-teal-400">UIS EXECUTIVE COMMAND CENTER</span>
          <span className="text-[10px] text-slate-500 font-mono">command.uishealth.com</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setKey(k => k + 1)}
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all"
          >
            <ExternalLink className="w-3 h-3" /> Open in new tab
          </a>
          <button
            onClick={() => setFullscreen(f => !f)}
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all"
          >
            {fullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Iframe */}
      <iframe
        key={key}
        src={url}
        className="flex-1 w-full border-0"
        title="UIS Executive Command Center"
        allow="autoplay; microphone"
      />
    </div>
  );
}
