import type { ChangeEvent, DragEvent, RefObject } from 'react';
import type { RecognitionResult } from '../types';
import { CALORIE_ESTIMATION_NOTE, formatConfidence } from '../lib/recognition';

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
  const detections = result?.detections ?? [];
  const hasDetections = detections.length > 0;
  // A result only counts as "usable" (success badge, save button, calorie
  // footer) when at least one detection actually matched a food item.
  // hasDetections alone isn't enough: YOLO can detect something real (e.g.
  // "Con nguoi") that still isn't food and carries no calories.
  const hasUsableResult = result?.hasUsableResult ?? false;
  // The per-detection breakdown only adds information beyond the summary
  // header when there's more than one item, or when a single item still
  // needs its own "no calorie data" / "not counted" message.
  const showDetectionBreakdown =
    hasDetections &&
    (detections.length > 1 ||
      detections.some(
        (detection) => detection.nutrition?.matched === false || (detection.nutrition?.matched === true && !detection.counted_in_total),
      ));

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
              {hasUsableResult ? (
                <div className="bg-secondary-container/10 border border-secondary-container/20 rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                          Hoàn tất
                        </span>
                      </div>
                      <h4 className="text-xl font-extrabold text-on-surface">{result.dishName}</h4>
                      {!result.isMultiDish && (
                        <span className="text-xs text-primary font-bold flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[15px] fill-icon">verified</span>
                          Độ tin cậy: {result.confidence}%
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="block text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                        {result.isMultiDish ? 'Tổng calo cả ảnh' : 'Calo tham khảo'}
                      </span>
                      <span className="block text-2xl font-extrabold text-secondary">{result.calories} KCAL</span>
                      {result.calorieRange && (
                        <span className="block text-[11px] text-on-surface-variant font-semibold mt-1">
                          Khoảng ước tính: {result.calorieRange}
                        </span>
                      )}
                      {!result.isMultiDish && (
                        <span className="text-xs text-on-surface-variant font-semibold">/ khẩu phần</span>
                      )}
                    </div>
                  </div>
                  {result.hasLowConfidence && (
                    <p className="text-xs text-secondary font-bold mt-3 p-2 rounded-xl bg-secondary-container/20 border border-secondary-container/50">
                      Kết quả có độ tin cậy thấp, vui lòng thử ảnh rõ hơn.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-error-container/40 border border-error-container rounded-2xl p-4 mb-6 flex items-start gap-3">
                  <span className="material-symbols-outlined text-error">search_off</span>
                  <div>
                    <span className="bg-error/10 text-error px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                      Không tìm thấy
                    </span>
                    <p className="text-sm font-semibold text-on-surface mt-1.5">
                      {hasDetections
                        ? 'AI không nhận diện được món ăn nào có dữ liệu calo trong ảnh này (có thể là người hoặc vật thể khác). Vui lòng thử ảnh khác.'
                        : result.description}
                    </p>
                  </div>
                </div>
              )}

              {showDetectionBreakdown && (
                <div className="space-y-3 flex-1">
                  {detections.map((detection) => {
                    const isLowConfidenceUncounted =
                      detection.nutrition?.matched === true && !detection.counted_in_total;
                    return (
                      <div
                        key={`${detection.class_id}-${detection.class_name}-${detection.confidence}`}
                        className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20"
                      >
                        <div className="flex justify-between gap-4 items-start">
                          <div>
                            <h5 className="text-sm font-extrabold text-on-surface">{detection.dish_name}</h5>
                            <p className="text-xs font-semibold text-on-surface-variant mt-1">
                              YOLO class: {detection.class_name} - {formatConfidence(detection.confidence)}%
                            </p>
                            {detection.nutrition?.matched === false && detection.nutrition?.message && (
                              <p className="text-xs text-error font-semibold mt-2">{detection.nutrition.message}</p>
                            )}
                            {isLowConfidenceUncounted && (
                              <p className="text-xs text-secondary font-semibold mt-2">
                                Độ tin cậy thấp, chưa tính vào tổng calo.
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-sm font-extrabold text-secondary">
                              {detection.calories !== null ? `${detection.calories} KCAL` : 'Chưa có dữ liệu calories cho món này.'}
                            </span>
                            {detection.calorie_range && (
                              <span className="block text-[11px] text-on-surface-variant font-semibold mt-1">
                                Khoảng: {detection.calorie_range}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {hasUsableResult && (
                <div className="mt-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-xs text-on-surface-variant leading-relaxed font-semibold">
                    {result.calorieNote || CALORIE_ESTIMATION_NOTE}
                  </p>
                  {result.isMultiDish && (
                    <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                      Tổng calo chỉ là tổng tham khảo của các món phát hiện được; hệ thống chưa đo được khối lượng thực tế từ ảnh.
                    </p>
                  )}
                </div>
              )}

              {/* Save block */}
              {hasUsableResult && (
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
              )}
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
