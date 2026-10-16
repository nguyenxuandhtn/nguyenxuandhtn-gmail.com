import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bg = 'bg-slate-900 text-white';
        let Icon = Info;
        let iconColor = 'text-teal-400';

        if (toast.type === 'success') {
          bg = 'bg-slate-900 border border-teal-500/30 text-white';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400';
        } else if (toast.type === 'error') {
          bg = 'bg-rose-950 border border-rose-700 text-rose-50';
          Icon = AlertCircle;
          iconColor = 'text-rose-400';
        } else if (toast.type === 'warning') {
          bg = 'bg-amber-950 border border-amber-700 text-amber-50';
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
        } else {
          bg = 'bg-slate-900 border border-slate-700 text-slate-100';
          Icon = Info;
          iconColor = 'text-teal-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg shadow-xl text-sm transition-all animate-in fade-in slide-in-from-bottom-2 ${bg}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              {toast.title && <p className="font-semibold text-xs uppercase tracking-wider mb-0.5">{toast.title}</p>}
              <p className="leading-snug text-xs sm:text-sm text-slate-200">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-0.5 rounded"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
