import React, { useState, useEffect, useRef } from 'react';
import AppHeader from './components/AppHeader';
import BottomNav from './components/BottomNav';
import AppFooter from './components/AppFooter';
import ToastContainer from './components/ToastContainer';
import RecognizeTab from './components/RecognizeTab';
import HistoryTab from './components/HistoryTab';
import SettingsTab from './components/SettingsTab';
import HistoryDetailModal from './components/HistoryDetailModal';
import { BACKEND_PREDICT_URL, MAX_HISTORY_ITEMS, REQUEST_TIMEOUT_MS, buildRecognitionResult } from './lib/recognition';
import type { FilterKey, FoodLog, RecognitionResult, TabKey, Toast, ToastType } from './types';

export default function App() {
  const [tab, setTab] = useState<TabKey>('recognize');

  // App States
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [historyList, setHistoryList] = useState<FoodLog[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('today');
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
  const showToast = (message: string, type: ToastType = 'info') => {
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
      filterGroup: 'today',
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

  const clearHistory = () => {
    if (!confirm('Bạn có muốn xóa toàn bộ lịch sử quét cục bộ không?')) return;
    setHistoryList([]);
    localStorage.setItem('vietfood_history', JSON.stringify([]));
    showToast('Đã xóa toàn bộ lịch sử quét cục bộ', 'info');
  };

  // Filter logs logic
  const filteredHistory = historyList.filter((log) => {
    if (activeFilter === 'today') return log.filterGroup === 'today' || log.date.includes('Hôm nay');
    if (activeFilter === 'week') return log.filterGroup === 'today' || log.filterGroup === 'week' || log.date.includes('Hôm nay') || log.date.includes('Hôm qua');
    return true; // Monthly gets all
  });

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#151c27] flex flex-col font-sans pb-24 md:pb-0">
      <ToastContainer toasts={toasts} />
      <AppHeader tab={tab} onTabChange={setTab} />

      {/* Main Container */}
      <main className="flex-grow pt-24 pb-12 px-5 md:px-12 max-w-[1200px] w-full mx-auto">
        {tab === 'recognize' && (
          <RecognizeTab
            image={image}
            mimeType={mimeType}
            isAnalyzing={isAnalyzing}
            result={result}
            isSaved={isSaved}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onRecognize={handleRecognize}
            onReset={resetUpload}
            onSave={saveToJournal}
          />
        )}

        {tab === 'history' && (
          <HistoryTab
            filteredHistory={filteredHistory}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onSelectItem={setSelectedHistoryItem}
          />
        )}

        {tab === 'settings' && <SettingsTab historyCount={historyList.length} onClearHistory={clearHistory} />}
      </main>

      {selectedHistoryItem && (
        <HistoryDetailModal item={selectedHistoryItem} onClose={() => setSelectedHistoryItem(null)} />
      )}

      <BottomNav tab={tab} onTabChange={setTab} />
      <AppFooter onFeatureInDevelopment={(message) => showToast(message, 'info')} />
    </div>
  );
}
