import type { TabKey } from '../types';

interface AppHeaderProps {
  tab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export default function AppHeader({ tab, onTabChange }: AppHeaderProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#f9f9ff]/80 backdrop-blur-md shadow-sm flex justify-between items-center px-6 md:px-12 h-16 border-b border-[#bbcabf]/30">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('recognize')}>
        <span className="material-symbols-outlined text-[#006c49] text-3xl font-bold">restaurant</span>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#006c49]">VietFood AI</h1>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        <button
          onClick={() => onTabChange('recognize')}
          className={`font-medium text-sm flex items-center gap-1.5 py-1 transition-all ${
            tab === 'recognize' ? 'text-[#006c49] border-b-2 border-[#006c49]' : 'text-[#3c4a42] hover:text-[#006c49]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">photo_camera</span> Nhận diện
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={`font-medium text-sm flex items-center gap-1.5 py-1 transition-all ${
            tab === 'history' ? 'text-[#006c49] border-b-2 border-[#006c49]' : 'text-[#3c4a42] hover:text-[#006c49]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">history</span> Lịch sử
        </button>
        <button
          onClick={() => onTabChange('settings')}
          className={`font-medium text-sm flex items-center gap-1.5 py-1 transition-all ${
            tab === 'settings' ? 'text-[#006c49] border-b-2 border-[#006c49]' : 'text-[#3c4a42] hover:text-[#006c49]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span> Thông tin hệ thống
        </button>
      </nav>

      {/* Mobile/Quick Actions */}
      <div className="md:hidden flex items-center gap-2">
        <button onClick={() => onTabChange('settings')} className="p-2 text-[#3c4a42] hover:text-[#006c49]">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  );
}
