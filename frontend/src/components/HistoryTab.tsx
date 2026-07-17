import type { FilterKey, FoodLog } from '../types';

interface HistoryTabProps {
  filteredHistory: FoodLog[];
  activeFilter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
  onSelectItem: (item: FoodLog) => void;
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'week', label: 'Tuần này' },
  { key: 'month', label: 'Tháng này' },
];

export default function HistoryTab({ filteredHistory, activeFilter, onFilterChange, onSelectItem }: HistoryTabProps) {
  return (
    <div className="fade-in max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-on-surface mb-1 leading-tight">Lịch sử nhận diện</h2>
        <p className="text-sm text-on-surface-variant font-semibold">Lịch sử được lưu cục bộ trên trình duyệt hiện tại.</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-xs transition-all active:scale-95 ${
              activeFilter === filter.key
                ? 'bg-primary-container text-white shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Logs list */}
      {filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-outline-variant/20">
          <span className="material-symbols-outlined text-6xl text-outline mb-4">history_toggle_off</span>
          <p className="text-base font-bold text-on-surface-variant">Chưa có lịch sử nhận diện nào trong khoảng thời gian này.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredHistory.map((log) => (
            <div
              key={log.id}
              onClick={() => onSelectItem(log)}
              className="group bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300 border border-transparent hover:border-primary/15 cursor-pointer"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-surface-container-high">
                <img
                  src={log.image}
                  alt={log.dishName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
                  }}
                />
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-extrabold text-on-surface truncate pr-2">{log.dishName}</h3>
                  <span className="font-bold text-[11px] px-2.5 py-0.5 bg-secondary-container text-on-secondary-container rounded-full shrink-0">
                    {log.calories} kcal
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[15px]">schedule</span>
                  {log.date}
                </p>
              </div>

              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-primary group-hover:bg-primary group-hover:text-white transition-all active:scale-90">
                <span className="material-symbols-outlined font-bold">chevron_right</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
