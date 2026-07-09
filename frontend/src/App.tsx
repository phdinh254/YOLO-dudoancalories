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

interface User {
  name: string;
  email: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Pre-seeded logs from mockup
const PRE_SEEDED_LOGS: FoodLog[] = [
  {
    id: 'seeded-1',
    dishName: 'Phở Bò',
    calories: 450,
    protein: 25,
    carbs: 55,
    fat: 15,
    confidence: 98,
    description: 'Phở Bò là món ăn truyền thống nổi tiếng nhất của Việt Nam, nổi bật với nước dùng thanh ngọt thơm nồng thảo mộc tinh tế cùng bánh phở dai mềm.',
    date: '08:30 - Hôm nay',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTBicDAju5HjXb1outhOXiaU5kgNhhh5YIPRhYX11kE362TQUBTVaabx30Y6xcWAA_nyVvmBNtwEZbyO0vvm_wpt7QmUHAgUnXV_CxCPkVDrszxIn4MmWfVhbZA_gQGH8Te0exKD9QngJdFgGgI_TIHQ9k4b9IMHd4t25MkdwRJiwMfH3wDCRFjkaD2p_RuR8CzUedFCzhaNFbvWu5hg6UIhpKz7M2pN34E6gYPcPNdrbg9zAmCQZ5',
    isVietnamese: true,
    filterGroup: 'today'
  },
  {
    id: 'seeded-2',
    dishName: 'Bánh Mì',
    calories: 380,
    protein: 14,
    carbs: 48,
    fat: 16,
    confidence: 95,
    description: 'Bánh mì kẹp Việt Nam giòn tan bên ngoài, xốp mềm bên trong với hương vị đậm đà từ pate ngon, bơ thơm béo, các loại chả lụa và dưa góp thanh mát.',
    date: '12:15 - Hôm nay',
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAY1ZSpCn1WhwPV2Sd4UK2ASLpEPdtEDQER1GZ5XNHcPqXlD9AOOwAmXjN3apK2CnmGDHVn-qFfdPo274w0b4syA0F1ZKxodVgEpqN6QEVf2qd2Yr38iSOrbDPR4crTtDHnJ8tl7jBjO-R-SfxJkrwp8dNSuX7ozkpBWnvz84UyG2NVLK06Rtk8Ckvxri8UsKOFmimKYDNRudjFjluOb0gfuyU7SvF523zkdWvCrjgfoKw5AKEFvR3N',
    isVietnamese: true,
    filterGroup: 'today'
  },
  {
    id: 'seeded-3',
    dishName: 'Gỏi Cuốn',
    calories: 120,
    protein: 8,
    carbs: 22,
    fat: 2,
    confidence: 97,
    description: 'Món gỏi cuốn thanh mát với tôm tươi luộc đỏ hồng, thịt heo mềm ngọt cuộn chung bún tươi và dồi dào rau sống, chấm cùng nước tương đậu phộng béo ngậy.',
    date: '19:45 - Hôm qua',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNtsIz8PKxI5LVeQo6kxz_XJYhDYFm3CjAL8deXvkvchI51E4E4QAxBWV_m-NAfhi7hwb1QPwyygQZDPBBeZLxrT1UOX5YEobqKeqHyde-qr612PLAfvyR-CC5ccEfjiqQQ-eiL9ucbF2_PBrkqwbS4uT0nbOpsX1o6KvPXZ39PmdC08OscUgvVimV_qoyDRP5Gz1qv6sHZLQxdIESDbuqhXB8QijmydmGdDi9X41Ebm4CZqhs4JoT',
    isVietnamese: true,
    filterGroup: 'week'
  },
  {
    id: 'seeded-4',
    dishName: 'Bún Chả',
    calories: 520,
    protein: 22,
    carbs: 65,
    fat: 18,
    confidence: 96,
    description: 'Đặc sản Hà Nội gồm thịt ba chỉ và chả băm nướng vàng ruộm trên than hoa thơm nức, ăn kèm bún tươi, rổ rau sống tươi roi rói và nước chấm chua ngọt tỏi ớt.',
    date: '12:30 - 2 ngày trước',
    timestamp: Date.now() - 48 * 60 * 60 * 1000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNp778S8kDoca5bxhzgbwuKVb5WlrqxVPru5fvdHkVBQZLH7kLXiZ2-BFN6cY8P4zt2gcrP--eBfO9Q3Bu6saC57Dul2S2aLpi18O0nekGWypseenCFK30Hy_T4S2tjFkd64cLPbwSBrX8hAuVY51H1sl9qxudVBlicw0j-mRfoDA5hJboTpYWEZNu_0M63mdUWrdLhL5tTeNV6TUBGxoBNQBrR_ZVaKp7axBP5JbkivCH9oejnFjn',
    isVietnamese: true,
    filterGroup: 'week'
  }
];

export default function App() {
  const [tab, setTab] = useState<'recognize' | 'history' | 'settings'>('recognize');
  const [authScreen, setAuthScreen] = useState<'login' | 'register' | null>(null);

  // Auth inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupAgree, setSignupAgree] = useState(false);

  // App States
  const [user, setUser] = useState<User | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Partial<FoodLog> | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [historyList, setHistoryList] = useState<FoodLog[]>([]);
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month'>('today');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<FoodLog | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load User & History from LocalStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('vietfood_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Prompt login by default to match mockup 4/5
      setAuthScreen('login');
    }

