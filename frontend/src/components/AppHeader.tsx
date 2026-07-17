import type { TabKey } from '../types';

interface AppHeaderProps {
  tab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export default function AppHeader({ tab, onTabChange }: AppHeaderProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md shadow-sm flex justify-between items-center px-6 md:px-12 h-16 border-b border-outline-variant/30">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('recognize')}>
        <span className="material-symbols-outlined text-primary text-3xl font-bold">restaurant</span>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary">VietFood AI</h1>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        <button
          onClick={() => onTabChange('recognize')}
          className={`font-medium text-sm flex items-center gap-1.5 py-1 transition-all ${
            tab === 'recognize' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">photo_camera</span> Nhận diện
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={`font-medium text-sm flex items-center gap-1.5 py-1 transition-all ${
            tab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">history</span> Lịch sử
        </button>
        <button
          onClick={() => onTabChange('settings')}
          className={`font-medium text-sm flex items-center gap-1.5 py-1 transition-all ${
            tab === 'settings' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span> Thông tin hệ thống
        </button>
      </nav>
    </header>
  );
}
