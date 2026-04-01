import { useState } from 'react';
import { Brain, ChevronRight, ChevronLeft, CheckCircle2, Loader2, X } from 'lucide-react';

interface ECPResult {
  cognitive_style: 'analytical' | 'intuitive' | 'narrative';
  decision_velocity: 'rapid_fire' | 'deliberate' | 'consensus';
  risk_orientation: 'aggressive' | 'calculated' | 'conservative';
  attention_pattern: 'broad_scanner' | 'deep_diver' | 'exception_only';
  strategic_horizon: 'quarterly' | 'annual' | 'multi_year';
}

interface Question {
  id: keyof ECPResult;
  title: string;
  subtitle: string;
  options: {
    value: string;
    label: string;
    description: string;
    icon: string;
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'cognitive_style',
    title: 'How do you prefer to process information?',
    subtitle: 'When reviewing practice performance, what resonates most with you?',
    options: [
      {
        value: 'analytical',
        label: 'Data tables & numbers',
        description: 'I want the full breakdown — every metric, every column. I\'ll draw my own conclusions.',
        icon: '📊',
      },
      {
        value: 'intuitive',
        label: 'Charts & trend lines',
        description: 'Show me the direction and momentum. I\'ll confirm my instincts from the visuals.',
        icon: '📈',
      },
      {
        value: 'narrative',
        label: 'Written summary first',
        description: 'Give me the story in plain language. I\'ll dig into data if I need more.',
        icon: '📝',
      },
    ],
  },
  {
    id: 'decision_velocity',
    title: 'How do you make decisions?',
    subtitle: 'When a recommendation lands on your desk, what\'s your natural process?',
    options: [
      {
        value: 'rapid_fire',
        label: 'Fast — approve or pass',
        description: 'I know what I need to know. Give me a clear recommendation and one button to act.',
        icon: '⚡',
      },
      {
        value: 'deliberate',
        label: 'Thorough — model the outcomes',
        description: 'I want conservative, base, and optimistic scenarios before I commit.',
        icon: '🔬',
      },
      {
        value: 'consensus',
        label: 'Collaborative — align the team',
        description: 'I want to share the analysis with stakeholders before we move forward.',
        icon: '🤝',
      },
    ],
  },
  {
    id: 'risk_orientation',
    title: 'How do you think about risk?',
    subtitle: 'When evaluating an investment or operational change, what matters most?',
    options: [
      {
        value: 'aggressive',
        label: 'First-mover advantage',
        description: 'Timing matters. Show me why acting now beats waiting, and I\'ll move.',
        icon: '🚀',
      },
      {
        value: 'calculated',
        label: 'Risk vs reward, quantified',
        description: 'Give me the confidence intervals and comparable outcomes. I\'ll weigh them carefully.',
        icon: '⚖️',
      },
      {
        value: 'conservative',
        label: 'Proven before I commit',
        description: 'Show me other practices that have done this successfully. Evidence first.',
        icon: '🛡️',
      },
    ],
  },
  {
    id: 'attention_pattern',
    title: 'What do you want to see first?',
    subtitle: 'When you open a dashboard, what should be front and center?',
    options: [
      {
        value: 'broad_scanner',
        label: 'Everything at once',
        description: 'I want the full picture — all locations, all providers, all metrics visible.',
        icon: '🔭',
      },
      {
        value: 'deep_diver',
        label: 'The current priority',
        description: 'Focus me on what matters most right now with full context around it.',
        icon: '🎯',
      },
      {
        value: 'exception_only',
        label: 'Only what needs action',
        description: 'Hide everything on track. Show me only what\'s flagged and needs my attention.',
        icon: '🚨',
      },
    ],
  },
  {
    id: 'strategic_horizon',
    title: 'What\'s your planning timeframe?',
    subtitle: 'When you think about practice performance, what window drives your decisions?',
    options: [
      {
        value: 'quarterly',
        label: 'This quarter',
        description: '30/60/90 days. I\'m focused on Q4 targets and near-term momentum.',
        icon: '📅',
      },
      {
        value: 'annual',
        label: 'This year',
        description: 'Year-over-year comparisons. I want to know if we\'re up or down vs last year.',
        icon: '📆',
      },
      {
        value: 'multi_year',
        label: 'Long-term portfolio',
        description: 'Lifetime value, 3-year trajectory, strategic investment returns.',
        icon: '🏗️',
      },
    ],
  },
];

