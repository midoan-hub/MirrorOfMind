import React, { useState, useRef } from 'react';
import {
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Feather,
  BookOpen,
  Palette,
  Compass,
  Smile,
  Quote,
  Droplet,
  Wand2
} from 'lucide-react';

// Font Presets với nét chữ mềm mại, bo tròn, tự nhiên
interface FontOption {
  id: string;
  name: string;
  subtitle: string;
  titleClass: string;
  bodyClass: string;
}

const FONT_OPTIONS: FontOption[] = [
  {
    id: 'mali-soft',
    name: 'Mali & Nunito',
    subtitle: 'Mềm mại & Đáng yêu (Khuyên dùng)',
    titleClass: 'font-soft-title',
    bodyClass: 'font-soft-body',
  },
  {
    id: 'itim-gentle',
    name: 'Itim & Quicksand',
    subtitle: 'Uyển chuyển & Dịu êm',
    titleClass: 'font-soft-cursive',
    bodyClass: 'font-quicksand',
  },
  {
    id: 'playpen-diary',
    name: 'Playpen & Nunito',
    subtitle: 'Nét bút sổ tay tự nhiên',
    titleClass: 'font-soft-playpen',
    bodyClass: 'font-soft-body',
  },
  {
    id: 'caveat-doodle',
    name: 'Caveat & Patrick Hand',
    subtitle: 'Nét phác họa phóng khoáng',
    titleClass: 'font-caveat',
    bodyClass: 'font-patrick',
  },
];

// Từ điển màu sắc nhận diện highlight
const COLOR_PALETTE_MAP: { keywords: string[]; hex: string; bgSoft: string; name: string }[] = [
  { keywords: ['hồng', 'pink', 'rose', 'đào', 'pastel'], hex: '#f472b6', bgSoft: '#fdf2f8', name: 'Hồng Ngọt Ngào' },
  { keywords: ['đỏ', 'red', 'crimson', 'scarlet', 'rượu', 'mận'], hex: '#f87171', bgSoft: '#fef2f2', name: 'Đỏ Nồng Nhiệt' },
  { keywords: ['cam', 'orange', 'caramel', 'hổ phách'], hex: '#fb923c', bgSoft: '#fff7ed', name: 'Cam Năng Động' },
  { keywords: ['vàng', 'yellow', 'nắng', 'kem', 'gold'], hex: '#facc15', bgSoft: '#fefce8', name: 'Vàng Rực Rỡ' },
  { keywords: ['xanh lá', 'lục', 'green', 'rêu', 'cỏ', 'ngọc bích', 'mint'], hex: '#4ade80', bgSoft: '#f0fdf4', name: 'Xanh Lá Tươi Mát' },
  { keywords: ['xanh dương', 'lam', 'blue', 'biển', 'trời', 'da trời', 'xanh'], hex: '#38bdf8', bgSoft: '#f0f9ff', name: 'Xanh Dương Thanh Bình' },
  { keywords: ['tím', 'purple', 'violet', 'lavender', 'oải hương'], hex: '#c084fc', bgSoft: '#faf5ff', name: 'Tím Mộng Mơ' },
  { keywords: ['nâu', 'brown', 'đất', 'gỗ', 'coffee', 'cà phê', 'be', 'beige'], hex: '#d6b896', bgSoft: '#faf6f0', name: 'Nâu Mộc Mạc' },
  { keywords: ['đen', 'black', 'huyền', 'than', 'tối'], hex: '#94a3b8', bgSoft: '#f8fafc', name: 'Đen Bí Ẩn' },
  { keywords: ['trắng', 'white', 'bạc', 'silver', 'tuyết'], hex: '#cbd5e1', bgSoft: '#f8fafc', name: 'Trắng Tinh Khôi' },
];

function detectHighlightColor(colorName: string): { hex: string; bgSoft: string } {
  const norm = colorName.trim().toLowerCase();
  for (const item of COLOR_PALETTE_MAP) {
    if (item.keywords.some((k) => norm.includes(k))) {
      return { hex: item.hex, bgSoft: item.bgSoft };
    }
  }
  return { hex: '#fef08a', bgSoft: '#fefce8' }; // Default soft highlighter yellow
}

