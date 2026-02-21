import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PracticeData {
  summary?: {
    highRiskAppointments: number;
    mediumRiskAppointments: number;
    lowRiskAppointments: number;
    highRiskPatients: number;
    nextMonthForecast: number;
    confidenceLevel: number;
  };
  noshowRisks?: Array<{
    patientName: string;
    dateTime: string;
    type: string;
    provider: string;
    noshowRiskScore: number;
    riskCategory: string;
    dayOfWeek: string;
    hourOfDay: number;
  }>;
  churnRisks?: Array<{
    firstName: string;
    lastName: string;
    churnRiskScore: number;
    churnRiskCategory: string;
    recommendedAction: string;
    daysSinceVisit: number;
    totalVisits: number;
  }>;
  forecast?: Array<{
    forecastMonth: string;
    forecastProduction: number;
    forecastCollections: number;
    confidenceLevel: number;
    growthRatePct: number;
  }>;
  stats?: {
    totalRevenue: number;
    activePatients: number;
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowRate: number;
  };
}

interface AskDentamindProps {
  initialQuestion?: string | null;
  onQuestionHandled?: () => void;
  practiceData?: PracticeData | null;
}

const BASE_SYSTEM_PROMPT = `You are Dentamind AI, the intelligent decision brain for dental practices. You are embedded in the UIS Health platform — a unified intelligence system that aggregates data from practice management systems.

You help dental practice owners, office managers, and DSO executives understand their practice performance, identify risks, and make data-driven decisions.

Your capabilities include:
- Analyzing no-show risk patterns and recommending interventions
- Revenue forecasting and identifying revenue leakage
- Patient churn detection and retention strategies
- Schedule optimization and bottleneck identification
- Cross-practice benchmarking for multi-location organizations
- Treatment plan acceptance analysis
- Provider productivity insights

Keep responses concise, actionable, and specific to dental practice operations. Use dental industry terminology naturally.

IMPORTANT: You have access to LIVE practice data provided below. Always reference specific numbers, patient names, and risk scores from this data when answering. Be precise and data-driven — cite the actual figures. Never say you don't have access to data — you DO have the practice's real data.

Always be confident but precise. You are the decision brain — not a search engine.`;