const DIMENSION_LABELS: Record<keyof ECPResult, string> = {
  cognitive_style: 'Cognitive Style',
  decision_velocity: 'Decision Velocity',
  risk_orientation: 'Risk Orientation',
  attention_pattern: 'Attention Pattern',
  strategic_horizon: 'Strategic Horizon',
};

const MARVA_PREVIEW: Record<string, Record<string, string>> = {
  cognitive_style: {
    analytical: 'Data tables default view',
    intuitive: 'Trend charts default view',
    narrative: 'AI narrative leads every section',
  },
  decision_velocity: {
    rapid_fire: 'Single action button per recommendation',
    deliberate: 'Scenario modeling auto-expanded',
    consensus: 'Shareable briefs enabled',
  },
  risk_orientation: {
    aggressive: 'Directional urgency framing',
    calculated: 'Confidence intervals on all projections',
    conservative: 'Peer case studies lead recommendations',
  },
  attention_pattern: {
    broad_scanner: 'Full enterprise view',
    deep_diver: 'Focused priority view with drill-down',
    exception_only: 'Flagged items only — clean signal',
  },
  strategic_horizon: {
    quarterly: '90-day windows default',
    annual: 'Year-over-year comparisons lead',
    multi_year: 'LTV and 3-year trajectory metrics',
  },
};

interface ECPAssessmentProps {
  onComplete: (result: ECPResult) => void;
  onDismiss?: () => void;
}

export default function ECPAssessment({ onComplete, onDismiss }: ECPAssessmentProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<ECPResult>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const current = QUESTIONS[step];
  const progress = ((step) / QUESTIONS.length) * 100;
  const selected = answers[current.id];
  const isLast = step === QUESTIONS.length - 1;

  const handleSelect = (value: string) => {
    setAnswers(prev => ({ ...prev, [current.id]: value as any }));
  };

  const handleNext = async () => {
    if (!selected) return;
    if (isLast) {
      setSubmitting(true);
      const result = { ...answers, [current.id]: selected } as ECPResult;
      await new Promise(r => setTimeout(r, 1200)); // simulate save
      setSubmitting(false);
      setDone(true);
      setTimeout(() => onComplete(result), 1800);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Your MARVA profile is ready
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Your dashboard is being configured based on your behavioral fingerprint. The experience adapts as your profile evolves.
          </p>
          <div className="space-y-2">
            {Object.entries(answers).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-sm px-4 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-slate-500 dark:text-slate-400">{DIMENSION_LABELS[key as keyof ECPResult]}</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400 capitalize">{(val as string).replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">ECP Assessment</div>
                <div className="text-xs text-slate-400">Question {step + 1} of {QUESTIONS.length}</div>
              </div>
            </div>
            {onDismiss && (
              <button onClick={onDismiss} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${progress + (selected ? 20 : 0)}%` }}
            />
          </div>

          {/* Question */}
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            {current.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {current.subtitle}
          </p>
        </div>

        {/* Options */}
        <div className="px-8 pb-6 space-y-3">
          {current.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                selected === opt.value
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl flex-shrink-0 mt-0.5">{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${selected === opt.value ? 'text-teal-700 dark:text-teal-300' : 'text-slate-800 dark:text-white'}`}>
                      {opt.label}
                    </span>
                    {selected === opt.value && (
                      <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {opt.description}
                  </p>
                  {selected === opt.value && (
                    <div className="mt-2 text-xs font-medium text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      MARVA: {MARVA_PREVIEW[current.id]?.[opt.value]}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!selected || submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Building your profile...</>
            ) : isLast ? (
              <>Complete assessment <CheckCircle2 className="w-4 h-4" /></>
            ) : (
              <>Next <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
