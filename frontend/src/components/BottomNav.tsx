import type { TabKey } from '../types';

interface BottomNavProps {
  tab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export default function BottomNav({ tab, onTabChange }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-outline-variant/30 flex justify-around items-center px-4 pb-6 pt-2">
      <button
        onClick={() => onTabChange('recognize')}
        className={`flex flex-col items-center justify-center transition-all ${
          tab === 'recognize' ? 'bg-primary/10 text-primary px-5 py-1.5 rounded-2xl font-bold' : 'text-on-surface-variant'
        }`}
      >
        <span className={`material-symbols-outlined ${tab === 'recognize' ? 'fill-icon' : ''}`}>photo_camera</span>
        <span className="text-[10px] font-bold mt-0.5">Nhận diện</span>
      </button>

      <button
        onClick={() => onTabChange('history')}
        className={`flex flex-col items-center justify-center transition-all ${
          tab === 'history' ? 'bg-primary/10 text-primary px-5 py-1.5 rounded-2xl font-bold' : 'text-on-surface-variant'
        }`}
      >
        <span className={`material-symbols-outlined ${tab === 'history' ? 'fill-icon' : ''}`}>history</span>
        <span className="text-[10px] font-bold mt-0.5">Lịch sử</span>
      </button>

      <button
        onClick={() => onTabChange('settings')}
        className={`flex flex-col items-center justify-center transition-all ${
          tab === 'settings' ? 'bg-primary/10 text-primary px-5 py-1.5 rounded-2xl font-bold' : 'text-on-surface-variant'
        }`}
      >
        <span className={`material-symbols-outlined ${tab === 'settings' ? 'fill-icon' : ''}`}>settings</span>
        <span className="text-[10px] font-bold mt-0.5">Hệ thống</span>
      </button>
    </nav>
  );
}
