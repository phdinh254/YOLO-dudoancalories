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
              ? 'bg-success-container text-success border-success/20'
              : t.type === 'error'
              ? 'bg-error-container text-error border-error/20'
              : 'bg-surface-container-low text-tertiary border-tertiary/20'
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
