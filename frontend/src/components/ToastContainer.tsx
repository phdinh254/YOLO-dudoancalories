import type { Toast } from '../types';

interface ToastContainerProps {
  toasts: Toast[];
}

export default function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="fixed top-20 right-4 md:right-8 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-lg border max-w-xs transition-all duration-300 transform translate-x-0 fade-in ${
            t.type === 'success'
              ? 'bg-[#ecfdf5] text-[#006c49] border-[#006c49]/20'
              : t.type === 'error'
              ? 'bg-[#fef2f2] text-[#ba1a1a] border-[#ba1a1a]/20'
              : 'bg-[#f0f3ff] text-[#005ac2] border-[#005ac2]/20'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="text-sm font-semibold">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
