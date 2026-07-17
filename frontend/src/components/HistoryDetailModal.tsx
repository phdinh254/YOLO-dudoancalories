import type { FoodLog } from '../types';

interface HistoryDetailModalProps {
  item: FoodLog;
  onClose: () => void;
}

export default function HistoryDetailModal({ item, onClose }: HistoryDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
      <div className="bg-white rounded-[24px] max-w-md w-full overflow-hidden shadow-2xl border border-outline-variant/20 flex flex-col max-h-[90dvh]">
        <div className="relative aspect-video w-full bg-surface-container-high shrink-0">
          <img
            src={item.image}
            alt={item.dishName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-5 flex-grow overflow-y-auto space-y-5">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-extrabold text-on-surface">{item.dishName}</h3>
                <span className="text-xs text-primary font-bold flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[15px] fill-icon">verified</span>
                  Độ tin cậy: {item.confidence}%
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xl font-extrabold text-secondary">{item.calories} KCAL</span>
                <span className="text-xs text-on-surface-variant font-semibold">{item.date}</span>
              </div>
            </div>
            {item.description && (
              <p className="text-xs text-on-surface-variant mt-3 leading-relaxed bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                {item.description}
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
            <p className="text-xs text-on-surface-variant leading-relaxed font-semibold">
              Calories trong lịch sử là ước tính tham khảo theo khẩu phần chuẩn, không thay thế tư vấn dinh dưỡng
              chuyên môn.
            </p>
          </div>
        </div>

        <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:brightness-110 transition-all active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
