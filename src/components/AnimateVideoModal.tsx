import React, { useState, useRef } from 'react';
import { 
  Film, 
  Video, 
  Sparkles, 
  X, 
  Play, 
  Download, 
  RefreshCw, 
  UploadCloud, 
  Monitor, 
  Smartphone, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { processImageFile } from '../utils/image';

interface AnimateVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultImage?: string | null;
  onRewardVideo?: () => void;
}

const SAMPLE_DIAGRAMS = [
  {
    id: 'plant-cycle',
    title: 'دورة حياة النبات 🌱',
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=600&q=80',
    prompt: 'تحريك نمو البذرة لتخرج منها الجذور وتنمو الساق والأوراق الخضراء لتتفتح زهرة جميلة تحت أشعة الشمس الدافئة.',
  },
  {
    id: 'solar-system',
    title: 'المجموعة الشمسية 🪐',
    image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=600&q=80',
    prompt: 'تحريك كواكب المجموعة الشمسية وهي تدور في مداراتها المنتظمة حول الشمس الساطعة مع لمعان النجوم البعيدة.',
  },
  {
    id: 'water-cycle',
    title: 'دورة الماء في الطبيعة 💧',
    image: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=600&q=80',
    prompt: 'تحريك تبخر مياه البحر وتصاعدها لتكوين السحب البيضاء ثم هطول قطرات المطر العذبة وعودتها للنهر والبحيرات.',
  },
];

