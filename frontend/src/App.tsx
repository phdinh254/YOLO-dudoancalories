import React, { useState, useEffect, useRef } from 'react';

// Interfaces
interface FoodLog {
  id: string;
  dishName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  description: string;
  date: string;
  timestamp: number;
  image: string; // Base64 or URL
  isVietnamese: boolean;
  filterGroup: 'today' | 'week' | 'month';
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface YoloNutrition {
  matched?: boolean;
  food_id?: string | null;
  food_name_vi?: string;
  message?: string;
  calories_per_serving_selected?: number | string;
  calories_min_final?: number | string;
  calories_max_final?: number | string;
}

interface YoloDetection {
  class_id: number;
  class_name: string;
  confidence: number;
  nutrition?: YoloNutrition | null;
}

interface YoloPredictResponse {
  success: boolean;
  filename: string;
  message: string;
  detections: YoloDetection[];
  total_calories_estimated?: number | string;
  calorie_estimation_note?: string;
  annotated_image_base64?: string;
}

interface RecognitionResult extends Partial<FoodLog> {
  filename?: string;
  message?: string;
  detections: YoloDetection[];
  annotatedImage?: string;
  calorieRange?: string;
  calorieNote?: string;
  hasLowConfidence?: boolean;
  totalCalories: number;
}

const BACKEND_PREDICT_URL = import.meta.env.VITE_BACKEND_PREDICT_URL || 'http://127.0.0.1:8000/predict';
const REQUEST_TIMEOUT_MS = 30000;
const LOW_CONFIDENCE_THRESHOLD = 0.5;
const MAX_HISTORY_ITEMS = 50;
const CALORIE_ESTIMATION_NOTE =
  'Calories chỉ là ước tính tham khảo theo khẩu phần chuẩn, không thay thế tư vấn dinh dưỡng chuyên môn.';

const toNumber = (value: number | string | null | undefined): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized || normalized.toLowerCase().includes('chua') || normalized.toLowerCase().includes('missing')) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getDetectionName = (detection: YoloDetection): string => {
  return detection.nutrition?.food_name_vi || detection.class_name;
};

const getDetectionCalories = (detection: YoloDetection): number | null => {
  return toNumber(detection.nutrition?.calories_per_serving_selected);
};

const formatConfidence = (confidence: number): number => {
  return Math.round(confidence * 1000) / 10;
};

const buildRecognitionResult = (data: YoloPredictResponse): RecognitionResult => {
  const detections = Array.isArray(data.detections) ? data.detections : [];
  const primaryDetection = detections[0];
  const calories =
    toNumber(data.total_calories_estimated) ??
    detections.reduce((sum, detection) => sum + (getDetectionCalories(detection) ?? 0), 0);
  const primaryMin = toNumber(primaryDetection?.nutrition?.calories_min_final);
  const primaryMax = toNumber(primaryDetection?.nutrition?.calories_max_final);
  const hasLowConfidence = detections.some((detection) => detection.confidence < LOW_CONFIDENCE_THRESHOLD);

  return {
    filename: data.filename,
    message: data.message,
    detections,
    annotatedImage: data.annotated_image_base64,
    dishName: primaryDetection ? getDetectionName(primaryDetection) : 'Không nhận dạng được món ăn',
    calories,
    totalCalories: calories,
    protein: 0,
    carbs: 0,
    fat: 0,
    confidence: primaryDetection ? formatConfidence(primaryDetection.confidence) : 0,
    description:
      data.message ||
      'Không nhận dạng được món ăn. Vui lòng thử ảnh rõ hơn, đủ sáng và món ăn nằm trong khung hình.',
    isVietnamese: true,
    calorieRange: primaryMin !== null && primaryMax !== null ? `${primaryMin} - ${primaryMax} KCAL` : undefined,
    calorieNote: data.calorie_estimation_note || CALORIE_ESTIMATION_NOTE,
    hasLowConfidence,
  };
};

