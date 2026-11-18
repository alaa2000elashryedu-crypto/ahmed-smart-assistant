import React from 'react';
import { X, Trash2, BookOpen, Clock, ArrowLeft } from 'lucide-react';
import { LessonData } from '../types';
import { soundManager } from '../utils/audio';

interface SavedLessonsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedLessons: LessonData[];
  onSelectLesson: (lesson: LessonData) => void;
  onDeleteLesson: (lessonId: string) => void;
  onClearAll: () => void;
}

export const SavedLessonsDrawer: React.FC<SavedLessonsDrawerProps> = ({
  isOpen,
  onClose,
  savedLessons,
  onSelectLesson,
  onDeleteLesson,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-500 text-white">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-100" />
            <h3 className="font-black text-base">دروسي وواجباتي المحفوظة ({savedLessons.length})</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lessons List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedLessons.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl">
                📚
              </div>
              <h4 className="font-bold text-slate-700 text-sm">لا توجد دروس محفوظة بعد</h4>
              <p className="text-xs text-slate-400 mt-1">
                كل درس تقوم بتلخيصه يُحفظ هنا تلقائياً لتعود لمراجعته قبل الاختبارات في أي وقت!
              </p>
            </div>
          ) : (
            savedLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-amber-300 bg-white hover:bg-amber-50/20 transition-all flex items-center justify-between gap-3 group"
              >
                <div
                  onClick={() => {
                    soundManager.playClick();
                    onSelectLesson(lesson);
                    onClose();
                  }}
                  className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    {lesson.emoji}
                  </div>
                  <div className="truncate">
                    <h5 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                      {lesson.title}
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{lesson.subject || 'عام'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(lesson.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDeleteLesson(lesson.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="حذف من المحفوظات"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onSelectLesson(lesson);
                      onClose();
                    }}
                    className="p-2 rounded-xl text-amber-600 hover:bg-amber-100 transition-colors"
                    title="فتح الدرس"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {savedLessons.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من رغبتك في حذف جميع الدروس المحفوظة؟')) {
                  onClearAll();
                }
              }}
              className="text-xs text-rose-600 hover:underline font-bold"
            >
              مسح جميع الدروس
            </button>
            <span className="text-xs text-slate-400 font-medium">
              محفوظة على هذا المتصفح
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