export const AnimateVideoModal: React.FC<AnimateVideoModalProps> = ({
  isOpen,
  onClose,
  defaultImage,
  onRewardVideo,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(defaultImage || null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [prompt, setPrompt] = useState('تحريك عناصر المخطط التعليمي بانسيابية وشرح علمي بصري جذاب وممتع للطفل.');
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync default image when passed
  React.useEffect(() => {
    if (defaultImage) {
      setSelectedImage(defaultImage);
    }
  }, [defaultImage]);

  const handleSelectFile = async (file: File) => {
    try {
      setErrorMessage(null);
      const res = await processImageFile(file, 1200, 0.85);
      setSelectedImage(res.base64);
      soundManager.playClick();
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر معالجة الصورة');
    }
  };

  const handleGenerateVideo = async () => {
    if (!selectedImage) {
      setErrorMessage('يرجى اختيار صورة أو رسمة لتحريكها إلى فيديو');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setVideoUrl(null);
    soundManager.playClick();

    try {
      const response = await fetch('/api/video/animate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          prompt,
          aspectRatio,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'تعذر إنتاج الفيديو في الوقت الحالي');
      }

      setVideoUrl(data.videoUrl || data.videoBase64);
      soundManager.playCorrect();
      if (onRewardVideo) {
        onRewardVideo();
      }
    } catch (err: any) {
      console.error('Video animation error:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء إنتاج الفيديو. يرجى المحاولة مرة أخرى.');
      soundManager.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-sky-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleSelectFile(e.target.files[0]);
            }
            e.target.value = '';
          }}
        />

        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner border border-white/30">
              🎬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black">استوديو تحريك الصور إلى فيديو</h3>
                <span className="px-2 py-0.5 rounded-full bg-sky-300 text-sky-950 font-black text-[10px] flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  <span>Gemini Omni 1.2 Flash</span>
                </span>
              </div>
              <p className="text-xs text-sky-100 font-medium">
                حوّل رسومات ورسوم الكتب والمخططات إلى مقطع فيديو متحرك مشوق
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-xs text-rose-600 hover:underline cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* Video Result Stage if generated */}
          {videoUrl ? (
            <div className="p-5 rounded-3xl bg-slate-900 text-white flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center justify-between w-full border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم إنتاج الفيديو التعليمي بنجاح! 🎉</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  أبعاد الفيديو: {aspectRatio}
                </span>
              </div>

              <div className={`relative rounded-2xl overflow-hidden bg-black max-w-full shadow-2xl ${aspectRatio === '9:16' ? 'max-h-[380px] aspect-[9/16]' : 'w-full aspect-[16/9]'}`}>
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={videoUrl}
                  download={`lesson-animation-${Date.now()}.mp4`}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل الفيديو على جهازك (MP4)</span>
                </a>

                <button
                  type="button"
                  onClick={() => setVideoUrl(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>توليد حركة أخرى</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Choose or Upload Image */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  ١. حدد الصورة أو الرسمة التي تريد تحريكها:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Current / Uploaded Preview Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[160px] ${
                      selectedImage
                        ? 'border-sky-400 bg-sky-50/40 hover:bg-sky-50'
                        : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50'
                    }`}
                  >
                    {selectedImage ? (
                      <div className="relative group">
                        <img
                          src={selectedImage}
                          alt="Selected for animation"
                          className="h-32 rounded-xl object-contain shadow-sm border border-white"
                        />
                        <div className="mt-2 text-xs font-bold text-sky-700 flex items-center justify-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>اضغط لتغيير الصورة</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-sky-600 mb-2" />
                        <span className="font-bold text-xs text-slate-700">
                          اضغط لرفع صورة من جهازك
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          رسمة، مخطط درس، أو صورة صفحة كتاب
                        </span>
                      </>
                    )}
                  </div>

                  {/* Or pick a sample science diagram */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500">
                      أو اختر مخططاً علمياً جاهزاً للتجربة:
                    </span>
                    <div className="space-y-1.5">
                      {SAMPLE_DIAGRAMS.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => {
                            setSelectedImage(sample.image);
                            setPrompt(sample.prompt);
                            soundManager.playClick();
                          }}
                          className={`w-full p-2.5 rounded-xl border text-right text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                            selectedImage === sample.image
                              ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <img
                            src={sample.image}
                            alt={sample.title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <span className="flex-1">{sample.title}</span>
                          {selectedImage === sample.image && (
                            <CheckCircle2 className="w-4 h-4 text-sky-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Choose Aspect Ratio (16:9 or 9:16) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  ٢. اختر أبعاد الفيديو (Aspect Ratio):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAspectRatio('16:9');
                      soundManager.playClick();
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all flex items-center gap-3 cursor-pointer ${
                      aspectRatio === '16:9'
                        ? 'border-sky-500 bg-sky-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-10 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-800">
                        شاشة عريضة (16:9)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        مثالي لأجهزة الكمبيوتر وشاشات التلفاز واليوتيوب
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAspectRatio('9:16');
                      soundManager.playClick();
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all flex items-center gap-3 cursor-pointer ${
                      aspectRatio === '9:16'
                        ? 'border-sky-500 bg-sky-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-800">
                        شاشة طولية (9:16)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        مثالي للهواتف الذكية وتيك توك وريلز
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 3: Motion Prompt & Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ٣. وصف حركة الفيديو والتحريك التعليمي:
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="اكتب كيف تريد أن تتحرك عناصر الصورة (مثال: اجعل النبات ينمو وتشرق الشمس وتهطل الأمطار ببطء)..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-400/20 outline-hidden"
                />

                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 self-center">
                    اقتراحات سريعة:
                  </span>
                  {[
                    '🌿 حركة دورة الحياة ونمو الكائنات الحية',
                    '⚡ شرح تدفق الطاقة والمفاهيم العلمية',
                    '🎨 حركة كرتونية مبهجة ومحببة للأطفال',
                    '🔍 زووم سينمائي يكشف تفاصيل المخطط بدقة',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(preset)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800 transition-all cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <span>مدعوم بـ </span>
            <span className="font-bold text-sky-700">Gemini Omni Flash 1.2</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleGenerateVideo}
              disabled={isLoading || !selectedImage}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>جارٍ تحريك وتوليد الفيديو...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4 text-sky-200" />
                  <span>توليد الفيديو الآن 🎬</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
