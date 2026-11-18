import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Lightbulb, Star, Copy, Check, BookmarkCheck, HeartHandshake } from 'lucide-react';
import { LessonData, SummaryPoint } from '../types';
import { speakArabic, stopSpeaking } from '../utils/audio';

interface SummaryViewProps {
  lesson: LessonData;
  onListenAudio?: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ lesson, onListenAudio }) => {
  const [activeReadingId, setActiveReadingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReadFullLesson = () => {
    if (activeReadingId === 'full') {
      stopSpeaking();
      setActiveReadingId(null);
      return;
    }
    setActiveReadingId('full');
    if (onListenAudio) {
      onListenAudio();
    }
    const textToRead = `${lesson.title}. ` + lesson.summaryPoints.map((p) => `${p.title}. ${p.text}.`).join(' ');
    speakArabic(
      textToRead,
      () => setActiveReadingId(null),
      () => setActiveReadingId(null)
    );
  };

  const handleReadPoint = (point: SummaryPoint) => {
    if (activeReadingId === point.id) {
      stopSpeaking();
      setActiveReadingId(null);
      return;
    }
    setActiveReadingId(point.id);
    const text = `${point.title}. ${point.text}. ${point.example ? 'مثال: ' + point.example : ''}`;
    speakArabic(
      text,
      () => setActiveReadingId(null),
      () => setActiveReadingId(null)
    );
  };

  const handleCopy = () => {
    const text = `${lesson.title}\n\n` + lesson.summaryPoints.map((p) => `• ${p.title}:\n  ${p.text}\n  ${p.example ? 'مثال: ' + p.example : ''}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Audio Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 border border-amber-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-3xl">
            {lesson.emoji}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800">{lesson.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-amber-700 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
                {lesson.summaryPoints.length} نقاط رئيسية
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ملخصة بلغة تناسب الأبطال
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Read Aloud Button */}
          <button
            onClick={handleReadFullLesson}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs ${
              activeReadingId === 'full'
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {activeReadingId === 'full' ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>إيقاف القراءة</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>استمع للدرس صوتياً 🔊</span>
              </>
            )}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-all"
            title="نسخ الملخص"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
          </button>
        </div>
      </div>

      {/* Summary Points List */}
      <div className="grid grid-cols-1 gap-4">
        {lesson.summaryPoints.map((point, index) => {
          const isReadingThis = activeReadingId === point.id;
          return (
            <div
              key={point.id || index}
              className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                isReadingThis
                  ? 'border-amber-400 bg-amber-50/50 shadow-md ring-2 ring-amber-300'
                  : 'border-slate-200/90 bg-white hover:border-amber-200 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
                    {point.emoji || '💡'}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
                      {point.title}
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                      {point.text}
                    </p>
                  </div>
                </div>

                {/* Individual point voice button */}
                <button
                  onClick={() => handleReadPoint(point)}
                  className={`p-2 rounded-xl transition-all shrink-0 ${
                    isReadingThis
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700'
                  }`}
                  title="استمع لهذه النقطة فقط"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Practical Example Box */}
              {point.example && (
                <div className="mt-4 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5 text-xs sm:text-sm text-emerald-900">
                  <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">مثال توضيحي: </span>
                    <span>{point.example}</span>
                  </div>
                </div>
              )}

              {/* Fun Fact / Did you know? */}
              {point.funFact && (
                <div className="mt-2 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs sm:text-sm text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">معلومة شيقة (هل تعلم؟): </span>
                    <span>{point.funFact}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Golden Homework Tips */}
      {lesson.homeworkTips && lesson.homeworkTips.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h4 className="font-black text-slate-900 text-base">نصائح مساعدي الذكي الذهبية لحل واجبات هذا الدرس:</h4>
          </div>
          <ul className="space-y-2 text-sm text-slate-800">
            {lesson.homeworkTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="font-medium leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
