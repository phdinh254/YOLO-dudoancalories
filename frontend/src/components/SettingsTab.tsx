import { MAX_HISTORY_ITEMS } from '../lib/history-storage';

interface SettingsTabProps {
  historyCount: number;
  onClearHistory: () => void;
}

export default function SettingsTab({ historyCount, onClearHistory }: SettingsTabProps) {
  return (
    <div className="fade-in max-w-lg mx-auto bg-white rounded-3xl p-6 border border-outline-variant/20 shadow-md">
      <h2 className="text-2xl font-extrabold text-on-surface mb-6">Thông tin hệ thống</h2>

      <div className="space-y-5">
        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">Về ứng dụng</h3>
          <div className="space-y-3">
            <div className="p-4 bg-surface-container-low rounded-2xl flex justify-between items-center gap-4">
              <div>
                <h4 className="font-bold text-sm text-on-surface">Mô hình nhận dạng</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Backend dùng YOLO best.pt; kết quả phụ thuộc ảnh và class đã train.
                </p>
              </div>
              <span className="font-extrabold text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                YOLO
              </span>
            </div>

            <div className="p-4 bg-surface-container-low rounded-2xl">
              <h4 className="font-bold text-sm text-on-surface">Phạm vi &amp; giới hạn</h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Đây là bản demo, không có tài khoản hay đăng nhập. Calories chỉ là ước tính tham khảo theo khẩu phần
                chuẩn, không thay thế tư vấn dinh dưỡng chuyên môn.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">Dữ liệu của bạn</h3>
          <div className="p-4 bg-surface-container-low rounded-2xl flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm text-on-surface">Số bản ghi lịch sử</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Lưu cục bộ trên trình duyệt này, tối đa {MAX_HISTORY_ITEMS} bản ghi gần nhất.
              </p>
            </div>
            <span className="font-extrabold text-sm text-primary shrink-0">
              {historyCount}/{MAX_HISTORY_ITEMS} món
            </span>
          </div>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-outline-variant/30">
        <button
          onClick={onClearHistory}
          className="w-full bg-error-container hover:brightness-95 text-error font-bold text-sm py-3 rounded-2xl transition-all active:scale-[0.98]"
        >
          Xóa toàn bộ lịch sử cục bộ
        </button>
      </div>
    </div>
  );
}
