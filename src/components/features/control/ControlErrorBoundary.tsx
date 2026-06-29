'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  section: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Wraps a single panel section on the control page.
 * Catches render-phase exceptions, logs them to the console with the section
 * name and component stack, and renders a compact inline error tile so the
 * rest of the page keeps working.
 */
export class ControlErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[Control:${this.props.section}] render error:`,
      error.message,
      '\nComponent stack:',
      info.componentStack
    );
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className='flex flex-col items-center justify-center gap-3 bg-red-950/20 border border-red-800/40 rounded-lg p-6 min-h-[80px] text-center'>
        <AlertTriangle size={20} className='text-red-400 flex-shrink-0' />
        <div className='space-y-0.5'>
          <p className='text-[11px] font-bold text-red-400 uppercase tracking-widest'>
            {this.props.section} error
          </p>
          <p className='text-[10px] font-mono text-red-300/70 max-w-[320px] break-words'>
            {error.message}
          </p>
        </div>
        <button
          onClick={this.reset}
          className='flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-red-400 border border-red-700/50 rounded hover:bg-red-900/30 transition-colors'
        >
          <RefreshCw size={10} />
          Retry
        </button>
      </div>
    );
  }
}
