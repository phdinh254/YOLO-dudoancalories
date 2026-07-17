import type { TabKey } from '../types';

interface BottomNavProps {
  tab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export default function BottomNav({ tab, onTabChange }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-[#f9f9ff]/80 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-[#bbcabf]/30 flex justify-around items-center px-4 pb-6 pt-2">
      <button
        onClick={() => onTabChange('recognize')}
        className={`flex flex-col items-center justify-center transition-all ${
          tab === 'recognize' ? 'bg-[#006c49]/10 text-[#006c49] px-5 py-1.5 rounded-2xl font-bold' : 'text-[#3c4a42]'
        }`}
      >
        <span className={`material-symbols-outlined ${tab === 'recognize' ? 'fill-icon' : ''}`}>photo_camera</span>
        <span className="text-[10px] font-bold mt-0.5">Nhận diện</span>
      </button>

      <button
        onClick={() => onTabChange('history')}
        className={`flex flex-col items-center justify-center transition-all ${
          tab === 'history' ? 'bg-[#006c49]/10 text-[#006c49] px-5 py-1.5 rounded-2xl font-bold' : 'text-[#3c4a42]'
        }`}
      >
        <span className={`material-symbols-outlined ${tab === 'history' ? 'fill-icon' : ''}`}>history</span>
        <span className="text-[10px] font-bold mt-0.5">Lịch sử</span>
      </button>

      <button
        onClick={() => onTabChange('settings')}
        className={`flex flex-col items-center justify-center transition-all ${
          tab === 'settings' ? 'bg-[#006c49]/10 text-[#006c49] px-5 py-1.5 rounded-2xl font-bold' : 'text-[#3c4a42]'
        }`}
      >
        <span className={`material-symbols-outlined ${tab === 'settings' ? 'fill-icon' : ''}`}>settings</span>
        <span className="text-[10px] font-bold mt-0.5">Hệ thống</span>
      </button>
    </nav>
  );
}
