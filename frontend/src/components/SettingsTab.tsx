import { BACKEND_PREDICT_URL } from '../lib/recognition';

interface SettingsTabProps {
  historyCount: number;
  onClearHistory: () => void;
}

export default function SettingsTab({ historyCount, onClearHistory }: SettingsTabProps) {
  return (
    <div className="fade-in max-w-lg mx-auto bg-white rounded-3xl p-6 border border-[#bbcabf]/20 shadow-md">
      <h2 className="text-2xl font-extrabold text-[#151c27] mb-6">Thông tin hệ thống</h2>

      <div className="space-y-4">
        <div className="p-4 bg-[#f0f3ff] rounded-2xl flex justify-between items-center gap-4">
          <div>
            <h4 className="font-bold text-sm text-[#151c27]">Mô hình nhận dạng</h4>
            <p className="text-xs text-[#3c4a42] mt-0.5">Backend dùng YOLO best.pt; kết quả phụ thuộc ảnh và class đã train.</p>
          </div>
          <span className="font-extrabold text-xs text-[#006c49] bg-[#006c49]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            YOLO
          </span>
        </div>

        <div className="p-4 bg-[#f0f3ff] rounded-2xl">
          <h4 className="font-bold text-sm text-[#151c27]">Endpoint nhận dạng</h4>
          <p className="text-xs text-[#3c4a42] mt-1 leading-relaxed break-all">POST {BACKEND_PREDICT_URL}</p>
        </div>

        <div className="p-4 bg-[#f0f3ff] rounded-2xl">
          <h4 className="font-bold text-sm text-[#151c27]">Ghi chú phạm vi</h4>
          <p className="text-xs text-[#3c4a42] mt-1 leading-relaxed">
            Phiên bản này không có database và không có đăng nhập. Lịch sử chỉ được lưu cục bộ trên trình duyệt.
            Calories là ước tính tham khảo theo khẩu phần chuẩn.
          </p>
        </div>

        <div className="p-4 bg-[#f0f3ff] rounded-2xl flex justify-between items-center">
          <div>
            <h4 className="font-bold text-sm text-[#151c27]">Số bản ghi lịch sử</h4>
            <p className="text-xs text-[#3c4a42] mt-0.5">Dữ liệu cục bộ trong trình duyệt hiện tại</p>
          </div>
          <span className="font-extrabold text-sm text-[#006c49]">{historyCount} món</span>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-[#bbcabf]/30">
        <button
          onClick={onClearHistory}
          className="w-full bg-[#fef2f2] hover:bg-[#fde2e2] text-[#ba1a1a] font-bold text-sm py-3 rounded-2xl transition-all active:scale-[0.98]"
        >
          Xóa toàn bộ lịch sử cục bộ
        </button>
      </div>
    </div>
  );
}
