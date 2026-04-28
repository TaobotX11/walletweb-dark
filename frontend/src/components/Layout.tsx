import React from 'react';
import logo from '../assets/logo.png';

interface LayoutProps {
  children: React.ReactNode;
  address?: string | null;
  onLock?: () => void;
  onLogout?: () => void;
  showNav?: boolean;
  activeView?: string;
  onNavigate?: (view: string) => void;
}

export function Layout({
  children,
  address,
  onLock,
  onLogout,
  showNav,
  activeView,
  onNavigate,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="border-b border-dark-800 bg-dark-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Nusacoin" className="w-9 h-9 rounded-lg" />
            <span className="font-bold text-lg">Nusacoin</span>
          </div>

          {address && (
            <div className="flex items-center gap-2">
              <button
                onClick={onLock}
                className="text-sm text-dark-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-dark-800"
                title="Lock wallet"
              >
                Lock
              </button>
              <button
                onClick={onLogout}
                className="text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-dark-800"
                title="Delete wallet from this browser"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      {showNav && onNavigate && (
        <nav className="border-b border-dark-800 bg-dark-900/50">
          <div className="max-w-2xl mx-auto px-4 flex gap-1">
            {[
              { id: 'dashboard', label: 'Wallet' },
              { id: 'send', label: 'Send' },
              { id: 'receive', label: 'Receive' },
              { id: 'history', label: 'History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeView === tab.id
                  ? 'border-nux-500 text-nux-400'
                  : 'border-transparent text-dark-400 hover:text-white'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
