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
      <section className="mb-6 md:mb-10 text-center md:text-left">
        <div className="hidden md:flex flex-wrap justify-start gap-2 mb-4">
          <span className="bg-primary/10 text-primary px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            AI Food Recognition
          </span>
          <span className="bg-secondary/10 text-secondary px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            Calories Estimation
          </span>
          <span className="bg-tertiary/10 text-tertiary px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            Vietnamese Food
          </span>
        </div>
        <h2 className="text-2xl md:text-4xl font-black text-on-surface mb-2 md:mb-4 leading-tight">
          Nhận diện món ăn Việt &amp; ước tính calo bằng AI
        </h2>
        <p className="text-sm md:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Tải ảnh món ăn lên, hệ thống sẽ phân tích và trả về tên món cùng lượng calo tham khảo chỉ trong vài giây.
        </p>
      </section>

      {/* Bento layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Upload Card */}
        <div className="md:col-span-7 bg-white rounded-[24px] p-5 md:p-6 shadow-md border border-outline-variant/20">
          {!image ? (
            <div
              onDragOver={onDragOver}
              onDrop={onDrop}
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary/5 rounded-2xl p-8 md:p-14 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
            >
              <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" className="hidden" />
              <div className="w-16 h-16 bg-primary/10 hover:bg-primary/20 text-primary rounded-full flex items-center justify-center mb-6 group-active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-3xl font-bold">photo_camera</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-on-surface">Tải ảnh món ăn lên</h3>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                Kéo thả ảnh vào đây hoặc bấm để chọn ảnh
                <br />
                <span className="text-xs text-on-surface-variant/75 font-semibold">Hỗ trợ JPG, PNG, WEBP — tối đa 10MB</span>
              </p>
              <button className="bg-primary text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all">
                Chọn ảnh
              </button>
            </div>
          ) : (
            <div className="fade-in">
              <div className="relative rounded-2xl overflow-hidden mb-6 aspect-video bg-surface-container-high">
                <img src={`data:${mimeType};base64,${image}`} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/10"></div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onRecognize}
                  disabled={isAnalyzing}
                  className="flex-1 bg-primary text-white px-6 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">auto_awesome</span>
                  Nhận diện ngay
                </button>
                <button
                  onClick={onReset}
                  disabled={isAnalyzing}
                  className="bg-surface-container-low text-on-surface px-6 py-4 rounded-2xl font-bold text-sm hover:bg-surface-container-high active:scale-95 transition-all disabled:opacity-50"
                >
                  Chọn ảnh khác
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Card */}
        <div className="md:col-span-5 bg-white rounded-[24px] p-5 md:p-6 shadow-md border border-outline-variant/20 min-h-[380px] flex flex-col">
          <div className="flex items-center gap-2 mb-6 border-b border-outline-variant/20 pb-3">
            <span className="material-symbols-outlined text-primary">analytics</span>
            <h3 className="text-lg font-bold">Kết quả phân tích</h3>
          </div>

          {/* Empty State */}
          {!isAnalyzing && !result && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 fade-in">
              <div className="w-20 h-20 bg-surface-container-low text-outline rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl">image_search</span>
              </div>
              <p className="text-sm text-on-surface-variant font-semibold">
                Vui lòng tải ảnh món ăn để xem thông tin dinh dưỡng.
              </p>
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="flex-1 flex flex-col gap-6 fade-in justify-center py-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-high animate-skeleton"></div>
                <div className="flex-1 space-y-2.5">
                  <div className="h-6 w-1/2 bg-surface-container-high rounded-md animate-skeleton"></div>
                  <div className="h-4 w-1/3 bg-surface-container-high rounded-md animate-skeleton"></div>
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <div className="h-3 w-full bg-surface-container-high rounded animate-skeleton"></div>
                <div className="h-3 w-[90%] bg-surface-container-high rounded animate-skeleton"></div>
                <div className="h-3 w-[75%] bg-surface-container-high rounded animate-skeleton"></div>
              </div>
              <p className="text-center font-bold text-primary animate-pulse mt-4">Đang phân tích hình ảnh...</p>
            </div>
          )}

          {/* Result Content State */}
          {!isAnalyzing && result && (
            <div className="flex-1 flex flex-col fade-in">
              {result.annotatedImage && (
                <div className="rounded-2xl overflow-hidden mb-5 aspect-video bg-surface-container-high border border-outline-variant/20">
                  <img src={result.annotatedImage} alt="YOLO annotated result" className="w-full h-full object-cover" />
                </div>
              )}
              {/* Nutrition header */}
              <div className="bg-secondary-container/10 border border-secondary-container/20 rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                        {result.isVietnamese ? 'Hoàn tất' : 'Khác'}
                      </span>
                    </div>
                    <h4 className="text-xl font-extrabold text-on-surface">{result.dishName}</h4>
                    <span className="text-xs text-primary font-bold flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[15px] fill-icon">verified</span>
                      Độ tin cậy: {result.confidence}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                      Calo tham khảo
                    </span>
                    <span className="block text-2xl font-extrabold text-secondary">{result.calories} KCAL</span>
                    {result.calorieRange && (
                      <span className="block text-[11px] text-on-surface-variant font-semibold mt-1">
                        Khoảng ước tính: {result.calorieRange}
                      </span>
                    )}
                    <span className="text-xs text-on-surface-variant font-semibold">/ khẩu phần</span>
                  </div>
                </div>
                {result.hasLowConfidence && (
                  <p className="text-xs text-secondary font-bold mt-3 p-2 rounded-xl bg-secondary-container/20 border border-secondary-container/50">
                    Kết quả có độ tin cậy thấp, vui lòng thử ảnh rõ hơn.
                  </p>
                )}
                {result.description && (
                  <p className="text-xs text-on-surface-variant italic mt-3 pt-2.5 border-t border-secondary-container/10 leading-relaxed">
                    {result.description}
                  </p>
                )}
              </div>

              <div className="space-y-3 flex-1">
                {result.detections.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-surface-container-low text-sm font-semibold text-on-surface-variant">
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
                        className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20"
                      >
                        <div className="flex justify-between gap-4 items-start">
                          <div>
                            <h5 className="text-sm font-extrabold text-on-surface">{getDetectionName(detection)}</h5>
                            <p className="text-xs font-semibold text-on-surface-variant mt-1">
                              YOLO class: {detection.class_name} - {formatConfidence(detection.confidence)}%
                            </p>
                            {detection.nutrition?.matched === false && detection.nutrition?.message && (
                              <p className="text-xs text-error font-semibold mt-2">{detection.nutrition.message}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-sm font-extrabold text-secondary">
                              {calories !== null ? `${calories} KCAL` : 'Chưa có dữ liệu calories cho món này.'}
                            </span>
                            {minCalories !== null && maxCalories !== null && (
                              <span className="block text-[11px] text-on-surface-variant font-semibold mt-1">
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

              <div className="mt-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                <p className="text-xs text-on-surface-variant leading-relaxed font-semibold">
                  {result.calorieNote || CALORIE_ESTIMATION_NOTE}
                </p>
                {result.detections.length > 1 && (
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                    Tổng calo chỉ là tổng tham khảo của các món phát hiện được; hệ thống chưa đo được khối lượng thực tế từ ảnh.
                  </p>
                )}
              </div>

              {/* Save block */}
              <div className="mt-6 pt-5 border-t border-outline-variant/30">
                <p className="text-[10px] text-on-surface-variant/75 italic mb-3 font-medium">
                  * Calories chỉ là ước tính tham khảo theo khẩu phần chuẩn, không thay thế tư vấn dinh dưỡng chuyên môn.
                </p>
                <button
                  onClick={onSave}
                  disabled={isSaved}
                  className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm ${
                    isSaved
                      ? 'bg-surface-container-low text-on-surface-variant border border-outline-variant/30 cursor-not-allowed'
                      : 'bg-primary text-white hover:brightness-110'
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
        <div className="bg-surface-container-low p-5 rounded-2xl flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 border border-outline-variant/20">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined font-bold">bolt</span>
          </div>
          <div>
            <h5 className="font-bold text-sm mb-1">Nhận diện nhanh</h5>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Phân tích hình ảnh bằng backend YOLO và trả kết quả gợi ý theo độ tin cậy.
            </p>
          </div>
        </div>

        <div className="bg-surface-container-low p-5 rounded-2xl flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 border border-outline-variant/20">
          <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined font-bold">database</span>
          </div>
          <div>
            <h5 className="font-bold text-sm mb-1">Dữ liệu dinh dưỡng</h5>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Tra cứu calories từ mapping hiện có và báo rõ khi món chưa có dữ liệu.
            </p>
          </div>
        </div>

        <div className="bg-surface-container-low p-5 rounded-2xl flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 border border-outline-variant/20">
          <div className="w-10 h-10 bg-tertiary/10 text-tertiary rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined font-bold">touch_app</span>
          </div>
          <div>
            <h5 className="font-bold text-sm mb-1">Dễ sử dụng</h5>
            <p className="text-xs text-on-surface-variant leading-relaxed">Giao diện tối giản, phù hợp cho mọi lứa tuổi.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
