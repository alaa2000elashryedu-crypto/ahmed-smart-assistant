import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Camera, 
  Image as ImageIcon, 
  BookOpen, 
  UploadCloud, 
  X, 
  ArrowLeft, 
  Lightbulb, 
  Zap, 
  Rocket, 
  Loader2,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { AgeTier, LessonData } from '../types';
import { SAMPLE_LESSONS } from '../data/sampleLessons';
import { soundManager } from '../utils/audio';
import { processImageFile } from '../utils/image';

interface LessonInputProps {
  ageTier: AgeTier;
  onSelectAgeTier: (tier: AgeTier) => void;
  onSubmitLesson: (payload: {
    content: string;
    imageBase64?: string;
    mimeType?: string;
    ageTier: AgeTier;
    subject: string;
  }) => void;
  onLoadSample: (lesson: LessonData) => void;
  isLoading: boolean;
  hasResults?: boolean;
  onScrollToResults?: () => void;
  onAnimateImage?: (image: string) => void;
}

const SUBJECTS = [
  { id: 'العلوم والأحياء', label: 'العلوم 🔬', color: 'from-emerald-500 to-teal-600' },
  { id: 'الرياضيات والهندسة', label: 'الرياضيات 📐', color: 'from-blue-500 to-indigo-600' },
  { id: 'اللغة العربية والقواعد', label: 'اللغة العربية 📖', color: 'from-amber-500 to-orange-600' },
  { id: 'الدراسات والتاريخ والجغرافيا', label: 'الدراسات الاجتماعية 🌍', color: 'from-purple-500 to-pink-600' },
  { id: 'اللغة الإنجليزية', label: 'الإنجليزية 🇬🇧', color: 'from-rose-500 to-red-600' },
  { id: 'موضوع عام', label: 'موضوع عام 💡', color: 'from-slate-600 to-slate-800' },
];

