import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  Target, 
  Compass, 
  Heart, 
  Zap, 
  Star, 
  BookOpen, 
  ArrowLeft, 
  Download, 
  Printer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { InfographicData, InfographicSection } from '../types';
import { soundManager } from '../utils/audio';

interface InfographicViewProps {
  infographic: InfographicData;
  lessonTitle: string;
  emoji: string;
  onAnimateVideo?: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="w-5 h-5" />,
  book: <BookOpen className="w-5 h-5" />,
  lightbulb: <Lightbulb className="w-5 h-5" />,
  target: <Target className="w-5 h-5" />,
  compass: <Compass className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  star: <Star className="w-5 h-5" />,
};

const COLOR_STYLES: Record<string, { bg: string; border: string; text: string; badge: string; iconBg: string }> = {
  amber: {
    bg: 'bg-amber-50/70',
    border: 'border-amber-200',
    text: 'text-amber-900',
    badge: 'bg-amber-100 text-amber-800',
    iconBg: 'bg-amber-500 text-white',
  },
  emerald: {
    bg: 'bg-emerald-50/70',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-800',
    iconBg: 'bg-emerald-500 text-white',
  },
  sky: {
    bg: 'bg-sky-50/70',
    border: 'border-sky-200',
    text: 'text-sky-900',
    badge: 'bg-sky-100 text-sky-800',
    iconBg: 'bg-sky-500 text-white',
  },
  indigo: {
    bg: 'bg-indigo-50/70',
    border: 'border-indigo-200',
    text: 'text-indigo-900',
    badge: 'bg-indigo-100 text-indigo-800',
    iconBg: 'bg-indigo-600 text-white',
  },
  rose: {
    bg: 'bg-rose-50/70',
    border: 'border-rose-200',
    text: 'text-rose-900',
    badge: 'bg-rose-100 text-rose-800',
    iconBg: 'bg-rose-500 text-white',
  },
  purple: {
    bg: 'bg-purple-50/70',
    border: 'border-purple-200',
    text: 'text-purple-900',
    badge: 'bg-purple-100 text-purple-800',
    iconBg: 'bg-purple-600 text-white',
  },
};

