import type { ChangeEvent, DragEvent, RefObject } from 'react';
import type { RecognitionResult } from '../types';
import { CALORIE_ESTIMATION_NOTE, getDetectionCalories, getDetectionName, formatConfidence, toNumber } from '../lib/recognition';

interface RecognizeTabProps {
  image: string | null;
  mimeType: string | null;
  isAnalyzing: boolean;
  result: RecognitionResult | null;
  isSaved: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onRecognize: () => void;
  onReset: () => void;
  onSave: () => void;
}

export default function RecognizeTab({
  image,
  mimeType,
  isAnalyzing,
  result,
  isSaved,
  fileInputRef,
  onFileChange,
  onDragOver,
  onDrop,
  onRecognize,
  onReset,
  onSave,
}: RecognizeTabProps) {
  return (
    <div className="fade-in">
      {/* Hero section */}
      <section className="mb-10 text-center md:text-left">
        <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
          <span className="bg-[#006c49]/10 text-[#006c49] px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            AI Food Recognition
          </span>
          <span className="bg-[#855300]/10 text-[#855300] px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            Calories Estimation
          </span>
          <span className="bg-[#005ac2]/10 text-[#005ac2] px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            Vietnamese Food
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-[#151c27] mb-4 leading-tight">
          Nhận diện món ăn Việt &amp; ước tính calo bằng AI
        </h2>
        <p className="text-base md:text-lg text-[#3c4a42] max-w-2xl leading-relaxed">
          Tải ảnh món ăn lên, hệ thống sẽ phân tích và trả về tên món cùng lượng calo tham khảo chỉ trong vài giây.
        </p>
      </section>

      {/* Bento layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Upload Card */}
        <div className="md:col-span-7 bg-white rounded-[24px] p-5 md:p-6 shadow-md border border-[#bbcabf]/20">
          {!image ? (
            <div
              onDragOver={onDragOver}
              onDrop={onDrop}
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="border-2 border-dashed border-[#bbcabf] hover:border-[#006c49] hover:bg-[#006c49]/5 rounded-2xl p-8 md:p-14 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
            >
              <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" className="hidden" />
              <div className="w-16 h-16 bg-[#006c49]/10 hover:bg-[#006c49]/20 text-[#006c49] rounded-full flex items-center justify-center mb-6 group-active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-3xl font-bold">photo_camera</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#151c27]">Tải ảnh món ăn lên</h3>
              <p className="text-sm text-[#3c4a42] mb-6 leading-relaxed">
                Kéo thả ảnh vào đây hoặc bấm để chọn ảnh
                <br />
                <span className="text-xs text-[#3c4a42]/75 font-semibold">Hỗ trợ JPG, PNG, WEBP — tối đa 10MB</span>
              </p>
              <button className="bg-[#006c49] text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all">
                Chọn ảnh
              </button>
            </div>
          ) : (
            <div className="fade-in">
              <div className="relative rounded-2xl overflow-hidden mb-6 aspect-video bg-[#e2e8f8]">
                <img src={`data:${mimeType};base64,${image}`} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/10"></div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onRecognize}
                  disabled={isAnalyzing}
                  className="flex-1 bg-[#006c49] text-white px-6 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">auto_awesome</span>
                  Nhận diện ngay
                </button>
                <button
                  onClick={onReset}
                  disabled={isAnalyzing}
                  className="bg-[#f0f3ff] text-[#151c27] px-6 py-4 rounded-2xl font-bold text-sm hover:bg-[#e2e8f8] active:scale-95 transition-all disabled:opacity-50"
                >
                  Chọn ảnh khác
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Card */}
        <div className="md:col-span-5 bg-white rounded-[24px] p-5 md:p-6 shadow-md border border-[#bbcabf]/20 min-h-[380px] flex flex-col">
          <div className="flex items-center gap-2 mb-6 border-b border-[#bbcabf]/20 pb-3">
            <span className="material-symbols-outlined text-[#006c49]">analytics</span>
            <h3 className="text-lg font-bold">Kết quả phân tích</h3>
          </div>

          {/* Empty State */}
          {!isAnalyzing && !result && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 fade-in">
              <div className="w-20 h-20 bg-[#f0f3ff] text-[#6c7a71] rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl">image_search</span>
              </div>
              <p className="text-sm text-[#3c4a42] font-semibold">
                Vui lòng tải ảnh món ăn để xem thông tin dinh dưỡng.
              </p>
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="flex-1 flex flex-col gap-6 fade-in justify-center py-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#e2e8f8] animate-skeleton"></div>
                <div className="flex-1 space-y-2.5">
                  <div className="h-6 w-1/2 bg-[#e2e8f8] rounded-md animate-skeleton"></div>
                  <div className="h-4 w-1/3 bg-[#e2e8f8] rounded-md animate-skeleton"></div>
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <div className="h-3 w-full bg-[#e2e8f8] rounded animate-skeleton"></div>
                <div className="h-3 w-[90%] bg-[#e2e8f8] rounded animate-skeleton"></div>
                <div className="h-3 w-[75%] bg-[#e2e8f8] rounded animate-skeleton"></div>
              </div>
              <p className="text-center font-bold text-[#006c49] animate-pulse mt-4">Đang phân tích hình ảnh...</p>
            </div>
          )}

          {/* Result Content State */}
          {!isAnalyzing && result && (
            <div className="flex-1 flex flex-col fade-in">
              {result.annotatedImage && (
                <div className="rounded-2xl overflow-hidden mb-5 aspect-video bg-[#e2e8f8] border border-[#bbcabf]/20">
                  <img src={result.annotatedImage} alt="YOLO annotated result" className="w-full h-full object-cover" />
                </div>
              )}
              {/* Nutrition header */}
              <div className="bg-[#fea619]/10 border border-[#fea619]/20 rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-[#006c49]/10 text-[#006c49] px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                        {result.isVietnamese ? 'Hoàn tất' : 'Khác'}
                      </span>
                    </div>
                    <h4 className="text-xl font-extrabold text-[#151c27]">{result.dishName}</h4>
                    <span className="text-xs text-[#006c49] font-bold flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[15px] fill-icon">verified</span>
                      Độ tin cậy: {result.confidence}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] text-[#3c4a42] font-bold uppercase tracking-wider">
                      Calo tham khảo
                    </span>
                    <span className="block text-2xl font-extrabold text-[#855300]">{result.calories} KCAL</span>
                    {result.calorieRange && (
                      <span className="block text-[11px] text-[#3c4a42] font-semibold mt-1">
                        Khoảng ước tính: {result.calorieRange}
                      </span>
                    )}
                    <span className="text-xs text-[#3c4a42] font-semibold">/ khẩu phần</span>
                  </div>
                </div>
                {result.hasLowConfidence && (
                  <p className="text-xs text-[#855300] font-bold mt-3 p-2 rounded-xl bg-[#fff4d6] border border-[#fea619]/30">
                    Kết quả có độ tin cậy thấp, vui lòng thử ảnh rõ hơn.
                  </p>
                )}
                {result.description && (
                  <p className="text-xs text-[#3c4a42] italic mt-3 pt-2.5 border-t border-[#fea619]/10 leading-relaxed">
                    {result.description}
                  </p>
                )}
              </div>

              <div className="space-y-3 flex-1">
                {result.detections.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#f0f3ff] text-sm font-semibold text-[#3c4a42]">
                    Không nhận dạng được món ăn. Vui lòng thử ảnh rõ hơn, đủ sáng và món ăn nằm trong khung hình.
                  </div>
                ) : (
                  result.detections.map((detection) => {
                    const calories = getDetectionCalories(detection);
                    const minCalories = toNumber(detection.nutrition?.calories_min_final);
                    const maxCalories = toNumber(detection.nutrition?.calories_max_final);
                    return (
                      <div
                        key={`${detection.class_id}-${detection.class_name}-${detection.confidence}`}
                        className="p-4 rounded-2xl bg-[#f0f3ff] border border-[#bbcabf]/20"
                      >
                        <div className="flex justify-between gap-4 items-start">
                          <div>
                            <h5 className="text-sm font-extrabold text-[#151c27]">{getDetectionName(detection)}</h5>
                            <p className="text-xs font-semibold text-[#3c4a42] mt-1">
                              YOLO class: {detection.class_name} - {formatConfidence(detection.confidence)}%
                            </p>
                            {detection.nutrition?.matched === false && detection.nutrition?.message && (
                              <p className="text-xs text-[#ba1a1a] font-semibold mt-2">{detection.nutrition.message}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-sm font-extrabold text-[#855300]">
                              {calories !== null ? `${calories} KCAL` : 'Chưa có dữ liệu calories cho món này.'}
                            </span>
                            {minCalories !== null && maxCalories !== null && (
                              <span className="block text-[11px] text-[#3c4a42] font-semibold mt-1">
                                Khoảng: {minCalories} - {maxCalories} KCAL
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-[#f0f3ff] border border-[#bbcabf]/20">
                <p className="text-xs text-[#3c4a42] leading-relaxed font-semibold">
                  {result.calorieNote || CALORIE_ESTIMATION_NOTE}
                </p>
                {result.detections.length > 1 && (
                  <p className="text-xs text-[#3c4a42] leading-relaxed mt-2">
                    Tổng calo chỉ là tổng tham khảo của các món phát hiện được; hệ thống chưa đo được khối lượng thực tế từ ảnh.
                  </p>
                )}
              </div>

              {/* Save block */}
              <div className="mt-6 pt-5 border-t border-[#bbcabf]/30">
                <p className="text-[10px] text-[#3c4a42]/75 italic mb-3 font-medium">
                  * Calories chỉ là ước tính tham khảo theo khẩu phần chuẩn, không thay thế tư vấn dinh dưỡng chuyên môn.
                </p>
                <button
                  onClick={onSave}
                  disabled={isSaved}
                  className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm ${
                    isSaved
                      ? 'bg-[#f0f3ff] text-[#3c4a42] border border-[#bbcabf]/30 cursor-not-allowed'
                      : 'bg-[#006c49] text-white hover:brightness-110'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{isSaved ? 'check' : 'bookmark'}</span>
                  {isSaved ? 'Đã lưu vào nhật ký' : 'Lưu vào nhật ký'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features banner */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
        <div className="bg-[#f0f3ff] p-5 rounded-2xl flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 border border-[#bbcabf]/20">
          <div className="w-10 h-10 bg-[#006c49]/10 text-[#006c49] rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined font-bold">bolt</span>
          </div>
          <div>
            <h5 className="font-bold text-sm mb-1">Nhận diện nhanh</h5>
            <p className="text-xs text-[#3c4a42] leading-relaxed">
              Phân tích hình ảnh bằng backend YOLO và trả kết quả gợi ý theo độ tin cậy.
            </p>
          </div>
        </div>

        <div className="bg-[#f0f3ff] p-5 rounded-2xl flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 border border-[#bbcabf]/20">
          <div className="w-10 h-10 bg-[#855300]/10 text-[#855300] rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined font-bold">database</span>
          </div>
          <div>
            <h5 className="font-bold text-sm mb-1">Dữ liệu dinh dưỡng</h5>
            <p className="text-xs text-[#3c4a42] leading-relaxed">
              Tra cứu calories từ mapping hiện có và báo rõ khi món chưa có dữ liệu.
            </p>
          </div>
        </div>

        <div className="bg-[#f0f3ff] p-5 rounded-2xl flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 border border-[#bbcabf]/20">
          <div className="w-10 h-10 bg-[#005ac2]/10 text-[#005ac2] rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined font-bold">touch_app</span>
          </div>
          <div>
            <h5 className="font-bold text-sm mb-1">Dễ sử dụng</h5>
            <p className="text-xs text-[#3c4a42] leading-relaxed">Giao diện tối giản, phù hợp cho mọi lứa tuổi.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
