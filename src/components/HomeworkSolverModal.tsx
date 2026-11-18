import React, { useState, useRef } from 'react';
import { 
  X, 
  PenTool, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  Lightbulb, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  ArrowLeft 
} from 'lucide-react';
import { AgeTier, HomeworkSolution } from '../types';
import { soundManager, speakArabic, stopSpeaking } from '../utils/audio';
import { processImageFile } from '../utils/image';

interface HomeworkSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  ageTier: AgeTier;
  onHomeworkSolved?: () => void;
}

export const HomeworkSolverModal: React.FC<HomeworkSolverModalProps> = ({
  isOpen,
  onClose,
  ageTier,
  onHomeworkSolved,
}) => {
  const [homeworkText, setHomeworkText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<HomeworkSolution | null>(null);
  const [isReading, setIsReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    try {
      const processed = await processImageFile(file, 1600, 0.85);
      setImagePreview(processed.base64);
      setMimeType(processed.mimeType);
      soundManager.playClick();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ في معالجة الصورة');
    }
  };

  const handleSolve = async () => {
    if (!homeworkText.trim() && !imagePreview) {
      alert('يرجى كتابة نص مسألة الواجب أو إرفاق صورتها');
      return;
    }

    soundManager.playClick();
    setIsLoading(true);
    setSolution(null);

    try {
      const response = await fetch('/api/homework/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeworkText: homeworkText.trim(),
          imageBase64: imagePreview,
          mimeType,
          ageTier,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'تعذر حل الواجب');
      }

      setSolution(data.data);
      soundManager.playCorrect();
      if (onHomeworkSolved) {
        onHomeworkSolved();
      }
    } catch (err: any) {
      alert('حدث خطأ أثناء حل المسألة: ' + (err.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadSolution = () => {
    if (!solution) return;
    if (isReading) {
      stopSpeaking();
      setIsReading(false);
      return;
    }
    setIsReading(true);
    const stepsText = solution.steps.map((s) => `الخطوة ${s.stepNumber}: ${s.title}. ${s.explanation}. ${s.detail || ''}`).join(' ');
    const fullText = `فهم المسألة: ${solution.understoodProblem}. القاعدة المستخدمة: ${solution.ruleOrConcept}. ${stepsText}. الإجابة النهائية: ${solution.finalAnswer}.`;

    speakArabic(
      fullText,
      () => setIsReading(false),
      () => setIsReading(false)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl border border-white/30">
              ✏️
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">مساعد حل الواجبات خطوة بخطوة</h3>
              <p className="text-xs text-amber-100 font-medium">
                يشرح لك طريقة الحل والمنطق لتتعلم بنفسك
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {!solution ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اكتب سؤال الواجب أو المسألة الرياضية/العلمية هنا:
                </label>
                <textarea
                  rows={4}
                  value={homeworkText}
                  onChange={(e) => setHomeworkText(e.target.value)}
                  placeholder="مثال: اشترى أحمد 3 دفاتر بسعر 5 ريالات للدفتر، وأعطى البائع 20 ريالاً، فكم الباقي؟ أو اكتب أي مسألة تواجه فيها صعوبة..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-400/20 text-slate-800 text-sm outline-hidden"
                />
              </div>

              {/* Photo Upload for Homework */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                    e.target.value = '';
                  }}
                />

                {!imagePreview ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/40 text-slate-600 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>أو صوّر ورقة الواجب / المسألة من الكتاب</span>
                  </button>
                ) : (
                  <div className="relative rounded-2xl border border-amber-200 p-3 bg-amber-50/40 flex items-center justify-between">
                    <img
                      src={imagePreview}
                      alt="Homework snippet"
                      className="w-20 h-20 object-cover rounded-xl"
                    />
                    <div className="text-right flex-1 mx-3">
                      <div className="font-bold text-xs text-slate-800">تم إرفاق صورة الواجب 📸</div>
                      <div className="text-[11px] text-slate-500">جاهز للقراءة والحل المنطقي</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="text-xs text-rose-600 font-bold px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>

              {/* Solve Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isLoading || (!homeworkText.trim() && !imagePreview)}
                  onClick={handleSolve}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 text-white font-black text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>مساعدي الذكي يفكر في حل المسألة خطوة بخطوة...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>حل واشرح لي الخطوات بالتفصيل ✨</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Solution View */
            <div className="space-y-4">
              {/* Voice Read Button for Solution */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  ✓ تم الحل والشرح التعليمي بنجاح
                </span>
                <button
                  onClick={handleReadSolution}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isReading ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  }`}
                >
                  {isReading ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isReading ? 'إيقاف الصوت' : 'استمع لشرح الحل 🔊'}</span>
                </button>
              </div>

              {/* 1. Problem Understanding */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>ماذا يطلب السؤال ببساطة؟</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">{solution.understoodProblem}</p>
              </div>

              {/* 2. Rule / Concept */}
              {solution.ruleOrConcept && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs sm:text-sm">
                  <span className="font-bold text-indigo-900">القاعدة أو القانون المستخدم: </span>
                  <span className="text-slate-700 font-semibold">{solution.ruleOrConcept}</span>
                </div>
              )}

              {/* 3. Steps */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-600">خطوات الحل المنطقية:</h4>
                {solution.steps.map((st) => (
                  <div
                    key={st.stepNumber}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      {st.stepNumber}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-900">{st.title}</div>
                      <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">{st.explanation}</p>
                      {st.detail && (
                        <div className="mt-1.5 p-2 rounded-xl bg-slate-50 font-mono text-xs text-amber-900 font-bold border border-slate-100">
                          {st.detail}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 4. Final Answer Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md">
                <div className="text-xs font-bold text-emerald-100">الناتج / الإجابة النهائية النموذجية:</div>
                <div className="text-lg sm:text-xl font-black mt-1">{solution.finalAnswer}</div>
              </div>

              {/* 5. Verification Tip */}
              {solution.verificationTip && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">كيف تتأكد بنفسك من صحة حلك؟ </span>
                    <span>{solution.verificationTip}</span>
                  </div>
                </div>
              )}

              {/* Encouragement */}
              {solution.encouragement && (
                <p className="text-center text-xs font-bold text-amber-700 mt-2">
                  ⭐ {solution.encouragement}
                </p>
              )}

              {/* Solve another problem */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    setSolution(null);
                    setHomeworkText('');
                    setImagePreview(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  حل مسألة أخرى ✏️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