function buildDataContext(data: PracticeData): string {
  const sections: string[] = [];

  if (data.stats) {
    sections.push(`## Practice Overview (Live Data)
- Active Patients: ${data.stats.activePatients}
- Total Appointments: ${data.stats.totalAppointments}
- Completed Appointments: ${data.stats.completedAppointments}
- Cancelled Appointments: ${data.stats.cancelledAppointments}
- No-Show Rate: ${(data.stats.noShowRate * 100).toFixed(1)}%
- Total Revenue (Period): $${data.stats.totalRevenue.toLocaleString()}`);
  }

  if (data.summary) {
    sections.push(`## AI Risk Summary
- High Risk Appointments: ${data.summary.highRiskAppointments}
- Medium Risk Appointments: ${data.summary.mediumRiskAppointments}
- Low Risk Appointments: ${data.summary.lowRiskAppointments}
- High Risk Patients (Churn): ${data.summary.highRiskPatients}
- Next Month Revenue Forecast: $${data.summary.nextMonthForecast.toLocaleString()}
- Forecast Confidence: ${(data.summary.confidenceLevel * 100).toFixed(0)}%`);
  }

  if (data.noshowRisks && data.noshowRisks.length > 0) {
    const lines = data.noshowRisks.map(r =>
      `  - ${r.patientName}: Score ${r.noshowRiskScore}/100 (${r.riskCategory}) | ${r.dayOfWeek} ${r.hourOfDay}:00 | Type: ${r.type} | Provider: ${r.provider || 'Unassigned'}`
    ).join('\n');
    sections.push(`## No-Show Risk Appointments (${data.noshowRisks.length} tracked)\n${lines}`);
  }

  if (data.churnRisks && data.churnRisks.length > 0) {
    const lines = data.churnRisks.map(c =>
      `  - ${c.firstName} ${c.lastName}: Churn Score ${c.churnRiskScore}/100 (${c.churnRiskCategory}) | ${c.daysSinceVisit} days since last visit | ${c.totalVisits} total visits | Action: ${c.recommendedAction}`
    ).join('\n');
    sections.push(`## Patient Churn Risk (${data.churnRisks.length} patients)\n${lines}`);
  }

  if (data.forecast && data.forecast.length > 0) {
    const lines = data.forecast.map(f => {
      const month = new Date(f.forecastMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return `  - ${month}: Production $${f.forecastProduction.toLocaleString()} | Collections $${f.forecastCollections.toLocaleString()} | Growth ${f.growthRatePct >= 0 ? '+' : ''}${f.growthRatePct.toFixed(1)}% | Confidence ${(f.confidenceLevel * 100).toFixed(0)}%`;
    }).join('\n');
    sections.push(`## Revenue Forecast (6-Month)\n${lines}`);
  }

  return sections.join('\n\n');
}

export default function AskDentamind({ initialQuestion, onQuestionHandled, practiceData }: AskDentamindProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const processedQuestionRef = useRef<string | null>(null);

  const systemPrompt = practiceData
    ? `${BASE_SYSTEM_PROMPT}\n\n--- LIVE PRACTICE DATA ---\n\n${buildDataContext(practiceData)}\n\n--- END LIVE DATA ---`
    : BASE_SYSTEM_PROMPT;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialQuestion && initialQuestion !== processedQuestionRef.current) {
      processedQuestionRef.current = initialQuestion;
      setIsOpen(true);
      const userMsg: Message = { role: 'user', content: initialQuestion };
      setMessages([userMsg]);
      setIsLoading(true);

      fetch('https://api.uishealth.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: initialQuestion }],
        }),
      })
        .then(r => r.json())
        .then(data => {
          const text = data.content
            ?.map((i: any) => (i.type === 'text' ? i.text : ''))
            .filter(Boolean)
            .join('\n') || 'I apologize, I was unable to process that request.';
          setMessages(prev => [...prev, { role: 'assistant', content: text }]);
        })
        .catch(() => {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: 'Connection error. Please check your network and try again.' },
          ]);
        })
        .finally(() => {
          setIsLoading(false);
          onQuestionHandled?.();
        });
    }
  }, [initialQuestion, onQuestionHandled, systemPrompt]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.uishealth.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      const assistantText = data.content
        ?.map((item: any) => (item.type === 'text' ? item.text : ''))
        .filter(Boolean)
        .join('\n') || 'I apologize, I was unable to process that request.';

      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please check your network and try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, systemPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    'What are my biggest risks this week?',
    'How can I reduce no-shows?',
    'Which patients need outreach?',
  ];

  const handleQuickQuestion = (q: string) => {
    setMessages([{ role: 'user', content: q }]);
    setIsLoading(true);
    fetch('https://api.uishealth.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: q }],
      }),
    })
      .then(r => r.json())
      .then(data => {
        const text = data.content
          ?.map((i: any) => (i.type === 'text' ? i.text : ''))
          .filter(Boolean)
          .join('\n') || 'Error';
        setMessages(prev => [...prev, { role: 'assistant', content: text }]);
      })
      .catch(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error.' }]);
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 
            bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400
            text-white rounded-2xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40
            transition-all duration-300 hover:scale-105 group"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">Ask Dentamind</span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] flex flex-col
          bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700
          overflow-hidden animate-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 
            bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 
                flex items-center justify-center shadow-lg shadow-teal-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Ask Dentamind</h3>
                <p className="text-slate-400 text-xs">
                  {practiceData ? '● Connected to live practice data' : 'AI-powered dental intelligence'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 
                  dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-teal-500" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Dentamind AI</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  {practiceData
                    ? 'Connected to your live practice data. Ask me anything.'
                    : 'The decision brain for your practice'}
                </p>
                <div className="space-y-2">
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQuickQuestion(q)}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300
                        bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-900/20
                        hover:text-teal-700 dark:hover:text-teal-400 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-br-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing practice data...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2
              border border-slate-200 dark:border-slate-700 focus-within:border-teal-400 transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your practice..."
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400
                  outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-1.5 text-teal-500 hover:text-teal-600 disabled:text-slate-300 
                  dark:disabled:text-slate-600 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