export default function App() {
  const [tab, setTab] = useState<'recognize' | 'history' | 'settings'>('recognize');

  // App States
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [historyList, setHistoryList] = useState<FoodLog[]>([]);
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month'>('today');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<FoodLog | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load local browser history only. This demo has no database or auth session.
  useEffect(() => {
    const storedHistory = localStorage.getItem('vietfood_history');
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory);
        setHistoryList(Array.isArray(parsedHistory) ? parsedHistory : []);
      } catch {
        localStorage.removeItem('vietfood_history');
        setHistoryList([]);
      }
    } else {
      setHistoryList([]);
    }
  }, []);

  // Show Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('File không phải ảnh. Hãy chọn ảnh JPG, PNG hoặc WEBP.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File ảnh quá lớn, giới hạn tối đa 10MB', 'error');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      setImage(base64String);
      setMimeType(file.type);
      setResult(null);
      setIsSaved(false);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Call API for Food Recognition
  const handleRecognize = async () => {
    if (!selectedFile || !image || !mimeType) {
      showToast('Vui lòng tải ảnh món ăn trước', 'error');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(BACKEND_PREDICT_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        if (!data?.success) {
          showToast(data?.message || 'Backend không thể nhận dạng ảnh này.', 'error');
          return;
        }
        const mappedResult = buildRecognitionResult(data);
        setResult(mappedResult);
        if (mappedResult.detections.length === 0) {
          showToast(
            data.message || 'Không nhận dạng được món ăn. Vui lòng thử ảnh rõ hơn, đủ sáng và món ăn nằm trong khung hình.',
            'info',
          );
          return;
        }
        if (mappedResult.hasLowConfidence) {
          showToast('Kết quả có độ tin cậy thấp, vui lòng thử ảnh rõ hơn.', 'info');
        }
        if (mappedResult.totalCalories === 0) {
          showToast('Nhận dạng được món, nhưng chưa có dữ liệu calories cho món này.', 'info');
          return;
        }
        showToast('Nhận diện hoàn tất!', 'success');
      } else {
        showToast(data?.detail || data?.message || 'Backend trả về lỗi khi nhận dạng ảnh.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      const message =
        err?.name === 'AbortError'
          ? 'Request nhận dạng quá thời gian chờ. Hãy thử lại.'
          : 'Không thể kết nối backend YOLO. Hãy kiểm tra server http://127.0.0.1:8000.';
      showToast(message, 'error');
      return;
    } finally {
      window.clearTimeout(timeoutId);
      setIsAnalyzing(false);
    }
  };

  const resetUpload = () => {
    setImage(null);
    setMimeType(null);
    setSelectedFile(null);
    setResult(null);
    setIsSaved(false);
  };

  // Save scan result to local journal
  const saveToJournal = () => {
    if (!result) return;

    const newLog: FoodLog = {
      id: Date.now().toString(),
      dishName: result.dishName || 'Món ăn không tên',
      calories: result.calories || 0,
      protein: result.protein || 0,
      carbs: result.carbs || 0,
      fat: result.fat || 0,
      confidence: result.confidence || 95,
      description: result.description || 'Số liệu dinh dưỡng tham khảo.',
      date: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - Hôm nay',
      timestamp: Date.now(),
      image: result.annotatedImage || (image ? `data:${mimeType};base64,${image}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'),
      isVietnamese: result.isVietnamese ?? true,
      filterGroup: 'today'
    };

    const updatedHistory = [newLog, ...historyList].slice(0, MAX_HISTORY_ITEMS);
    try {
      localStorage.setItem('vietfood_history', JSON.stringify(updatedHistory));
    } catch {
      showToast('Không thể lưu vào nhật ký, bộ nhớ trình duyệt đã đầy.', 'error');
      return;
    }
    setHistoryList(updatedHistory);
    setIsSaved(true);
    showToast('Đã lưu món ăn vào nhật ký dinh dưỡng!', 'success');
  };

  // Filter logs logic
  const filteredHistory = historyList.filter((log) => {
    if (activeFilter === 'today') return log.filterGroup === 'today' || log.date.includes('Hôm nay');
    if (activeFilter === 'week') return log.filterGroup === 'today' || log.filterGroup === 'week' || log.date.includes('Hôm nay') || log.date.includes('Hôm qua');
    return true; // Monthly gets all
  });

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#151c27] flex flex-col font-sans pb-24 md:pb-0">
      {/* Toast System */}
      <div className="fixed top-20 right-4 md:right-8 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-lg border max-w-xs transition-all duration-300 transform translate-x-0 fade-in ${
              t.type === 'success'
                ? 'bg-[#ecfdf5] text-[#006c49] border-[#006c49]/20'
                : t.type === 'error'
                ? 'bg-[#fef2f2] text-[#ba1a1a] border-[#ba1a1a]/20'
                : 'bg-[#f0f3ff] text-[#005ac2] border-[#005ac2]/20'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
            </span>
            <span className="text-sm font-semibold">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Top Application Bar */}
      <header className="fixed top-0 w-full z-50 bg-[#f9f9ff]/80 backdrop-blur-md shadow-sm flex justify-between items-center px-6 md:px-12 h-16 border-b border-[#bbcabf]/30">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            setTab('recognize');
          }}
        >
          <span className="material-symbols-outlined text-[#006c49] text-3xl font-bold">restaurant</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#006c49]">VietFood AI</h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => setTab('recognize')}
            className={`font-medium text-sm flex items-center gap-1.5 py-1 transition-all ${
              tab === 'recognize' ? 'text-[#006c49] border-b-2 border-[#006c49]' : 'text-[#3c4a42] hover:text-[#006c49]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">photo_camera</span> Nhận diện
          </button>
          <button
            onClick={() => setTab('history')}
            className={`font-medium text-sm flex items-center gap-1.5 py-1 transition-all ${
              tab === 'history' ? 'text-[#006c49] border-b-2 border-[#006c49]' : 'text-[#3c4a42] hover:text-[#006c49]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">history</span> Lịch sử
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`font-medium text-sm flex items-center gap-1.5 py-1 transition-all ${
              tab === 'settings' ? 'text-[#006c49] border-b-2 border-[#006c49]' : 'text-[#3c4a42] hover:text-[#006c49]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span> Thông tin hệ thống
          </button>
        </nav>

        {/* Mobile/Quick Actions */}
        <div className="md:hidden flex items-center gap-2">
          <button onClick={() => setTab('settings')} className="p-2 text-[#3c4a42] hover:text-[#006c49]">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow pt-24 pb-12 px-5 md:px-12 max-w-[1200px] w-full mx-auto">
        
        {/* Application Content */}
            {/* View Tab 1: RECOGNIZE (Nhận diện) */}
            {tab === 'recognize' && (
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
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => {
                          fileInputRef.current?.click();
                        }}
                        className="border-2 border-dashed border-[#bbcabf] hover:border-[#006c49] hover:bg-[#006c49]/5 rounded-2xl p-8 md:p-14 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="w-16 h-16 bg-[#006c49]/10 hover:bg-[#006c49]/20 text-[#006c49] rounded-full flex items-center justify-center mb-6 group-active:scale-90 transition-transform">
                          <span className="material-symbols-outlined text-3xl font-bold">photo_camera</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-[#151c27]">Tải ảnh món ăn lên</h3>
                        <p className="text-sm text-[#3c4a42] mb-6 leading-relaxed">
                          Kéo thả ảnh vào đây hoặc bấm để chọn ảnh<br />
                          <span className="text-xs text-[#3c4a42]/75 font-semibold">Hỗ trợ JPG, PNG, WEBP — tối đa 10MB</span>
                        </p>
                        <button className="bg-[#006c49] text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all">
                          Chọn ảnh
                        </button>
                      </div>
                    ) : (
                      <div className="fade-in">
                        <div className="relative rounded-2xl overflow-hidden mb-6 aspect-video bg-[#e2e8f8]">
                          <img
                            src={`data:${mimeType};base64,${image}`}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/10"></div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            onClick={handleRecognize}
                            disabled={isAnalyzing}
                            className={`flex-1 bg-[#006c49] text-white px-6 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50`}
                          >
                            <span className="material-symbols-outlined">auto_awesome</span>
                            Nhận diện ngay
                          </button>
                          <button
                            onClick={resetUpload}
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
                        <p className="text-center font-bold text-[#006c49] animate-pulse mt-4">
                          Đang phân tích hình ảnh...
                        </p>
                      </div>
                    )}

                    {/* Result Content State */}
                    {!isAnalyzing && result && (
                      <div className="flex-1 flex flex-col fade-in">
                        {result.annotatedImage && (
                          <div className="rounded-2xl overflow-hidden mb-5 aspect-video bg-[#e2e8f8] border border-[#bbcabf]/20">
                            <img
                              src={result.annotatedImage}
                              alt="YOLO annotated result"
                              className="w-full h-full object-cover"
                            />
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
                            onClick={saveToJournal}
                            disabled={isSaved}
                            className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm ${
                              isSaved
                                ? 'bg-[#f0f3ff] text-[#3c4a42] border border-[#bbcabf]/30 cursor-not-allowed'
                                : 'bg-[#006c49] text-white hover:brightness-110'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {isSaved ? 'check' : 'bookmark'}
                            </span>
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
                      <p className="text-xs text-[#3c4a42] leading-relaxed">Phân tích hình ảnh bằng backend YOLO và trả kết quả gợi ý theo độ tin cậy.</p>
                    </div>
                  </div>

                  <div className="bg-[#f0f3ff] p-5 rounded-2xl flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 border border-[#bbcabf]/20">
                    <div className="w-10 h-10 bg-[#855300]/10 text-[#855300] rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined font-bold">database</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm mb-1">Dữ liệu dinh dưỡng</h5>
                      <p className="text-xs text-[#3c4a42] leading-relaxed">Tra cứu calories từ mapping hiện có và báo rõ khi món chưa có dữ liệu.</p>
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
            )}

        {/* View Tab 2: HISTORY (Lịch sử) */}
            {tab === 'history' && (
              <div className="fade-in max-w-3xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-3xl font-black text-[#151c27] mb-1 leading-tight">Lịch sử nhận diện</h2>
                  <p className="text-sm text-[#3c4a42] font-semibold">Lịch sử được lưu cục bộ trên trình duyệt hiện tại.</p>
                </div>

                {/* Filter chips */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setActiveFilter('today')}
                    className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-xs transition-all active:scale-95 ${
                      activeFilter === 'today'
                        ? 'bg-[#10b981] text-white shadow-sm'
                        : 'bg-[#e2e8f8] text-[#3c4a42] hover:bg-[#dce2f3]'
                    }`}
                  >
                    Hôm nay
                  </button>
                  <button
                    onClick={() => setActiveFilter('week')}
                    className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-xs transition-all active:scale-95 ${
                      activeFilter === 'week'
                        ? 'bg-[#10b981] text-white shadow-sm'
                        : 'bg-[#e2e8f8] text-[#3c4a42] hover:bg-[#dce2f3]'
                    }`}
                  >
                    Tuần này
                  </button>
                  <button
                    onClick={() => setActiveFilter('month')}
                    className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-xs transition-all active:scale-95 ${
                      activeFilter === 'month'
                        ? 'bg-[#10b981] text-white shadow-sm'
                        : 'bg-[#e2e8f8] text-[#3c4a42] hover:bg-[#dce2f3]'
                    }`}
                  >
                    Tháng này
                  </button>
                </div>

                {/* Logs list */}
                {filteredHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-[#bbcabf]/20">
                    <span className="material-symbols-outlined text-6xl text-[#6c7a71] mb-4">history_toggle_off</span>
                    <p className="text-base font-bold text-[#3c4a42]">Chưa có lịch sử nhận diện nào trong khoảng thời gian này.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {filteredHistory.map((log) => (
                      <div
                        key={log.id}
                        onClick={() => setSelectedHistoryItem(log)}
                        className="group bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300 border border-transparent hover:border-[#006c49]/15 cursor-pointer"
                      >
                        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-[#e2e8f8]">
                          <img
                            src={log.image}
                            alt={log.dishName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              // fallback image
                              e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
                            }}
                          />
                        </div>

                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-lg font-extrabold text-[#151c27] truncate pr-2">{log.dishName}</h3>
                            <span className="font-bold text-[11px] px-2.5 py-0.5 bg-[#ffddb8] text-[#2a1700] rounded-full shrink-0">
                              {log.calories} kcal
                            </span>
                          </div>
                          <p className="text-xs text-[#3c4a42] flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[15px]">schedule</span>
                            {log.date}
                          </p>
                        </div>

                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f0f3ff] text-[#006c49] group-hover:bg-[#006c49] group-hover:text-white transition-all active:scale-90">
                          <span className="material-symbols-outlined font-bold">chevron_right</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

        {/* View Tab 3: SYSTEM INFO */}
        {tab === 'settings' && (
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
                <p className="text-xs text-[#3c4a42] mt-1 leading-relaxed break-all">
                  POST {BACKEND_PREDICT_URL}
                </p>
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
                <span className="font-extrabold text-sm text-[#006c49]">
                  {historyList.length} món
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#bbcabf]/30">
              <button
                onClick={() => {
                  if (confirm('Bạn có muốn xóa toàn bộ lịch sử quét cục bộ không?')) {
                    setHistoryList([]);
                    localStorage.setItem('vietfood_history', JSON.stringify([]));
                    showToast('Đã xóa toàn bộ lịch sử quét cục bộ', 'info');
                  }
                }}
                className="w-full bg-[#fef2f2] hover:bg-[#fde2e2] text-[#ba1a1a] font-bold text-sm py-3 rounded-2xl transition-all active:scale-[0.98]"
              >
                Xóa toàn bộ lịch sử cục bộ
              </button>
            </div>
          </div>
        )}
      </main>

      {/* History Detail Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-[24px] max-w-md w-full overflow-hidden shadow-2xl border border-[#bbcabf]/20 flex flex-col max-h-[90dvh]">
            <div className="relative aspect-video w-full bg-[#e2e8f8] shrink-0">
              <img
                src={selectedHistoryItem.image}
                alt={selectedHistoryItem.dishName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
                }}
              />
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-5 flex-grow overflow-y-auto space-y-5">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-extrabold text-[#151c27]">{selectedHistoryItem.dishName}</h3>
                    <span className="text-xs text-[#006c49] font-bold flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[15px] fill-icon">verified</span>
                      Độ tin cậy: {selectedHistoryItem.confidence}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl font-extrabold text-[#855300]">{selectedHistoryItem.calories} KCAL</span>
                    <span className="text-xs text-[#3c4a42] font-semibold">{selectedHistoryItem.date}</span>
                  </div>
                </div>
                {selectedHistoryItem.description && (
                  <p className="text-xs text-[#3c4a42] mt-3 leading-relaxed bg-[#f0f3ff] p-3 rounded-xl border border-[#bbcabf]/20">
                    {selectedHistoryItem.description}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#f0f3ff] border border-[#bbcabf]/20">
                <p className="text-xs text-[#3c4a42] leading-relaxed font-semibold">
                  Calories trong lịch sử là ước tính tham khảo theo khẩu phần chuẩn, không thay thế tư vấn dinh dưỡng chuyên môn.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#f0f3ff] border-t border-[#bbcabf]/20 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="bg-[#006c49] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:brightness-110 transition-all active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-[#f9f9ff]/80 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-[#bbcabf]/30 flex justify-around items-center px-4 pb-6 pt-2">
        <button
          onClick={() => setTab('recognize')}
          className={`flex flex-col items-center justify-center transition-all ${
            tab === 'recognize' ? 'bg-[#006c49]/10 text-[#006c49] px-5 py-1.5 rounded-2xl font-bold' : 'text-[#3c4a42]'
          }`}
        >
          <span className={`material-symbols-outlined ${tab === 'recognize' ? 'fill-icon' : ''}`}>photo_camera</span>
          <span className="text-[10px] font-bold mt-0.5">Nhận diện</span>
        </button>

        <button
          onClick={() => setTab('history')}
          className={`flex flex-col items-center justify-center transition-all ${
            tab === 'history' ? 'bg-[#006c49]/10 text-[#006c49] px-5 py-1.5 rounded-2xl font-bold' : 'text-[#3c4a42]'
          }`}
        >
          <span className={`material-symbols-outlined ${tab === 'history' ? 'fill-icon' : ''}`}>history</span>
          <span className="text-[10px] font-bold mt-0.5">Lịch sử</span>
        </button>

        <button
          onClick={() => setTab('settings')}
          className={`flex flex-col items-center justify-center transition-all ${
            tab === 'settings' ? 'bg-[#006c49]/10 text-[#006c49] px-5 py-1.5 rounded-2xl font-bold' : 'text-[#3c4a42]'
          }`}
        >
          <span className={`material-symbols-outlined ${tab === 'settings' ? 'fill-icon' : ''}`}>settings</span>
          <span className="text-[10px] font-bold mt-0.5">Hệ thống</span>
        </button>
      </nav>

      {/* Desktop Footer Only */}
      <footer className="hidden md:flex w-full bg-white py-8 px-12 justify-between items-center border-t border-[#bbcabf]/20 mt-12">
        <p className="text-sm text-[#3c4a42] font-semibold">© 2026 VietFood AI - Chuyên gia dinh dưỡng số</p>
        <div className="flex gap-6">
          <a href="#" onClick={(e) => {e.preventDefault(); showToast('Tính năng giới thiệu đang phát triển', 'info');}} className="text-sm text-[#3c4a42] hover:text-[#006c49] font-bold hover:underline transition-all">Về chúng tôi</a>
          <a href="#" onClick={(e) => {e.preventDefault(); showToast('Điều khoản đang phát triển', 'info');}} className="text-sm text-[#3c4a42] hover:text-[#006c49] font-bold hover:underline transition-all">Điều khoản</a>
          <a href="#" onClick={(e) => {e.preventDefault(); showToast('Tính năng liên hệ đang phát triển', 'info');}} className="text-sm text-[#3c4a42] hover:text-[#006c49] font-bold hover:underline transition-all">Liên hệ</a>
        </div>
      </footer>
    </div>
  );
}
