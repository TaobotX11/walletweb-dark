import { Buffer } from 'buffer';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Polyfill Buffer for bitcoinjs-lib
(globalThis as Record<string, unknown>).Buffer = Buffer;

const rootEl = document.getElementById('root');

// Error boundary for runtime errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: '#ff6b6b', background: '#1a1a2e', padding: 32, fontFamily: 'monospace' }}>
          <h2>Something went wrong</h2>
          <p>Please reload the page. If the issue persists, clear your browser cache.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Dynamic import to handle WASM async initialization
async function boot() {
  try {
    const { default: App } = await import('./App');
    if (rootEl) {
      ReactDOM.createRoot(rootEl).render(
        <React.StrictMode>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </React.StrictMode>
      );
    }
  } catch (e) {
    if (rootEl) {
      rootEl.innerHTML = '<div style="color:#ff6b6b;background:#1a1a2e;padding:32px;font-family:monospace"><h2>Failed to load wallet</h2><p>Please reload the page or try a different browser.</p></div>';
    }
    console.error('Boot error:', e);
  }
}

boot();