export default function App() {
  // Trạng thái màn hình: 0: Intro, 1: Câu 1, 2: Câu 2, 3: Câu 3, 'loading': Đang phân tích, 'result': Kết quả
  const [stage, setStage] = useState<number | 'loading' | 'result'>(0);

  // Lựa chọn Font mềm mại (mặc định là Mali & Nunito)
  const selectedFont = FONT_OPTIONS[0];

  // Âm thanh giả lập giấy/viết
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Dữ liệu câu trả lời
  const [answers, setAnswers] = useState({
    color: { text: '', adjs: ['', '', ''] },
    animal: { text: '', adjs: ['', '', ''] },
    water: { text: '', adjs: ['', '', ''] },
  });

  // Thông báo lỗi
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorTimerRef = useRef<any>(null);

  // Trạng thái sao chép
  const [copied, setCopied] = useState(false);

  // Câu trích dẫn ngẫu nhiên trong màn Loading
  const [loadingQuoteIndex, setLoadingQuoteIndex] = useState(0);
  const loadingQuotes = [
    'Mực bút đang khô dần trên trang giấy nháp...',
    'Tiềm thức luôn phản chiếu chân thật nhất qua trực giác đầu tiên.',
    'Mỗi tính từ bạn vừa viết là một mảnh ghép của tâm hồn...',
    'Chuẩn bị mở bức tranh nội tâm của riêng bạn.',
  ];

  // Khởi tạo audio context khi cần
  const playSoundEffect = (type: 'flip' | 'write' | 'magic') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'flip') {
        // Tiếng sột soạt giấy lật
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'magic') {
        // Hợp âm nhẹ khi ra kết quả
        [392, 523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.65);
        });
      }
    } catch {
      // Bỏ qua lỗi audio nếu trình duyệt chặn
    }
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setErrorMessage(null);
    }, 3800);
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!answers.color.text.trim()) {
        showError('Bạn ơi, hãy viết tên màu sắc mà bạn yêu thích nhất nhé!');
        return false;
      }
      const filledAdjs = answers.color.adjs.filter((a) => a.trim().length > 0);
      if (filledAdjs.length === 0) {
        showError('Nhớ viết ít nhất 1 tính từ miêu tả vì sao bạn thích màu đó nha!');
        return false;
      }
    } else if (currentStep === 2) {
      if (!answers.animal.text.trim()) {
        showError('Đừng bỏ trống nhé! Hãy viết tên con vật bạn yêu thích nhất.');
        return false;
      }
      const filledAdjs = answers.animal.adjs.filter((a) => a.trim().length > 0);
      if (filledAdjs.length === 0) {
        showError('Viết ít nhất 1 tính từ miêu tả con vật đó vào sổ nhé!');
        return false;
      }
    } else if (currentStep === 3) {
      if (!answers.water.text.trim()) {
        showError('Nét mực cuối cùng rồi, điền dạng nước bạn thấy thích nhất nhé!');
        return false;
      }
      const filledAdjs = answers.water.adjs.filter((a) => a.trim().length > 0);
      if (filledAdjs.length === 0) {
        showError('Hãy thêm ít nhất 1 tính từ miêu tả cảm xúc dạng nước đó mang lại.');
        return false;
      }
    }
    setErrorMessage(null);
    return true;
  };

  const handleNext = (nextStep: number | 'loading') => {
    if (typeof stage === 'number' && stage > 0 && !validateStep(stage)) {
      return;
    }
    playSoundEffect('flip');

    if (nextStep === 'loading') {
      setStage('loading');
      setLoadingQuoteIndex(Math.floor(Math.random() * loadingQuotes.length));

      // Tính toán màu highlight
      const highlight = detectHighlightColor(answers.color.text);
      document.documentElement.style.setProperty('--splash-color', highlight.hex);

      // Chuyển sang màn kết quả sau 2.2 giây
      setTimeout(() => {
        setStage('result');
        playSoundEffect('magic');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 2200);
    } else {
      setStage(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = (targetStep: number) => {
    setErrorMessage(null);
    playSoundEffect('flip');
    setStage(targetStep);
  };

  const restart = () => {
    playSoundEffect('flip');
    setAnswers({
      color: { text: '', adjs: ['', '', ''] },
      animal: { text: '', adjs: ['', '', ''] },
      water: { text: '', adjs: ['', '', ''] },
    });
    setErrorMessage(null);
    setCopied(false);
    setStage(0);
  };

  const copyToClipboard = () => {
    const colorAdjs = answers.color.adjs.filter(Boolean).join(', ');
    const animalAdjs = answers.animal.adjs.filter(Boolean).join(', ');
    const waterAdjs = answers.water.adjs.filter(Boolean).join(', ');

    const textToCopy = `📖 [SỔ TAY TÂM TRÍ - KẾT QUẢ KHÁM PHÁ TIỀM THỨC]
-----------------------------------------
1. Bản Ngã Thật Sự (Màu: ${answers.color.text.toUpperCase()})
👉 Bạn nhìn nhận con người thật của mình là: ${colorAdjs}

2. Người Bạn Đời Lý Tưởng (Con vật: ${answers.animal.text.toUpperCase()})
👉 Mẫu người đồng hành bạn khao khát: ${animalAdjs}

3. Tình Yêu & Thân Mật (Dạng nước: ${answers.water.text.toUpperCase()})
👉 Cách bạn mong muốn được yêu thương: ${waterAdjs}
-----------------------------------------
✨ Trò chơi tâm lý 3 câu hỏi - Sổ Tay Tâm Trí`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fillSampleData = () => {
    playSoundEffect('flip');
    setAnswers({
      color: { text: 'Xanh rêu', adjs: ['ấm áp', 'bí ẩn', 'bình yên'] },
      animal: { text: 'Mèo lười', adjs: ['kiêu kỳ', 'dịu dàng', 'độc lập'] },
      water: { text: 'Mưa rào mùa hạ', adjs: ['mát lành', 'sâu lắng', 'tinh khiết'] },
    });
    setStage('loading');
    setLoadingQuoteIndex(Math.floor(Math.random() * loadingQuotes.length));
    const highlight = detectHighlightColor('Xanh rêu');
    document.documentElement.style.setProperty('--splash-color', highlight.hex);
    setTimeout(() => {
      setStage('result');
      playSoundEffect('magic');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1800);
  };

  // Lấy danh sách tính từ đã điền
  const cleanColorAdjs = answers.color.adjs.filter(Boolean).join(', ') || 'ấm áp, tự do';
  const cleanAnimalAdjs = answers.animal.adjs.filter(Boolean).join(', ') || 'trung thành, độc lập';
  const cleanWaterAdjs = answers.water.adjs.filter(Boolean).join(', ') || 'dịu êm, sâu thẳm';
  const highlightInfo = detectHighlightColor(answers.color.text);

  return (
    <div
      className={`min-h-screen flex flex-col justify-between p-3 sm:p-6 transition-all duration-300 text-[17px] ${selectedFont.bodyClass}`}
    >
      {/* ========================================== */}
      {/* THANH ĐIỀU KHIỂN TRÊN CÙNG: FONT MỀM MẠI, ÂM THANH, CỠ CHỮ */}
      {/* ========================================== */}
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between py-2 px-1 text-sm border-b border-[#e2d8cd] mb-3">
        {/* Logo / Tên sổ tay */}
        <button
          onClick={() => setStage(0)}
          className="flex items-center gap-2 cursor-pointer group text-left"
        >
          <span className="w-8 h-8 rounded-full bg-[#f1ebe3] border border-[#362f2b] flex items-center justify-center text-sm shadow-xs group-hover:scale-105 transition-transform">
            📔
          </span>
          <div>
            <span className={`${selectedFont.titleClass} font-bold text-lg sm:text-xl text-[#362f2b] tracking-wide block leading-tight`}>
              Sổ Tay Tâm Trí
            </span>
            <span className="text-[11px] text-[#8c7b6d] hidden sm:block">The 3 Questions Game</span>
          </div>
        </button>

        {/* Nút âm thanh sột soạt lật trang */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1.5 rounded-full border border-[#cfc3b6] bg-white hover:bg-[#f9f5f0] text-[#5c4d41] shadow-xs transition cursor-pointer flex items-center gap-1.5 px-3 text-xs"
          title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-800" /> : <VolumeX className="w-3.5 h-3.5 text-gray-400" />}
          <span className="text-[11px] text-[#7d6b5e] hidden sm:inline">{soundEnabled ? 'Âm thanh' : 'Tắt âm'}</span>
        </button>
      </header>

      {/* THANH ĐIỀU HƯỚNG TRANG SỔ TAY */}
      <nav aria-label="Mục lục sổ tay" className="w-full max-w-2xl mx-auto flex items-center justify-center gap-1.5 sm:gap-2 mb-3 overflow-x-auto py-1">
        {[
          { id: 0, label: 'Trang Bìa' },
          { id: 1, label: '1. Màu Sắc' },
          { id: 2, label: '2. Con Vật' },
          { id: 3, label: '3. Dạng Nước' },
          { id: 'result', label: 'Bức Tranh Tâm Trí' },
        ].map((item) => (
          <button
            key={String(item.id)}
            onClick={() => {
              if (item.id === 'result') {
                if (!answers.color.text) {
                  // Tự điền nhanh nếu chưa có
                  setAnswers({
                    color: { text: 'Xanh rêu', adjs: ['ấm áp', 'bí ẩn', 'bình yên'] },
                    animal: { text: 'Mèo lười', adjs: ['kiêu kỳ', 'dịu dàng', 'độc lập'] },
                    water: { text: 'Mưa rào', adjs: ['mát lành', 'sâu lắng', 'tinh khiết'] },
                  });
                }
                handleNext('loading');
              } else {
                setStage(item.id as number);
              }
            }}
            className={`px-3 py-1 text-xs rounded-full transition-all border whitespace-nowrap cursor-pointer ${
              stage === item.id
                ? 'bg-[#2e2825] text-white border-[#2e2825] font-bold shadow-xs'
                : 'bg-white/80 text-[#68574a] border-[#d8ccbe] hover:bg-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* ========================================== */}
      {/* VÙNG CHÍNH: KHUNG SỔ TAY */}
      {/* ========================================== */}
      <main className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center relative my-2">
        {/* Banner thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="bg-[#fff1f2] border-2 border-dashed border-[#e11d48] text-[#be123c] rounded-2xl p-3 mb-4 text-center font-bold text-sm sm:text-base shadow-sm mx-auto max-w-md w-full flex items-center justify-center gap-2">
            <span>✏️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 0: BÌA SỔ TAY & GIỚI THIỆU */}
        {/* ============================================================== */}
        {stage === 0 && (
          <div className="w-full text-center py-6 sm:py-10 space-y-7">
            {/* Hình vẽ ngọn bút doodle mềm mại */}
            <div className="relative inline-block animate-soft-float">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-[#f5ede2] border-2 border-[#362f2b] shadow-[3px_4px_0px_#362f2b] flex items-center justify-center rotate-[-3deg]">
                <BookOpen className="w-12 h-12 text-[#4a3a30]" strokeWidth={1.8} />
              </div>
              <span className="absolute -top-2 -right-3 text-xl animate-wiggle">✨</span>
            </div>

            {/* Tiêu đề mềm mại */}
            <div className="space-y-3">
              <h1 className={`${selectedFont.titleClass} text-5xl sm:text-6xl font-bold tracking-tight text-[#2b2420]`}>
                Sổ Tay Tâm Trí
              </h1>
              <div className="relative w-56 mx-auto">
                {/* Nét gạch chân uốn lượn mềm mại */}
                <svg className="w-full h-4 stroke-[#4a3e36] fill-none stroke-[2.2]" viewBox="0 0 100 12" preserveAspectRatio="none">
                  <path d="M4 6 Q 50 1 96 7" strokeLinecap="round" />
                  <path d="M8 9 Q 50 13 92 5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold tracking-widest uppercase text-[#8c6b4b] pt-1">
                The 3 Questions Psychology Game
              </p>
            </div>

            {/* Khung trích dẫn lời nhắn */}
            <div className="box-notebook p-6 sm:p-7 max-w-md mx-auto text-[#443831] leading-relaxed relative bg-[#ffffff]">
              <div className="washi-tape"></div>
              <Quote className="w-6 h-6 text-[#d4af86] mx-auto mb-2 opacity-70" />
              <p className="text-lg sm:text-xl font-medium">
                "Hãy viết theo <span className="font-bold underline decoration-wavy decoration-[#e67e22]">trực giác đầu tiên</span> nảy ra trong bạn."
              </p>
              <p className="text-xs text-[#8c7b6d] mt-3">
                Không có câu trả lời đúng hay sai, chỉ có sự phản chiếu chân thật nhất của tâm hồn.
              </p>
            </div>

            {/* Các nút mở trang hoặc xem mẫu nhanh */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => handleNext(1)}
                className="btn-hand-primary px-8 py-3.5 text-xl font-bold inline-flex items-center gap-3 cursor-pointer group w-full sm:w-auto justify-center"
              >
                <span className={selectedFont.titleClass}>Mở trang đầu tiên</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </button>

              <button
                onClick={fillSampleData}
                className="btn-hand-soft px-6 py-3 text-base font-bold inline-flex items-center gap-2 cursor-pointer text-[#5c4a3e] w-full sm:w-auto justify-center"
                title="Điền sẵn câu trả lời mẫu để xem ngay kết quả"
              >
                <Wand2 className="w-4 h-4 text-amber-600" />
                <span className={selectedFont.titleClass}>Xem thử mẫu kết quả</span>
              </button>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 1: CÂU HỎI 1 - MÀU SẮC YÊU THÍCH */}
        {/* ============================================================== */}
        {stage === 1 && (
          <div className="w-full space-y-6 py-2 animate-in fade-in duration-400">
            {/* Header trang */}
            <div className="flex items-center justify-between text-[#8c7b6d] text-base px-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Palette className="w-4 h-4 text-amber-700" />
                Câu hỏi 1 / 3
              </span>
              <span className={`${selectedFont.titleClass} font-bold text-lg text-[#5c4a3e]`}>Trang 01</span>
            </div>

            {/* Hộp nội dung */}
            <div className="box-notebook p-6 sm:p-8 space-y-7 bg-white relative">
              <div className="washi-tape" style={{ backgroundColor: 'rgba(254, 240, 138, 0.85)' }}></div>

              <div>
                <label className={`block text-2xl sm:text-3xl font-bold text-[#2b2420] mb-2 ${selectedFont.titleClass}`}>
                  1. Màu sắc bạn yêu thích nhất là gì?
                </label>
                <p className="text-sm text-[#8c7b6d] mb-4">
                  (Bất cứ sắc thái nào bạn cảm thấy có kết nối sâu sắc: Xanh rêu, Vàng nắng, Hồng đào, Tím khói...)
                </p>
                <input
                  type="text"
                  value={answers.color.text}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      color: { ...answers.color, text: e.target.value },
                    })
                  }
                  placeholder="Viết tên màu sắc ở đây..."
                  className={`input-soft-doodle w-full text-2xl sm:text-3xl font-bold text-[#2b2420] placeholder-[#c4b5a8] ${selectedFont.titleClass}`}
                  autoFocus
                />
              </div>

              {/* 3 tính từ */}
              <div className="pt-4 border-t border-dashed border-[#e6ddd4]">
                <label className="block text-lg sm:text-xl font-bold text-[#443831] mb-2 flex items-center gap-2">
                  <Feather className="w-4 h-4 text-[#8c6b4b]" />
                  Viết 3 tính từ miêu tả vì sao bạn thích màu đó:
                </label>
                <p className="text-xs text-[#8c7b6d] mb-4">
                  Cảm giác hay cảm xúc mà màu sắc này mang lại cho bạn là gì?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute left-2 top-2 text-xs text-[#9a897b] font-bold">#{idx + 1}</span>
                      <input
                        type="text"
                        value={answers.color.adjs[idx]}
                        onChange={(e) => {
                          const newAdjs = [...answers.color.adjs];
                          newAdjs[idx] = e.target.value;
                          setAnswers({
                            ...answers,
                            color: { ...answers.color, adjs: newAdjs },
                          });
                        }}
                        placeholder={idx === 0 ? 'VD: Ấm áp' : idx === 1 ? 'VD: Bí ẩn' : 'VD: Tự do'}
                        className={`input-soft-doodle w-full text-lg sm:text-xl font-semibold text-[#362f2b] pt-5 ${selectedFont.titleClass}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Điều hướng */}
            <div className="flex justify-between items-center pt-2 px-1">
              <button
                onClick={() => handleBack(0)}
                className="text-[#7d6b5e] hover:text-[#2b2420] text-sm sm:text-base font-semibold underline decoration-dashed transition"
              >
                Về bìa sổ
              </button>
              <button
                onClick={() => handleNext(2)}
                className="btn-hand-primary px-7 py-3 text-lg font-bold flex items-center gap-2"
              >
                <span className={selectedFont.titleClass}>Lật trang tiếp</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 2: CÂU HỎI 2 - CON VẬT YÊU THÍCH */}
        {/* ============================================================== */}
        {stage === 2 && (
          <div className="w-full space-y-6 py-2 animate-in fade-in duration-400">
            {/* Header trang */}
            <div className="flex items-center justify-between text-[#8c7b6d] text-base px-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Smile className="w-4 h-4 text-emerald-700" />
                Câu hỏi 2 / 3
              </span>
              <span className={`${selectedFont.titleClass} font-bold text-lg text-[#5c4a3e]`}>Trang 02</span>
            </div>

            {/* Hộp nội dung */}
            <div className="box-notebook p-6 sm:p-8 space-y-7 bg-white relative">
              <div className="washi-tape" style={{ backgroundColor: 'rgba(187, 247, 208, 0.85)' }}></div>

              <div>
                <label className={`block text-2xl sm:text-3xl font-bold text-[#2b2420] mb-2 ${selectedFont.titleClass}`}>
                  2. Con vật bạn yêu thích nhất là gì?
                </label>
                <p className="text-sm text-[#8c7b6d] mb-4">
                  (Ví dụ: Chó sói cô độc, chú mèo lười, cá heo biển cả, chim đại bàng, thỏ trắng...)
                </p>
                <input
                  type="text"
                  value={answers.animal.text}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      animal: { ...answers.animal, text: e.target.value },
                    })
                  }
                  placeholder="Tên con vật bạn nghĩ đến..."
                  className={`input-soft-doodle w-full text-2xl sm:text-3xl font-bold text-[#2b2420] placeholder-[#c4b5a8] ${selectedFont.titleClass}`}
                  autoFocus
                />
              </div>

              {/* 3 tính từ */}
              <div className="pt-4 border-t border-dashed border-[#e6ddd4]">
                <label className="block text-lg sm:text-xl font-bold text-[#443831] mb-2 flex items-center gap-2">
                  <Feather className="w-4 h-4 text-[#8c6b4b]" />
                  3 tính từ miêu tả tính cách / vẻ đẹp của nó:
                </label>
                <p className="text-xs text-[#8c7b6d] mb-4">
                  Điều gì ở con vật này khiến bạn say mê hoặc thấy thân thuộc?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute left-2 top-2 text-xs text-[#9a897b] font-bold">#{idx + 1}</span>
                      <input
                        type="text"
                        value={answers.animal.adjs[idx]}
                        onChange={(e) => {
                          const newAdjs = [...answers.animal.adjs];
                          newAdjs[idx] = e.target.value;
                          setAnswers({
                            ...answers,
                            animal: { ...answers.animal, adjs: newAdjs },
                          });
                        }}
                        placeholder={idx === 0 ? 'VD: Trung thành' : idx === 1 ? 'VD: Kiêu kỳ' : 'VD: Dịu dàng'}
                        className={`input-soft-doodle w-full text-lg sm:text-xl font-semibold text-[#362f2b] pt-5 ${selectedFont.titleClass}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Điều hướng */}
            <div className="flex justify-between items-center pt-2 px-1">
              <button
                onClick={() => handleBack(1)}
                className="text-[#7d6b5e] hover:text-[#2b2420] text-sm sm:text-base font-semibold underline decoration-dashed transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Trang trước
              </button>
              <button
                onClick={() => handleNext(3)}
                className="btn-hand-primary px-7 py-3 text-lg font-bold flex items-center gap-2"
              >
                <span className={selectedFont.titleClass}>Lật trang tiếp</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 3: CÂU HỎI 3 - DẠNG NƯỚC YÊU THÍCH */}
        {/* ============================================================== */}
        {stage === 3 && (
          <div className="w-full space-y-6 py-2 animate-in fade-in duration-400">
            {/* Header trang */}
            <div className="flex items-center justify-between text-[#8c7b6d] text-base px-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Droplet className="w-4 h-4 text-sky-600" />
                Câu hỏi 3 / 3
              </span>
              <span className={`${selectedFont.titleClass} font-bold text-lg text-[#5c4a3e]`}>Trang 03</span>
            </div>

            {/* Hộp nội dung */}
            <div className="box-notebook p-6 sm:p-8 space-y-7 bg-white relative">
              <div className="washi-tape" style={{ backgroundColor: 'rgba(186, 230, 253, 0.85)' }}></div>

              <div>
                <label className={`block text-2xl sm:text-3xl font-bold text-[#2b2420] mb-2 ${selectedFont.titleClass}`}>
                  3. Dạng nước nào bạn cảm thấy thích nhất?
                </label>
                <p className="text-sm text-[#8c7b6d] mb-4">
                  (VD: Đại dương mênh mông, dòng suối nhỏ róc rách, mưa rào mùa hạ, giọt sương mai, hơi nước ấm...)
                </p>
                <input
                  type="text"
                  value={answers.water.text}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      water: { ...answers.water, text: e.target.value },
                    })
                  }
                  placeholder="Dạng nước bạn yêu thích..."
                  className={`input-soft-doodle w-full text-2xl sm:text-3xl font-bold text-[#2b2420] placeholder-[#c4b5a8] ${selectedFont.titleClass}`}
                  autoFocus
                />
              </div>

              {/* 3 tính từ */}
              <div className="pt-4 border-t border-dashed border-[#e6ddd4]">
                <label className="block text-lg sm:text-xl font-bold text-[#443831] mb-2 flex items-center gap-2">
                  <Feather className="w-4 h-4 text-[#8c6b4b]" />
                  3 tính từ miêu tả cảm giác của dạng nước đó:
                </label>
                <p className="text-xs text-[#8c7b6d] mb-4">
                  Khi chạm vào hay ngắm nhìn dòng nước đó, bạn cảm thấy ra sao?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute left-2 top-2 text-xs text-[#9a897b] font-bold">#{idx + 1}</span>
                      <input
                        type="text"
                        value={answers.water.adjs[idx]}
                        onChange={(e) => {
                          const newAdjs = [...answers.water.adjs];
                          newAdjs[idx] = e.target.value;
                          setAnswers({
                            ...answers,
                            water: { ...answers.water, adjs: newAdjs },
                          });
                        }}
                        placeholder={idx === 0 ? 'VD: Mát lành' : idx === 1 ? 'VD: Tinh khiết' : 'VD: Êm đềm'}
                        className={`input-soft-doodle w-full text-lg sm:text-xl font-semibold text-[#362f2b] pt-5 ${selectedFont.titleClass}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Điều hướng */}
            <div className="flex justify-between items-center pt-2 px-1">
              <button
                onClick={() => handleBack(2)}
                className="text-[#7d6b5e] hover:text-[#2b2420] text-sm sm:text-base font-semibold underline decoration-dashed transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Trang trước
              </button>
              <button
                onClick={() => handleNext('loading')}
                className="btn-hand-primary px-8 py-3.5 text-xl font-bold flex items-center gap-2 cursor-pointer shadow-md bg-[#231e1b] hover:bg-[#110e0c]"
              >
                <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                <span className={selectedFont.titleClass}>Giải Mã Tiềm Thức</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE LOADING: MỰC ĐANG KHÔ, PHÁC HỌA TÂM TRÍ */}
        {/* ============================================================== */}
        {stage === 'loading' && (
          <div className="w-full text-center py-16 sm:py-20 space-y-6 animate-in fade-in duration-500">
            {/* Vòng quay doodle ngộ nghĩnh */}
            <div className="relative w-20 h-20 mx-auto">
              <svg className="w-full h-full stroke-[#4a3e36] fill-none stroke-[2.5] animate-spin" viewBox="0 0 100 100">
                <path d="M50 15 A 35 35 0 1 1 15 50" strokeDasharray="18 8" strokeLinecap="round" />
                <circle cx="50" cy="50" r="10" strokeDasharray="4 4" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg">✨</span>
            </div>

            <div className="space-y-2">
              <h2 className={`${selectedFont.titleClass} text-3xl sm:text-4xl font-bold text-[#2b2420] animate-pulse`}>
                Đang phác họa bức tranh tiềm thức...
              </h2>
              <p className="text-[#8c7b6d] text-base max-w-sm mx-auto">
                {loadingQuotes[loadingQuoteIndex]}
              </p>
            </div>

            <div className="w-36 h-1.5 bg-[#e5ddd3] rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-[#8c6b4b] rounded-full animate-[pulse_1s_infinite] w-3/4"></div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE RESULT: BỨC TRANH TÂM TRÍ / SỔ TAY KẾT QUẢ */}
        {/* ============================================================== */}
        {stage === 'result' && (
          <div className="w-full space-y-6 py-4 animate-in fade-in zoom-in-95 duration-500">
            {/* Tiêu đề kết quả mềm mại */}
            <div className="text-center relative pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#efe8de] text-xs font-bold text-[#68574a] uppercase tracking-wider mb-2">
                <Compass className="w-3.5 h-3.5" />
                Kết quả giải mã tâm lý
              </div>
              <h2 className={`${selectedFont.titleClass} text-4xl sm:text-5xl font-bold text-[#2b2420] tracking-tight`}>
                Bức Tranh Tâm Trí
              </h2>
              <div className="w-52 mx-auto mt-2">
                <svg className="w-full h-3 stroke-[#8c6b4b] fill-none stroke-2 opacity-70" viewBox="0 0 100 8" preserveAspectRatio="none">
                  <path d="M0 4 Q 25 1 50 4 T 100 4" />
                </svg>
              </div>
            </div>

            {/* 3 THẺ GIẢI MÃ */}
            <div className="space-y-5">
              {/* Thẻ 1: Bản Ngã Thật Sự */}
              <div className="box-notebook p-5 sm:p-7 bg-white relative overflow-hidden transition-all hover:shadow-[5px_7px_0px_rgba(46,40,37,0.12)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl border-2 border-[#362f2b] bg-[#fefce8] flex items-center justify-center font-bold text-base shadow-xs">
                      1
                    </div>
                    <div>
                      <h3 className={`${selectedFont.titleClass} text-2xl font-bold text-[#2b2420]`}>
                        Bản Ngã Thật Sự
                      </h3>
                      <span className="text-xs text-[#8c7b6d] font-medium">Cách bạn nhìn nhận và trân trọng chính mình</span>
                    </div>
                  </div>
                  <span className="text-2xl">🌱</span>
                </div>

                <div className="text-lg sm:text-xl text-[#3c322b] leading-relaxed pt-2 pl-2 border-l-2 border-[#e6ddd4]">
                  Lựa chọn màu sắc{' '}
                  <span
                    className={`font-bold text-2xl px-2 py-0.5 rounded-lg highlighter-pen ${selectedFont.titleClass}`}
                    style={{ backgroundColor: highlightInfo.bgSoft, color: '#1f1a17' }}
                  >
                    {answers.color.text.toUpperCase() || 'MÀU BẠN CHỌN'}
                  </span>{' '}
                  tiết lộ sâu trong tiềm thức, bạn nhìn nhận con người thật của mình mang phẩm chất:{' '}
                  <span className={`font-bold text-xl sm:text-2xl text-[#b45309] block sm:inline mt-1 sm:mt-0 ${selectedFont.titleClass}`}>
                    “{cleanColorAdjs}”
                  </span>
                  .
                  <p className="text-sm text-[#786a5e] mt-2 italic font-normal">
                    * Đây chính là lăng kính nội tâm mà bạn định nghĩa giá trị cốt lõi của bản thân giữa thế giới xung quanh.
                  </p>
                </div>
              </div>

              {/* Thẻ 2: Người Bạn Đời Lý Tưởng */}
              <div className="box-notebook p-5 sm:p-7 bg-white relative overflow-hidden transition-all hover:shadow-[5px_7px_0px_rgba(46,40,37,0.12)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl border-2 border-[#362f2b] bg-[#f0fdf4] flex items-center justify-center font-bold text-base shadow-xs">
                      2
                    </div>
                    <div>
                      <h3 className={`${selectedFont.titleClass} text-2xl font-bold text-[#2b2420]`}>
                        Người Bạn Đời Lý Tưởng
                      </h3>
                      <span className="text-xs text-[#8c7b6d] font-medium">Mẫu người đồng hành bạn vô thức kiếm tìm</span>
                    </div>
                  </div>
                  <span className="text-2xl">🕊️</span>
                </div>

                <div className="text-lg sm:text-xl text-[#3c322b] leading-relaxed pt-2 pl-2 border-l-2 border-[#e6ddd4]">
                  Hình ảnh con vật{' '}
                  <span className={`font-bold text-2xl px-2 border-b-2 border-dashed border-[#362f2b] text-[#2b2420] ${selectedFont.titleClass}`}>
                    {answers.animal.text.toUpperCase() || 'CON VẬT YÊU THÍCH'}
                  </span>{' '}
                  cho thấy sâu thẳm trong tim, bạn khao khát một người đồng hành mang nét đẹp:{' '}
                  <span className={`font-bold text-xl sm:text-2xl text-[#15803d] block sm:inline mt-1 sm:mt-0 ${selectedFont.titleClass}`}>
                    “{cleanAnimalAdjs}”
                  </span>
                  .
                  <p className="text-sm text-[#786a5e] mt-2 italic font-normal">
                    * Đó là những tính cách sẽ khiến bạn cảm thấy được che chở, thấu hiểu và rung động lâu dài.
                  </p>
                </div>
              </div>

              {/* Thẻ 3: Tình Yêu & Thân Mật */}
              <div className="box-notebook p-5 sm:p-7 bg-white relative overflow-hidden transition-all hover:shadow-[5px_7px_0px_rgba(46,40,37,0.12)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl border-2 border-[#362f2b] bg-[#f0f9ff] flex items-center justify-center font-bold text-base shadow-xs">
                      3
                    </div>
                    <div>
                      <h3 className={`${selectedFont.titleClass} text-2xl font-bold text-[#2b2420]`}>
                        Tình Yêu & Thân Mật
                      </h3>
                      <span className="text-xs text-[#8c7b6d] font-medium">Cách bạn cảm nhận và khao khát được yêu</span>
                    </div>
                  </div>
                  <span className="text-2xl">🌊</span>
                </div>

                <div className="text-lg sm:text-xl text-[#3c322b] leading-relaxed pt-2 pl-2 border-l-2 border-[#e6ddd4]">
                  Cảm nhận về dạng nước{' '}
                  <span className={`font-bold text-2xl px-2 border-b-2 border-dashed border-[#362f2b] text-[#2b2420] ${selectedFont.titleClass}`}>
                    {answers.water.text.toUpperCase() || 'DẠNG NƯỚC BẠN CHỌN'}
                  </span>{' '}
                  chính là trải nghiệm tình yêu và sự gắn kết bạn mong mỏi:{' '}
                  <span className={`font-bold text-xl sm:text-2xl text-[#0369a1] block sm:inline mt-1 sm:mt-0 ${selectedFont.titleClass}`}>
                    “{cleanWaterAdjs}”
                  </span>
                  .
                  <p className="text-sm text-[#786a5e] mt-2 italic font-normal">
                    * Tình yêu đối với bạn không chỉ là lời nói, mà là cảm giác dịu êm, tự do hay nồng nàn như dòng chảy ấy.
                  </p>
                </div>
              </div>
            </div>

            {/* Các hành động: Sao chép kết quả & Chơi lại */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={copyToClipboard}
                className="btn-hand-soft px-6 py-2.5 text-base font-bold flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span className={selectedFont.titleClass}>
                  {copied ? 'Đã sao chép vào bộ nhớ!' : 'Sao chép kết quả'}
                </span>
              </button>

              <button
                onClick={restart}
                className="btn-hand-primary px-6 py-2.5 text-base font-bold flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span className={selectedFont.titleClass}>Lật sang trang mới (Chơi lại)</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================== */}
      {/* CHÂN TRANG: TINH TẾ, DỊU DÀNG */}
      {/* ========================================== */}
      <footer className="w-full max-w-2xl mx-auto text-center py-3 text-xs text-[#9a897b] border-t border-[#e2d8cd] flex items-center justify-center">
        <span className="italic">Sổ tay tiềm thức cá nhân</span>
      </footer>
    </div>
  );
}
