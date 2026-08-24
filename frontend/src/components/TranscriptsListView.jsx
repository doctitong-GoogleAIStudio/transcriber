import React from 'react';
import { FileText, Trash2, Clock } from 'lucide-react';

const TranscriptsListView = ({ history, onSelect, onDelete, onClearAll }) => {
  return (
    <div className="px-4 pt-6 pb-safe max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="transcripts-title">
          My Transcripts
        </h2>
        {history.length > 0 && (
          <button
            onClick={onClearAll}
            data-testid="clear-all-btn"
            className="text-sm text-red-500 hover:text-red-600 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" strokeWidth={1.5} />
          <p className="text-slate-400 dark:text-slate-500 text-sm">No transcripts yet</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Record or upload audio to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              data-testid={`transcript-item-${item.id}`}
              className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-emerald-700 dark:text-emerald-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{item.fileName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400 dark:text-slate-500">{item.language}</span>
                  <span className="text-xs text-slate-300 dark:text-slate-600">|</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                    <Clock className="h-3 w-3" />
                    {item.date}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                data-testid={`delete-transcript-${item.id}`}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranscriptsListView;
