import React from 'react';
import { Mic, Upload, FileText, Settings } from 'lucide-react';

export const BottomNav = ({ currentView, onNavigate }) => {
  const items = [
    { id: 'home', icon: Upload, label: 'Home' },
    { id: 'record', icon: Mic, label: 'Record', center: true },
    { id: 'transcripts', icon: FileText, label: 'Transcripts' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700"
      style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.06)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      data-testid="bottom-nav"
    >
      <div className="max-w-md mx-auto flex items-center justify-around py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (item.id === 'home' && currentView === 'processing');

          if (item.center) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                data-testid="nav-record"
                className="relative -mt-6 flex flex-col items-center"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                  isActive ? 'bg-red-500' : 'bg-emerald-800 dark:bg-emerald-600'
                }`}>
                  <Icon className="h-7 w-7 text-white" strokeWidth={2} />
                </div>
                <span className={`text-[10px] mt-0.5 font-medium ${
                  isActive ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'
                }`}>{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              data-testid={`nav-${item.id}`}
              className="flex flex-col items-center py-1.5 px-4 min-w-[56px] transition-colors"
            >
              <Icon
                className={`h-6 w-6 ${isActive ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}
                strokeWidth={isActive ? 2.2 : 1.5}
              />
              <span className={`text-[10px] mt-0.5 font-medium ${
                isActive ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
              }`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