    const storedHistory = localStorage.getItem('vietfood_history');
    if (storedHistory) {
      setHistoryList(JSON.parse(storedHistory));
    } else {
      setHistoryList(PRE_SEEDED_LOGS);
      localStorage.setItem('vietfood_history', JSON.stringify(PRE_SEEDED_LOGS));
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

  // Auth Operations
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showToast('Vui lòng điền đầy đủ thông tin đăng nhập', 'error');
      return;
    }
    // Simple verification - accept anything but defaults nicely
    const mockUser: User = {
      name: loginEmail.split('@')[0] === 'example' ? 'Nguyễn Văn A' : loginEmail.split('@')[0],
      email: loginEmail,
    };
    setUser(mockUser);
    localStorage.setItem('vietfood_user', JSON.stringify(mockUser));
    setAuthScreen(null);
    showToast('Đăng nhập thành công! Chào mừng ' + mockUser.name, 'success');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword || !signupConfirm) {
      showToast('Vui lòng điền đầy đủ các trường thông tin', 'error');
      return;
    }
    if (signupPassword !== signupConfirm) {
      showToast('Xác nhận mật khẩu không trùng khớp', 'error');
      return;
    }
    if (!signupAgree) {
      showToast('Vui lòng đồng ý với Điều khoản dịch vụ', 'error');
      return;
    }

    const newUser: User = {
      name: signupName,
      email: signupEmail,
    };
    setUser(newUser);
    localStorage.setItem('vietfood_user', JSON.stringify(newUser));
    setAuthScreen(null);
    showToast('Tạo tài khoản thành công! Chào mừng ' + signupName, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vietfood_user');
    setAuthScreen('login');
    showToast('Đã đăng xuất tài khoản', 'info');
  };

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast('File ảnh quá lớn, giới hạn tối đa 10MB', 'error');
      return;
    }
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
    if (!image || !mimeType) {
      showToast('Vui lòng tải ảnh món ăn trước', 'error');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch('/api/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image, mimeType }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        showToast('Nhận diện hoàn tất!', 'success');
      } else {
        if (data.error === 'API_KEY_MISSING') {
          // Key is missing, run simulated analysis instead of failure so user can preview the layout
          showToast('Không có khóa API, kích hoạt chế độ mô phỏng Phở Bò', 'info');
          simulateAnalysis();
        } else {
          showToast(data.message || 'Có lỗi khi phân tích ảnh.', 'error');
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast('Không thể kết nối với máy chủ, kích hoạt chế độ mô phỏng', 'info');
      simulateAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const simulateAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setResult({
        dishName: 'Phở Bò',
        calories: 450,
        protein: 25,
        carbs: 55,
        fat: 15,
        confidence: 98,
        description: 'Mô phỏng Phở Bò ngon ngọt với lát thịt chín mềm, sợi bánh phở trắng mịn chan nước dùng đậm hương hành gừng.',
        isVietnamese: true,
      });
      setIsAnalyzing(false);
      showToast('Nhận diện mô phỏng hoàn tất!', 'success');
    }, 2500);
  };

  const resetUpload = () => {
    setImage(null);
    setMimeType(null);
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
      image: image ? `data:${mimeType};base64,${image}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      isVietnamese: result.isVietnamese ?? true,
      filterGroup: 'today'
    };

    const updatedHistory = [newLog, ...historyList];
    setHistoryList(updatedHistory);
    localStorage.setItem('vietfood_history', JSON.stringify(updatedHistory));
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
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setTab('recognize')}>
          <span className="material-symbols-outlined text-[#006c49] text-3xl font-bold">restaurant</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#006c49]">VietFood AI</h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => { setTab('recognize'); setAuthScreen(null); }}
            className={`font-medium text-sm flex items-center gap-1.5 py-1 transition-all ${
              tab === 'recognize' ? 'text-[#006c49] border-b-2 border-[#006c49]' : 'text-[#3c4a42] hover:text-[#006c49]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">photo_camera</span> Nhận diện
          </button>
          <button
            onClick={() => { setTab('history'); setAuthScreen(null); }}
            className={`font-medium text-sm flex items-center gap-1.5 py-1 transition-all ${
              tab === 'history' ? 'text-[#006c49] border-b-2 border-[#006c49]' : 'text-[#3c4a42] hover:text-[#006c49]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">history</span> Lịch sử
          </button>
          {user ? (
            <button
              onClick={() => { setTab('settings'); setAuthScreen(null); }}
              className={`font-medium text-sm flex items-center gap-1.5 py-1 transition-all ${
                tab === 'settings' ? 'text-[#006c49] border-b-2 border-[#006c49]' : 'text-[#3c4a42] hover:text-[#006c49]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">settings</span> Cài đặt
            </button>
          ) : (
            <button
              onClick={() => setAuthScreen('login')}
              className="font-bold text-sm bg-[#006c49] text-white px-5 py-2 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-sm"
            >
              Đăng nhập
            </button>
          )}
        </nav>

        {/* Mobile/Quick Actions */}
        <div className="md:hidden flex items-center gap-2">
          {user ? (
            <button onClick={() => setTab('settings')} className="p-2 text-[#3c4a42] hover:text-[#006c49]">
              <span className="material-symbols-outlined">settings</span>
            </button>
          ) : (
            <button onClick={() => setAuthScreen('login')} className="p-2 text-[#3c4a42]">
              <span className="material-symbols-outlined">login</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow pt-24 pb-12 px-5 md:px-12 max-w-[1200px] w-full mx-auto">
        
        {/* Mockup Authentications */}
        {authScreen === 'login' && (
          <div className="flex flex-col items-center justify-center py-8 max-w-sm mx-auto fade-in">
            {/* Logo */}
            <div className="w-16 h-16 bg-[#006c49] text-white rounded-2xl flex items-center justify-center mb-4 shadow-md">
              <span className="material-symbols-outlined text-4xl">restaurant</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#006c49] mb-8 text-center">VietFood AI</h1>

            {/* Login Card */}
            <div className="bg-white rounded-[24px] p-6 shadow-xl border border-[#bbcabf]/30 w-full">
              <h2 className="text-2xl font-bold text-center text-[#151c27] mb-1">Chào mừng trở lại</h2>
              <p className="text-sm text-center text-[#3c4a42] mb-6">Đăng nhập để tiếp tục hành trình dinh dưỡng của bạn</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3c4a42] mb-1.5">Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#3c4a42]">mail</span>
                    <input
                      type="email"
                      required
                      placeholder="example@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#f0f3ff] border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006c49] focus:bg-white transition-all text-[#151c27]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3c4a42] mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#3c4a42]">lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-[#f0f3ff] border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006c49] focus:bg-white transition-all text-[#151c27]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-lg text-[#3c4a42] hover:text-[#006c49]"
                    >
                      {showPassword ? "visibility_off" : "visibility"}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <a href="#" onClick={(e) => {e.preventDefault(); showToast('Tính năng khôi phục mật khẩu đang phát triển', 'info');}} className="text-xs font-semibold text-[#006c49] hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#10b981] hover:brightness-110 active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md mt-2"
                >
                  Đăng nhập
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-[#bbcabf]/20 text-center">
                <button onClick={() => { setAuthScreen('register'); setShowPassword(false); }} className="text-xs text-[#3c4a42]">
                  Chưa có tài khoản? <span className="font-bold text-[#006c49] hover:underline">Đăng ký ngay</span>
                </button>
              </div>
            </div>

            {/* Skip Option */}
            <button
              onClick={() => {
                setUser({ name: 'Khách', email: 'guest@vietfood.ai' });
                setAuthScreen(null);
                showToast('Đang duyệt với tư cách Khách', 'info');
              }}
              className="mt-6 text-sm font-semibold text-[#3c4a42] hover:text-[#006c49] transition-colors"
            >
              Bỏ qua đăng nhập
            </button>
          </div>
        )}

        {authScreen === 'register' && (
          <div className="flex flex-col items-center justify-center py-8 max-w-sm mx-auto fade-in">
            {/* Signup Card */}
            <div className="bg-white rounded-[24px] p-6 shadow-xl border border-[#bbcabf]/30 w-full">
              <div className="flex items-center justify-center gap-1 text-[#006c49] mb-4">
                <span className="material-symbols-outlined text-2xl font-bold">restaurant</span>
                <span className="text-lg font-bold">VietFood AI</span>
              </div>
              <h2 className="text-2xl font-bold text-center text-[#151c27] mb-1">Tạo tài khoản mới</h2>
              <p className="text-sm text-center text-[#3c4a42] mb-6">Bắt đầu theo dõi sức khỏe thông minh ngay hôm nay</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3c4a42] mb-1.5">Họ tên</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#3c4a42]">person</span>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#f0f3ff] border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006c49] focus:bg-white transition-all text-[#151c27]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3c4a42] mb-1.5">Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#3c4a42]">mail</span>
                    <input
                      type="email"
                      required
                      placeholder="example@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#f0f3ff] border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006c49] focus:bg-white transition-all text-[#151c27]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3c4a42] mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#3c4a42]">lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-[#f0f3ff] border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006c49] focus:bg-white transition-all text-[#151c27]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-lg text-[#3c4a42] hover:text-[#006c49]"
                    >
                      {showPassword ? "visibility_off" : "visibility"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3c4a42] mb-1.5">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#3c4a42]">history</span>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#f0f3ff] border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006c49] focus:bg-white transition-all text-[#151c27]"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={signupAgree}
                    onChange={(e) => setSignupAgree(e.target.checked)}
                    className="mt-1 rounded text-[#006c49] focus:ring-[#006c49] h-4 w-4"
                  />
                  <label htmlFor="agree" className="text-xs text-[#3c4a42] leading-tight select-none">
                    Tôi đồng ý với các <a href="#" onClick={(e) => {e.preventDefault(); showToast('Điều khoản dịch vụ', 'info');}} className="font-bold text-[#006c49] hover:underline">Điều khoản dịch vụ</a> và <a href="#" onClick={(e) => {e.preventDefault(); showToast('Chính sách bảo mật', 'info');}} className="font-bold text-[#006c49] hover:underline">Chính sách bảo mật</a>.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#10b981] hover:brightness-110 active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-4"
                >
                  Đăng ký ngay <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-[#bbcabf]/20 text-center">
                <button onClick={() => { setAuthScreen('login'); setShowPassword(false); }} className="text-xs text-[#3c4a42]">
                  Đã có tài khoản? <span className="font-bold text-[#006c49] hover:underline">Đăng nhập</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Authenticated Screen Content */}
        {!authScreen && (
          <>
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
                        onClick={() => fileInputRef.current?.click()}
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
                              <span className="block text-2xl font-extrabold text-[#855300]">{result.calories} KCAL</span>
                              <span className="text-xs text-[#3c4a42] font-semibold">/ khẩu phần</span>
                            </div>
                          </div>
                          {result.description && (
                            <p className="text-xs text-[#3c4a42] italic mt-3 pt-2.5 border-t border-[#fea619]/10 leading-relaxed">
                              {result.description}
                            </p>
                          )}
                        </div>

                        {/* Nutrient bars */}
                        <div className="space-y-4 flex-1">
                          {/* Protein */}
                          <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="text-[#3c4a42]">Protein</span>
                              <span className="text-[#151c27] font-bold">{result.protein}g</span>
                            </div>
                            <div className="h-2 w-full bg-[#f0f3ff] rounded-full overflow-hidden">
                              <div
                                style={{ width: `${Math.min((result.protein || 0) * 2.5, 100)}%` }}
                                className="h-full bg-[#fea619] rounded-full transition-all duration-1000"
                              ></div>
                            </div>
                          </div>

                          {/* Carbs */}
                          <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="text-[#3c4a42]">Carbohydrates (Tinh bột)</span>
                              <span className="text-[#151c27] font-bold">{result.carbs}g</span>
                            </div>
                            <div className="h-2 w-full bg-[#f0f3ff] rounded-full overflow-hidden">
                              <div
                                style={{ width: `${Math.min((result.carbs || 0) * 1.2, 100)}%` }}
                                className="h-full bg-[#71a1ff] rounded-full transition-all duration-1000"
                              ></div>
                            </div>
                          </div>

                          {/* Fat */}
                          <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="text-[#3c4a42]">Chất béo (Fat)</span>
                              <span className="text-[#151c27] font-bold">{result.fat}g</span>
                            </div>
                            <div className="h-2 w-full bg-[#f0f3ff] rounded-full overflow-hidden">
                              <div
                                style={{ width: `${Math.min((result.fat || 0) * 4, 100)}%` }}
                                className="h-full bg-[#6c7a71] rounded-full transition-all duration-1000"
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Save block */}
                        <div className="mt-6 pt-5 border-t border-[#bbcabf]/30">
                          <p className="text-[10px] text-[#3c4a42]/75 italic mb-3 font-medium">
                            * Số liệu calo chỉ mang tính chất ước tính tương đối cho một khẩu phần tham khảo.
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
                      <p className="text-xs text-[#3c4a42] leading-relaxed">Phân tích hình ảnh bằng AI siêu tốc dưới 2 giây.</p>
                    </div>
                  </div>

                  <div className="bg-[#f0f3ff] p-5 rounded-2xl flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 border border-[#bbcabf]/20">
                    <div className="w-10 h-10 bg-[#855300]/10 text-[#855300] rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined font-bold">database</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm mb-1">Dữ liệu dinh dưỡng</h5>
                      <p className="text-xs text-[#3c4a42] leading-relaxed">Thư viện hàng ngàn món ăn truyền thống Việt Nam.</p>
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
                  <p className="text-sm text-[#3c4a42] font-semibold">Theo dõi hành trình dinh dưỡng qua các món ăn của bạn.</p>
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

            {/* View Tab 3: SETTINGS (Cài đặt) */}
            {tab === 'settings' && user && (
              <div className="fade-in max-w-lg mx-auto bg-white rounded-3xl p-6 border border-[#bbcabf]/20 shadow-md">
                <h2 className="text-2xl font-extrabold text-[#151c27] mb-6">Thông tin tài khoản</h2>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-[#006c49]/10 text-[#006c49] flex items-center justify-center border border-[#006c49]/20">
                    <span className="material-symbols-outlined text-4xl font-bold">account_circle</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#151c27]">{user.name}</h3>
                    <p className="text-sm text-[#3c4a42] font-semibold">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-[#f0f3ff] rounded-2xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-[#151c27]">Độ chính xác mô hình</h4>
                      <p className="text-xs text-[#3c4a42] mt-0.5">Sử dụng mô hình nhận diện Gemini 3.5 Flash</p>
                    </div>
                    <span className="font-extrabold text-xs text-[#006c49] bg-[#006c49]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Cao nhất
                    </span>
                  </div>

                  <div className="p-4 bg-[#f0f3ff] rounded-2xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-[#151c27]">Số món đã nhận diện</h4>
                      <p className="text-xs text-[#3c4a42] mt-0.5">Thống kê nhật ký dinh dưỡng cá nhân</p>
                    </div>
                    <span className="font-extrabold text-sm text-[#006c49]">
                      {historyList.length} món
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#bbcabf]/30 flex flex-col gap-3">
                  <button
                    onClick={() => {
                      if (confirm('Bạn có muốn xóa toàn bộ lịch sử quét không?')) {
                        setHistoryList(PRE_SEEDED_LOGS);
                        localStorage.setItem('vietfood_history', JSON.stringify(PRE_SEEDED_LOGS));
                        showToast('Đã khôi phục lịch sử mặc định', 'info');
                      }
                    }}
                    className="w-full bg-[#fef2f2] hover:bg-[#fde2e2] text-[#ba1a1a] font-bold text-sm py-3 rounded-2xl transition-all active:scale-[0.98]"
                  >
                    Xóa toàn bộ lịch sử quét
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full bg-[#f0f3ff] hover:bg-[#e2e8f8] text-[#3c4a42] font-bold text-sm py-3 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Đăng xuất tài khoản
                  </button>
                </div>
              </div>
            )}
          </>
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

              {/* Progress bars */}
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Protein</span>
                    <span className="font-bold">{selectedHistoryItem.protein}g</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#f0f3ff] rounded-full overflow-hidden">
                    <div style={{ width: `${Math.min(selectedHistoryItem.protein * 2.5, 100)}%` }} className="h-full bg-[#fea619] rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Carbohydrates</span>
                    <span className="font-bold">{selectedHistoryItem.carbs}g</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#f0f3ff] rounded-full overflow-hidden">
                    <div style={{ width: `${Math.min(selectedHistoryItem.carbs * 1.2, 100)}%` }} className="h-full bg-[#71a1ff] rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Chất béo (Fat)</span>
                    <span className="font-bold">{selectedHistoryItem.fat}g</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#f0f3ff] rounded-full overflow-hidden">
                    <div style={{ width: `${Math.min(selectedHistoryItem.fat * 4, 100)}%` }} className="h-full bg-[#6c7a71] rounded-full"></div>
                  </div>
                </div>
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
          onClick={() => { setTab('recognize'); setAuthScreen(null); }}
          className={`flex flex-col items-center justify-center transition-all ${
            tab === 'recognize' && !authScreen ? 'bg-[#006c49]/10 text-[#006c49] px-5 py-1.5 rounded-2xl font-bold' : 'text-[#3c4a42]'
          }`}
        >
          <span className={`material-symbols-outlined ${tab === 'recognize' && !authScreen ? 'fill-icon' : ''}`}>photo_camera</span>
          <span className="text-[10px] font-bold mt-0.5">Nhận diện</span>
        </button>

        <button
          onClick={() => { setTab('history'); setAuthScreen(null); }}
          className={`flex flex-col items-center justify-center transition-all ${
            tab === 'history' && !authScreen ? 'bg-[#006c49]/10 text-[#006c49] px-5 py-1.5 rounded-2xl font-bold' : 'text-[#3c4a42]'
          }`}
        >
          <span className={`material-symbols-outlined ${tab === 'history' && !authScreen ? 'fill-icon' : ''}`}>history</span>
          <span className="text-[10px] font-bold mt-0.5">Lịch sử</span>
        </button>

        <button
          onClick={() => {
            if (user) {
              setTab('settings');
              setAuthScreen(null);
            } else {
              setAuthScreen('login');
            }
          }}
          className={`flex flex-col items-center justify-center transition-all ${
            (tab === 'settings' || authScreen) ? 'bg-[#006c49]/10 text-[#006c49] px-5 py-1.5 rounded-2xl font-bold' : 'text-[#3c4a42]'
          }`}
        >
          <span className={`material-symbols-outlined ${(tab === 'settings' || authScreen) ? 'fill-icon' : ''}`}>settings</span>
          <span className="text-[10px] font-bold mt-0.5">Cài đặt</span>
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
