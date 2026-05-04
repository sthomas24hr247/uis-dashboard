import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function VoiceButton({ onTranscript, className = '', size = 'md', label }: VoiceButtonProps) {
  const [state, setState] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Voice input requires Chrome or Edge');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setState('listening');

    recognition.onresult = (event: any) => {
      setState('processing');
      const transcript = event.results[0][0].transcript;
      setTimeout(() => {
        onTranscript(transcript);
        setState('idle');
      }, 300);
    };

    recognition.onerror = (event: any) => {
      setState('idle');
      if (event.error !== 'aborted') {
        setError(event.error === 'not-allowed'
          ? 'Microphone access denied'
          : 'Voice input failed — try again');
        setTimeout(() => setError(null), 3000);
      }
    };

    recognition.onend = () => {
      if (state === 'listening') setState('idle');
    };

    recognition.start();
  }, [isSupported, onTranscript, state]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setState('idle');
  }, []);

  const handleClick = () => {
    if (state === 'listening') {
      stopListening();
    } else if (state === 'idle') {
      startListening();
    }
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const iconSize = { sm: 12, md: 15, lg: 20 };

  return (
    <div className={`relative inline-flex flex-col items-center gap-1 ${className}`}>
      <button
        onClick={handleClick}
        disabled={state === 'processing' || !isSupported}
        title={!isSupported ? 'Voice input requires Chrome or Edge' : state === 'listening' ? 'Click to stop' : 'Click to speak'}
        className={`
          ${sizeClasses[size]} rounded-full flex items-center justify-center
          transition-all duration-200 relative
          ${state === 'listening'
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
            : state === 'processing'
            ? 'bg-teal-500/20 text-teal-500 cursor-wait'
            : 'bg-slate-100 dark:bg-slate-700 hover:bg-teal-100 dark:hover:bg-teal-900/30 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400'
          }
          disabled:opacity-40 disabled:cursor-not-allowed
        `}
      >
        {state === 'processing' ? (
          <Loader2 size={iconSize[size]} className="animate-spin" />
        ) : state === 'listening' ? (
          <MicOff size={iconSize[size]} />
        ) : (
          <Mic size={iconSize[size]} />
        )}

        {/* Pulse ring when listening */}
        {state === 'listening' && (
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
        )}
      </button>

      {label && state === 'idle' && (
        <span className="text-[10px] text-slate-400 whitespace-nowrap">{label}</span>
      )}
      {state === 'listening' && (
        <span className="text-[10px] text-red-500 font-medium whitespace-nowrap animate-pulse">Listening...</span>
      )}
      {state === 'processing' && (
        <span className="text-[10px] text-teal-500 whitespace-nowrap">Processing...</span>
      )}
      {error && (
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] text-red-500 whitespace-nowrap bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-lg border border-red-200 dark:border-red-800 z-10">
          {error}
        </span>
      )}
    </div>
  );
}

// ─── Floating voice button for full-page use ─────────────────────────────────
interface FloatingVoiceButtonProps {
  onTranscript: (text: string) => void;
  hint?: string;
}

export function FloatingVoiceButton({ onTranscript, hint = 'Ask anything...' }: FloatingVoiceButtonProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {expanded && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 max-w-[200px] text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="font-medium text-slate-900 dark:text-white mb-1">Voice Active</p>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>
      )}
      <VoiceButton
        onTranscript={(text) => { onTranscript(text); setExpanded(false); }}
        size="lg"
        className="shadow-xl"
      />
    </div>
  );
}