export const LessonInput: React.FC<LessonInputProps> = ({
  ageTier,
  onSelectAgeTier,
  onSubmitLesson,
  onLoadSample,
  isLoading,
  hasResults,
  onScrollToResults,
  onAnimateImage,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'samples'>('text');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('العلوم والأحياء');
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Standard file input & direct camera input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle image files with automatic resizing & compression
  const handleImageFile = async (file: File) => {
    setImageError(null);
    setIsProcessingImage(true);
    try {
      const processed = await processImageFile(file, 1600, 0.85);
      setSelectedImage(processed);
      soundManager.playClick();
    } catch (err: any) {
      console.error('Image processing error:', err);
      setImageError(err.message || 'حدث خطأ أثناء معالجة الصورة. يرجى تجربة صورة أخرى.');
      soundManager.playWrong();
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  // Support pasting images directly from clipboard (Ctrl+V / Cmd+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleImageFile(file);
          break;
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) {
      alert('يرجى كتابة نص الدرس أو إرفاق صورة له');
      return;
    }
    soundManager.playClick();
    onSubmitLesson({
      content: content.trim(),
      imageBase64: selectedImage?.base64,
      mimeType: selectedImage?.mimeType,
      ageTier,
      subject,
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6" onPaste={handlePaste}>
      {/* Hidden file input elements - ALWAYS in DOM */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0]);
          }
          e.target.value = '';
        }}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0]);
          }
          e.target.value = '';
        }}
      />

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-6 sm:p-8 text-white shadow-xl shadow-amber-500/15 mb-8">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-amber-950 mb-3">
              <span>🌟</span>
              <span>رفيق المذاكرة الذكي رقم ١ للطلاب</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black leading-tight text-white drop-shadow-xs">
              أهلاً بك يا بطل! ما هو درسك اليوم؟
            </h1>
            <p className="mt-2 text-sm sm:text-base text-amber-950/85 font-medium max-w-xl">
              اكتب درسك أو صوّر صفحة كتابك، وسيقوم "مساعدي الذكي" بتلخيصه في نقاط ذكية، ورسم انفوجرافيك ممتع، وصناعة أسئلة تدريبية لاختبار فهمك والإجابة عن كل استفساراتك!
            </p>
          </div>
          <div className="shrink-0 flex items-center justify-center">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white/95 p-2 shadow-2xl border-4 border-white/90 animate-float flex items-center justify-center overflow-hidden">
              <img
                src="/assets/aistudio/Cheerful_School_Mascots_and_Smart_Assistant_fa100797.png"
                alt="مساعدي الذكي"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Age Tier Selector Cards */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-700 mb-2">
          اختر الفئة العمرية للغة والشرح المناسبين:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              onSelectAgeTier('5-8');
              soundManager.playClick();
            }}
            className={`p-3.5 rounded-2xl border-2 text-right transition-all flex items-start gap-3 ${
              ageTier === '5-8'
                ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-400/30'
                : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50'
            }`}
          >
            <span className="text-3xl p-1 bg-white rounded-xl shadow-xs">🌱</span>
            <div>
              <div className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                <span>٥ - ٨ سنوات</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">براعم</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">كلمات سهلة، إيموجي ملونة، قراءة صوتية وتشجيع مستمر</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectAgeTier('9-11');
              soundManager.playClick();
            }}
            className={`p-3.5 rounded-2xl border-2 text-right transition-all flex items-start gap-3 ${
              ageTier === '9-11'
                ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-2 ring-amber-400/30'
                : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-slate-50'
            }`}
          >
            <span className="text-3xl p-1 bg-white rounded-xl shadow-xs">🚀</span>
            <div>
              <div className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                <span>٩ - ١١ سنة</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">مستكشف</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">نقاط منظمة، حقائق علمية مدهشة، وأسئلة ذكاء وتحدي</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectAgeTier('12-15');
              soundManager.playClick();
            }}
            className={`p-3.5 rounded-2xl border-2 text-right transition-all flex items-start gap-3 ${
              ageTier === '12-15'
                ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-400/30'
                : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
            }`}
          >
            <span className="text-3xl p-1 bg-white rounded-xl shadow-xs">🎓</span>
            <div>
              <div className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                <span>١٢ - ١٥ سنة</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold">رواد</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">مفاهيم دقيقة، قوانين ومعادلات، وتركيز على الاختبارات</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7">
        {/* Input Method Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('text');
              soundManager.playClick();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>كتابة أو لصق الدرس</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('image');
              soundManager.playClick();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>تصوير / رفع صفحة الكتاب</span>
            {selectedImage && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('samples');
              soundManager.playClick();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'samples'
                ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>دروس تجريبية جاهزة</span>
          </button>
        </div>

        {/* Subject Chips */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-500 mb-2">
            المادة الدراسية:
          </label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setSubject(sub.id);
                  soundManager.playClick();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subject === sub.id
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error alert for image processing */}
        {imageError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
            <span>{imageError}</span>
            <button onClick={() => setImageError(null)} className="p-1 hover:bg-rose-100 rounded-md">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global Image Attached Preview (Visible in both Text & Image tabs when attached) */}
        {selectedImage && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <img
                  src={selectedImage.base64}
                  alt="Lesson preview"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl shadow-md border-2 border-white"
                />
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-xs">
                  ✓
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تم إرفاق وتحسين صورة صفحة الدرس بنجاح! 📸</span>
                </div>
                <p className="text-xs font-bold text-slate-700 mt-1 truncate max-w-xs sm:max-w-md">
                  {selectedImage.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  تم تحسين دقة الصورة ليقرأها الذكاء الاصطناعي ويستخرج نصوصها ومخططاتها بدقة فائقة.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onAnimateImage && (
                <button
                  type="button"
                  onClick={() => onAnimateImage(selectedImage.base64)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>🎬 تحريك لفيديو</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
              >
                تغيير الصورة
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  soundManager.playClick();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold border border-rose-200 transition-all cursor-pointer"
              >
                حذف الصورة
              </button>
            </div>
          </div>
        )}

        {/* Processing Spinner */}
        {isProcessingImage && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center gap-3 text-amber-800 text-xs font-bold animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
            <span>جارٍ تجهيز وتحسين جودة الصورة وقراءتها بدقة...</span>
          </div>
        )}

        {/* Tab 1: Text Input */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="lesson-text" className="block text-xs font-bold text-slate-600 mb-1.5">
                ألصق أو اكتب محتوى الدرس هنا:
              </label>
              <textarea
                id="lesson-text"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="مثال: تبدأ دورة حياة النبات بحبة بذرة نزرعها في التربة... أو اكتب أي درس أو فقرة من كتابك المدرسي... أو الصق صورة مباشرة (Ctrl+V)!"
                className="w-full p-4 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-400/20 text-slate-800 placeholder-slate-400 text-sm leading-relaxed outline-hidden transition-all resize-y"
              />
            </div>

            {!selectedImage && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <span>+ إرفاق صورة من الكتاب أو الجهاز</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-orange-600" />
                  <span>📸 تصوير مباشر بالكاميرا</span>
                </button>

                <span className="text-[11px] text-slate-400">
                  (يمكنك أيضاً لصق صورة من الحافظة مباشرة بالضغط على Ctrl+V)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Image / Photo Upload */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            {!selectedImage && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/80 rounded-3xl p-6 sm:p-10 text-center transition-all group"
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                  اختر صورة صفحة الكتاب أو اسحبها إلى هنا
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  يدعم صور صفحات الكتب المدرسية، الدفاتر، أوراق الواجبات، والمخططات العلمية (PNG, JPG, WebP)
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>اختيار صورة من جهازك</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>التقاط صورة بالكاميرا 📸</span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="image-notes" className="block text-xs font-bold text-slate-600 mb-1">
                {selectedImage
                  ? 'ملاحظات إضافية أو سؤال معين تريده التركيز عليه (اختياري):'
                  : 'أو اكتب نصاً إضافياً يوضح ما تريد استخراجه من الصورة (اختياري):'}
              </label>
              <input
                id="image-notes"
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="مثال: لخص الصفحة كاملة، أو ركز على التجربة العلمية في منتصف الصفحة..."
                className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-400/20 text-xs sm:text-sm outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Sample Lessons */}
        {activeTab === 'samples' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-medium">
              اختر أي درس تجريبي لتستكشف فوراً كيف يقوم "مساعدي الذكي" بالتلخيص وصناعة الانفوجرافيك والأسئلة التفاعلية:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.values(SAMPLE_LESSONS).map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => {
                    soundManager.playCorrect();
                    onLoadSample(lesson);
                  }}
                  className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 hover:bg-amber-50 text-right transition-all hover:scale-102 hover:shadow-md flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-2xl mb-2 group-hover:rotate-6 transition-transform">
                      {lesson.emoji}
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-800 leading-snug">{lesson.title}</h4>
                    <span className="inline-block mt-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                      {lesson.subject}
                    </span>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {lesson.originalText}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between text-xs font-bold text-amber-600">
                    <span>تجربة هذا الدرس</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit Action Button */}
        {activeTab !== 'samples' && (
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>
                {selectedImage
                  ? 'جاهز لقراءة الصورة المرفقة واستخراج الملخص والانفوجرافيك والأسئلة'
                  : 'جاهز لإنتاج: نقاط ملخصة + انفوجرافيك + أسئلة تفاعلية + شات ذكي'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              {hasResults && onScrollToResults && (
                <button
                  type="button"
                  onClick={onScrollToResults}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
                >
                  <span>👇 الانتقال لنتائج التلخيص بالأسفل</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || isProcessingImage || (!content.trim() && !selectedImage)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-black text-sm sm:text-base shadow-lg shadow-orange-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جارٍ التلخيص وصنع الانفوجرافيك والأسئلة...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-200" />
                    <span>ابدأ التلخيص الذكي للدرس ✨</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
