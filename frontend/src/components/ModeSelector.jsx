import React from 'react';

const MODES = [
  { id: 'general', label: 'General' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'medical', label: 'Medical' },
  { id: 'lecture', label: 'Lecture' },
  { id: 'interview', label: 'Interview' },
];

const ModeSelector = ({ selected, onChange }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pills-scroll py-1 px-0.5" data-testid="mode-selector">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onChange(mode.id)}
          data-testid={`mode-${mode.id}`}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
            selected === mode.id
              ? 'bg-emerald-800 dark:bg-emerald-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
};

export default ModeSelector;