export const InfographicView: React.FC<InfographicViewProps> = ({
  infographic,
  lessonTitle,
  emoji,
  onAnimateVideo,
}) => {
  const [viewMode, setViewMode] = useState<'combined' | 'video' | 'poster'>('combined');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const steps = infographic.stepsOrCycle || [];
  const videoSrc = infographic.videoUrl || '/videos/nature.mp4';

  // Step cycling animation for interactive visual
  useEffect(() => {
    if (steps.length === 0 || !isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % steps.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [steps.length, isPlaying]);

  // Live Canvas background particle & aura visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 640);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 280);

    const particles: Array<{ x: number; y: number; r: number; dx: number; dy: number; color: string; alpha: number }> = [];
    const colors = ['#f59e0b', '#10b981', '#0ea5e9', '#6366f1', '#ec4899'];

    for (let i = 0; i < 28; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 4 + 2,
        dx: (Math.random() - 0.5) * 0.8,
        dy: (Math.random() - 0.5) * 0.8,
        color: colors[i % colors.length],
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    let angle = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Glowing center orbit for stages
      angle += 0.015;
      const centerX = width / 2;
      const centerY = height / 2;

      const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, Math.min(width, height) / 2);
      grad.addColorStop(0, 'rgba(254, 243, 199, 0.35)');
      grad.addColorStop(0.5, 'rgba(224, 242, 254, 0.2)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw floating particles
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const togglePlay = () => {
    soundManager.playClick();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    soundManager.playClick();
    const next = !isMuted;
    setIsMuted(next);
    if (videoRef.current) {
      videoRef.current.muted = next;
    }
  };

  const handlePrint = () => {
    soundManager.playClick();
    window.print();
  };

  // Export the Infographic Poster as a high-resolution PNG image
  const handleDownloadPosterImage = () => {
    soundManager.playCorrect();
    setIsExportingImage(true);

    try {
      const el = posterRef.current;
      if (!el) return;

      // Draw poster onto a high-DPI canvas
      const width = 1200;
      const height = 900;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#fef3c7');
      bgGrad.addColorStop(0.5, '#ffffff');
      bgGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Outer border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 12;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // Title & Emoji
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 44px Tajawal, sans-serif';
      ctx.fillText(`${emoji} ${lessonTitle}`, width / 2, 90);

      // Headline
      ctx.font = 'bold 24px Tajawal, sans-serif';
      ctx.fillStyle = '#b45309';
      ctx.fillText(`« ${infographic.headline || 'انفوجرافيك تعليمي مميز'} »`, width / 2, 140);

      // Visual Metaphor
      if (infographic.visualMetaphor) {
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(80, 170, width - 160, 70);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Tajawal, sans-serif';
        ctx.fillText(`💡 تشبيه المفهوم: ${infographic.visualMetaphor.slice(0, 80)}`, width / 2, 212);
      }

      // Draw Steps
      if (steps.length > 0) {
        const stepWidth = (width - 160) / steps.length;
        steps.forEach((st, i) => {
          const stepX = width - 120 - i * stepWidth - stepWidth / 2;
          const stepY = 340;

          ctx.beginPath();
          ctx.arc(stepX, stepY, 40, 0, Math.PI * 2);
          ctx.fillStyle = i === currentStepIndex ? '#10b981' : '#f59e0b';
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 28px Tajawal, sans-serif';
          ctx.fillText(`${st.step || i + 1}`, stepX, stepY + 10);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 20px Tajawal, sans-serif';
          ctx.fillText(st.title, stepX, stepY + 70);

          ctx.fillStyle = '#475569';
          ctx.font = '16px Tajawal, sans-serif';
          ctx.fillText(st.desc.slice(0, 26), stepX, stepY + 100);
        });
      }

      // Draw Pillar Cards
      const sections = infographic.sections || [];
      if (sections.length > 0) {
        const cardW = (width - 180) / Math.min(3, sections.length);
        sections.slice(0, 3).forEach((sec, i) => {
          const cardX = width - 100 - (i + 1) * cardW;
          const cardY = 510;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cardX, cardY, cardW - 20, 260);
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.strokeRect(cardX, cardY, cardW - 20, 260);

          ctx.fillStyle = '#b45309';
          ctx.font = 'bold 22px Tajawal, sans-serif';
          ctx.fillText(sec.title, cardX + (cardW - 20) / 2, cardY + 45);

          ctx.fillStyle = '#334155';
          ctx.font = '16px Tajawal, sans-serif';
          sec.keyItems.slice(0, 3).forEach((item, j) => {
            ctx.fillText(`• ${item.slice(0, 30)}`, cardX + (cardW - 20) / 2, cardY + 95 + j * 40);
          });
        });
      }

      // Footer branding
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 18px Tajawal, sans-serif';
      ctx.fillText('✨ تم إنتاجه بواسطة "مساعدي الذكي" - رفيق الواجبات والدروس', width / 2, height - 35);

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `انفوجرافيك-${lessonTitle.slice(0, 20)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn('Poster export note:', e);
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & View Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-sky-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊🎬</span>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              صورة الانفوجرافيك وفيديو الدرس المتحرك
            </h3>
            <p className="text-xs text-slate-500">
              معروض لك بالأسفل مباشرة مع فيديو متحرك وبطاقة مصورة ملونة للمذاكرة
            </p>
          </div>
        </div>

        {/* View Mode Switcher + Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setViewMode('combined');
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'combined'
                  ? 'bg-sky-500 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-sky-700'
              }`}
              title="عرض الفيديو مع صورة الانفوجرافيك معاً"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>المدمج (فيديو + صورة)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setViewMode('video');
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'video'
                  ? 'bg-sky-500 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-sky-700'
              }`}
              title="عرض مشغل الفيديو فقط"
            >
              <Film className="w-3.5 h-3.5" />
              <span>الفيديو 🎬</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setViewMode('poster');
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'poster'
                  ? 'bg-sky-500 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-sky-700'
              }`}
              title="عرض صورة الانفوجرافيك فقط"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>الصورة 🖼️</span>
            </button>
          </div>

          {/* Download as Image */}
          <button
            type="button"
            onClick={handleDownloadPosterImage}
            disabled={isExportingImage}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black transition-all hover:scale-102 cursor-pointer shadow-2xs"
            title="تحميل بطاقة الانفوجرافيك كملف صورة PNG لجهازك"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>{isExportingImage ? 'جارٍ الحفظ...' : 'حفظ كصورة 🖼️'}</span>
          </button>

          {/* Print Poster */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer shadow-2xs"
            title="طباعة البطاقة للمذاكرة"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">طباعة</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          1. Embedded Educational Video & Motion Animation Player
      ======================================================== */}
      {(viewMode === 'combined' || viewMode === 'video') && (
        <div className="rounded-3xl border-2 border-sky-300 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white shadow-xl overflow-hidden relative group">
          {/* Top Video Header Strip */}
          <div className="px-5 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-black text-sky-300 flex items-center gap-1.5">
                <Film className="w-4 h-4" />
                <span>فيديو وتحريك الدرس التعليمي التفاعلي</span>
              </span>
              <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-200 font-bold border border-sky-400/30">
                يعمل تلقائياً
              </span>
            </div>

            {/* Quick Step Indicators */}
            {steps.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {steps.map((st, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setCurrentStepIndex(i);
                      soundManager.playClick();
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      currentStepIndex === i
                        ? 'bg-amber-400 text-slate-950 scale-105 shadow-xs'
                        : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <span>{i + 1}. {st.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Video Stage Container */}
          <div className="relative aspect-video max-h-[380px] w-full flex items-center justify-center bg-black overflow-hidden">
            {/* Live Interactive Canvas Particles & Lighting Atmosphere */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80"
            />

            {/* The Native HTML5 MP4 Video Stream */}
            {!videoError ? (
              <video
                ref={videoRef}
                src={videoSrc}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                controls={false}
                onError={() => {
                  console.warn('Video failed, rendering interactive canvas motion.');
                  setVideoError(true);
                }}
                className="w-full h-full object-cover relative z-10 opacity-90 transition-opacity"
              />
            ) : null}

            {/* Overlay Interactive Animated Infographic Motion Card (Runs live on top of video) */}
            <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/60 pointer-events-none">
              {/* Top Banner inside video */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-xs font-black">
                  <span>{emoji}</span>
                  <span className="truncate max-w-[200px] sm:max-w-md">{lessonTitle}</span>
                </div>
                <div className="text-[11px] font-bold text-amber-300 bg-amber-950/70 px-2.5 py-1 rounded-full border border-amber-500/40 backdrop-blur-md">
                  المرحلة {currentStepIndex + 1} من {steps.length || 3}
                </div>
              </div>

              {/* Center Active Stage Card animation */}
              {steps.length > 0 && steps[currentStepIndex] && (
                <div className="self-center text-center max-w-lg p-4 sm:p-5 rounded-2xl bg-slate-900/85 backdrop-blur-md border-2 border-amber-400/80 shadow-2xl animate-in zoom-in-95 duration-300 pointer-events-auto">
                  <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md mb-2">
                    {steps[currentStepIndex].step || currentStepIndex + 1}
                  </div>
                  <h4 className="text-base sm:text-xl font-black text-white leading-tight">
                    {steps[currentStepIndex].title}
                  </h4>
                  <p className="text-xs sm:text-sm font-medium text-amber-200 mt-1.5 leading-relaxed">
                    {steps[currentStepIndex].desc}
                  </p>
                </div>
              )}

              {/* Bottom Video Controls Strip */}
              <div className="flex items-center justify-between pointer-events-auto pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all cursor-pointer"
                    title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الفيديو'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>

                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all cursor-pointer"
                    title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime = 0;
                      setCurrentStepIndex(0);
                      soundManager.playClick();
                    }}
                    className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all cursor-pointer"
                    title="إعادة من البداية"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={videoSrc}
                    download={`فيديو-درس-${lessonTitle.slice(0, 15)}.mp4`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل الفيديو MP4</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          2. The Full Visual Infographic Poster (صورة الانفوجرافيك)
      ======================================================== */}
      {(viewMode === 'combined' || viewMode === 'poster') && (
        <div 
          ref={posterRef}
          className="rounded-3xl border-2 border-amber-300/90 bg-gradient-to-b from-amber-50/60 via-white to-orange-50/40 p-6 sm:p-8 shadow-md relative overflow-hidden"
        >
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-200/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          {/* 1. Poster Top Badge & Title */}
          <div className="text-center max-w-3xl mx-auto mb-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black mb-3 border border-amber-200/80 shadow-2xs">
              <span className="text-lg">{emoji}</span>
              <span>لوحة الانفوجرافيك المصورة للدرس</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">
              {lessonTitle}
            </h2>
            {infographic.headline && (
              <p className="mt-2.5 text-sm sm:text-base font-bold text-amber-800 bg-amber-50/90 inline-block px-4 py-1.5 rounded-xl border border-amber-200/80 shadow-2xs">
                « {infographic.headline} »
              </p>
            )}
          </div>

          {/* 2. Visual Metaphor Card (💡 تشبيه المفهوم) */}
          {infographic.visualMetaphor && (
            <div className="mb-8 relative z-10 p-5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 text-white shadow-md shadow-orange-500/20 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shrink-0 border border-white/30 shadow-inner">
                💡
              </div>
              <div>
                <div className="text-xs font-extrabold text-amber-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تقريب المفهوم للخيال والذاكرة:</span>
                </div>
                <p className="mt-1 text-sm sm:text-base font-bold leading-relaxed text-white">
                  {infographic.visualMetaphor}
                </p>
              </div>
            </div>
          )}

          {/* 3. Steps or Flow Diagram (Flowchart with Connecting Arrows) */}
          {steps.length > 0 && (
            <div className="mb-8 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-xs" />
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">
                    مراحل وتدفق الدرس خطوة بخطوة (التسلسل البصري):
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                  {steps.length} مراحل متتابعة
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {steps.map((stepItem, idx) => {
                  const isActive = currentStepIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        soundManager.playClick();
                      }}
                      className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50/80 shadow-md ring-2 ring-emerald-400/30 -translate-y-1'
                          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                        }`}>
                          {stepItem.step || idx + 1}
                        </span>

                        {idx < steps.length - 1 && (
                          <span className="hidden lg:block text-slate-300 group-hover:text-emerald-500 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                          {stepItem.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                          {stepItem.desc}
                        </p>
                      </div>

                      {isActive && (
                        <div className="mt-3 pt-2 border-t border-emerald-200/80 flex items-center gap-1 text-[11px] font-black text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>المرحلة المعروضة في الفيديو حالياً</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Infographic Pillars & Key Concept Cards */}
          {infographic.sections && infographic.sections.length > 0 && (
            <div className="mb-8 relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-xs" />
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  أركان ومفاهيم الدرس الأساسية:
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {infographic.sections.map((section: InfographicSection, idx: number) => {
                  const color = COLOR_STYLES[section.color] || COLOR_STYLES.amber;
                  const icon = ICON_MAP[section.icon] || <Sparkles className="w-5 h-5" />;

                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border-2 p-5 ${color.bg} ${color.border} shadow-2xs hover:shadow-md transition-all flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl ${color.iconBg} flex items-center justify-center shadow-xs shrink-0`}>
                            {icon}
                          </div>
                          <h4 className="font-black text-base text-slate-900 leading-snug">
                            {section.title}
                          </h4>
                        </div>

                        {section.description && (
                          <p className="text-xs font-semibold text-slate-600 mb-3 leading-relaxed">
                            {section.description}
                          </p>
                        )}

                        {section.keyItems && section.keyItems.length > 0 && (
                          <ul className="space-y-1.5 mt-2">
                            {section.keyItems.map((item, itemIdx) => (
                              <li
                                key={itemIdx}
                                className="text-xs font-bold text-slate-800 flex items-start gap-2 bg-white/80 p-2 rounded-xl border border-white/60 shadow-2xs"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Memory Statistics & Key Numbers Strip */}
          {infographic.quickStats && infographic.quickStats.length > 0 && (
            <div className="relative z-10 p-5 rounded-2xl bg-slate-900 text-white shadow-md">
              <div className="text-xs font-bold text-amber-400 mb-3 flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>بطاقات الذاكرة السريعة (أرقام وقوانين مفتاحية لحفظها):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {infographic.quickStats.map((stat, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                    <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
                    <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">{stat.value}</div>
                    {stat.note && <div className="text-[11px] text-slate-400 mt-0.5">{stat.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Card Footer with 1-click Download Image Button */}
          <div className="mt-6 pt-4 border-t border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2 font-bold text-slate-600">
              <img
                src="/assets/aistudio/Cheerful_School_Mascots_and_Smart_Assistant_fa100797.png"
                alt="مساعدي الذكي"
                className="w-5 h-5 object-contain"
              />
              <span>تم تصميم لوحة الانفوجرافيك خصيصاً لمساعدتك على الحفظ البصري السريع</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadPosterImage}
              disabled={isExportingImage}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-102 cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingImage ? 'جارٍ تحضير الصورة...' : 'حفظ كصورة انفوجرافيك (PNG) 🖼️'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
