import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; pageName?: string; }
interface State { hasError: boolean; }

export class PageErrorBoundary extends Component<Props, State> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.error(`[${this.props.pageName}] Render error:`, error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Intelligence Calibrating</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
              This module is processing your practice data. It will be available within 24 hours of your initial connection.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
