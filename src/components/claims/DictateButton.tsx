import { useState, useRef, useCallback, useEffect } from "react";

interface DictateButtonProps {
  onTranscript: (text: string) => void;
  onStart?: () => void;
}

// Extend Window for webkit prefix
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export const DictateButton = ({ onTranscript, onStart }: DictateButtonProps) => {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      stopListening();
    }, 3000);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice dictation requires Chrome, Edge, or Safari");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    transcriptRef.current = "";

    recognition.onstart = () => {
      setListening(true);
      onStart?.();
      resetSilenceTimer();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      resetSilenceTimer();
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }
      if (finalTranscript) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setError("Microphone access needed — check browser permissions");
      } else if (event.error === "network") {
        setError("Voice dictation requires internet connection");
      } else if (event.error !== "aborted") {
        setError(`Speech error: ${event.error}`);
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError("Could not start voice recognition");
    }
  }, [onTranscript, onStart, resetSilenceTimer]);

  if (!supported) {
    return (
      <span className="px-2 py-0.5 text-[9px] text-muted-foreground" title="Voice dictation requires Chrome, Edge, or Safari">
        🎤
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {listening ? (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); stopListening(); }}
            className="px-2.5 py-1 text-[10px] font-bold text-red-300 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-all flex items-center gap-1.5 animate-pulse"
          >
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            Listening…
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); stopListening(); }}
            className="px-2 py-1 text-[9px] font-bold text-muted-foreground bg-surface-2 hover:bg-surface-3 border border-border rounded-lg transition-all"
          >
            Stop
          </button>
        </>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); startListening(); }}
          className="px-2.5 py-1 text-[10px] font-bold text-teal-light bg-primary/15 hover:bg-primary/25 border border-primary/30 rounded-lg transition-all flex items-center gap-1"
        >
          🎤 Dictate
        </button>
      )}
      {error && (
        <span className="text-[8px] text-red-400 max-w-32 truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  );
};
