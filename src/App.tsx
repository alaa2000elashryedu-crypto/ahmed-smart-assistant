/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  BarChart3, 
  HelpCircle, 
  MessageSquare, 
  Sparkles, 
  ArrowUp, 
  Star, 
  AlertCircle,
  Trophy,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { AgeTier, LessonData, StudentProfile, RewardNotification } from './types';
import { Navbar } from './components/Navbar';
import { LessonInput } from './components/LessonInput';
import { SummaryView } from './components/SummaryView';
import { InfographicView } from './components/InfographicView';
import { QuizView } from './components/QuizView';
import { TutorChatView } from './components/TutorChatView';
import { HomeworkSolverModal } from './components/HomeworkSolverModal';
import { SavedLessonsDrawer } from './components/SavedLessonsDrawer';
import { RewardsModal } from './components/RewardsModal';
import { RewardToast } from './components/RewardToast';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { AnimateVideoModal } from './components/AnimateVideoModal';
import { soundManager } from './utils/audio';
import { loadStudentProfile, saveStudentProfile, awardStudentAction } from './utils/rewards';

const STORAGE_KEY = 'fateen_saved_lessons_v1';
const AGE_KEY = 'fateen_user_age_tier';

export default function App() {
  const [ageTier, setAgeTier] = useState<AgeTier>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(AGE_KEY);
      if (saved === '5-8' || saved === '9-11' || saved === '12-15') {
        return saved;
      }
    }
    return '9-11';
  });

  const [savedLessons, setSavedLessons] = useState<LessonData[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Rewards & Profile State
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => loadStudentProfile());
  const [rewardNotification, setRewardNotification] = useState<RewardNotification | null>(null);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);

  const [currentLesson, setCurrentLesson] = useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isAnimateVideoOpen, setIsAnimateVideoOpen] = useState(false);
  const [activeVideoImage, setActiveVideoImage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [tutorInitialQuestion, setTutorInitialQuestion] = useState<string | undefined>(undefined);

  // Sync saved lessons to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedLessons));
    } catch {
      // quota or local storage error
    }
  }, [savedLessons]);

  const handleSelectAgeTier = (tier: AgeTier) => {
    setAgeTier(tier);
    localStorage.setItem(AGE_KEY, tier);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  const triggerReward = (
    action: 'review_lesson' | 'complete_quiz' | 'perfect_quiz' | 'listen_audio' | 'solve_homework' | 'ask_tutor',
    points?: number,
    reason?: string
  ) => {
    const res = awardStudentAction(action, points, reason);
    setStudentProfile(res.profile);
    if (res.notification) {
      setRewardNotification(res.notification);
    }
  };

  const scrollToResults = () => {
    setTimeout(() => {
      const el = document.getElementById('lesson-results-flow');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const scrollToSection = (id: string) => {
    soundManager.playClick();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    soundManager.playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewLesson = () => {
    soundManager.playClick();
    setCurrentLesson(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalyzeLesson = async (payload: {
    content: string;
    imageBase64?: string;
    mimeType?: string;
    ageTier: AgeTier;
    subject: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/lesson/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || resData.details || 'حدث خطأ أثناء معالجة الدرس');
      }

      const raw = resData.data;

      const newLesson: LessonData = {
        id: `lesson-${Date.now()}`,
        createdAt: Date.now(),
        title: raw.title || 'درس تعليمي ممتع',
        emoji: raw.emoji || '📖',
        ageTier: payload.ageTier,
        subject: payload.subject,
        originalText: payload.content,
        summaryPoints: raw.summaryPoints || [],
        infographic: raw.infographic || { headline: '', sections: [] },
        practiceQuestions: raw.practiceQuestions || [],
        homeworkTips: raw.homeworkTips || [],
        suggestedQuestions: raw.suggestedQuestions || [],
      };

      setCurrentLesson(newLesson);
      soundManager.playCorrect();

      // Automatically save to local library
      setSavedLessons((prev) => [newLesson, ...prev.filter((l) => l.title !== newLesson.title)]);

      // Award Points for reviewing & summarizing a lesson!
      triggerReward('review_lesson', 50, 'إتمام تلخيص وصناعة درس جديد بنجاح! 📖 (+50 نقطة)');

      // Smooth auto-scroll down to results
      scrollToResults();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      soundManager.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = (sample: LessonData) => {
    setCurrentLesson(sample);
    setAgeTier(sample.ageTier);
    setSavedLessons((prev) => [sample, ...prev.filter((l) => l.id !== sample.id)]);
    triggerReward('review_lesson', 30, 'بدء استكشاف درس تجريبي ممتع 🌟 (+30 نقطة)');
    scrollToResults();
  };

  const handleDeleteSavedLesson = (id: string) => {
    setSavedLessons((prev) => prev.filter((l) => l.id !== id));
  };

  const handleClearAllSaved = () => {
    setSavedLessons([]);
  };

  const handleAskTutorFromQuiz = (questionPrompt: string) => {
    setTutorInitialQuestion(questionPrompt);
    scrollToSection('section-tutor');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Top Navbar */}
      <Navbar
        ageTier={ageTier}
        onSelectAgeTier={handleSelectAgeTier}
        savedLessonsCount={savedLessons.length}
        onOpenSavedDrawer={() => setIsSavedDrawerOpen(true)}
        onOpenHomeworkModal={() => setIsHomeworkModalOpen(true)}
        onOpenRewardsModal={() => setIsRewardsModalOpen(true)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onOpenAnimateVideo={() => {
          setActiveVideoImage(null);
          setIsAnimateVideoOpen(true);
        }}
        onNewLesson={handleNewLesson}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        profile={studentProfile}
      />

      {/* Floating Reward Toast */}
      <RewardToast
        notification={rewardNotification}
        onDismiss={() => setRewardNotification(null)}
      />

      {/* Error alert if any */}
      {errorMessage && (
        <div className="max-w-4xl mx-auto mt-4 px-4 sm:px-6">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">تنبيه: </span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Top Input Form Area (Always available at the top) */}
        <LessonInput
          ageTier={ageTier}
          onSelectAgeTier={handleSelectAgeTier}
          onSubmitLesson={handleAnalyzeLesson}
          onLoadSample={handleLoadSample}
          isLoading={isLoading}
          hasResults={!!currentLesson}
          onScrollToResults={scrollToResults}
          onAnimateImage={(img) => {
            setActiveVideoImage(img);
            setIsAnimateVideoOpen(true);
          }}
        />

        {/* Results Stream Area: Appears directly below the input card! */}
        {currentLesson && (
          <div id="lesson-results-flow" className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 space-y-12 animate-in fade-in duration-500">
            {/* Header with Title and Sticky Section Navigator */}
            <div className="sticky top-18 z-30 bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-amber-200/90 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">{currentLesson.emoji}</span>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 truncate max-w-sm sm:max-w-md">
                      {currentLesson.title}
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تم تلخيص الدرس وعرض النتائج بالأسفل بالترتيب</span>
                    </div>
                  </div>
                </div>

                {/* Section Quick Jump Anchors */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => scrollToSection('section-summary')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold whitespace-nowrap cursor-pointer transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>١. ملخص النقاط</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('section-infographic')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-bold whitespace-nowrap cursor-pointer transition-all"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
                    <span>٢. الانفوجرافيك والفيديو 🎬</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('section-quiz')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold whitespace-nowrap cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>٣. الأسئلة والتدريبات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('section-tutor')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 text-xs font-bold whitespace-nowrap cursor-pointer transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-orange-600" />
                    <span>٤. اسأل مساعدي</span>
                  </button>

                  <button
                    type="button"
                    onClick={scrollToTop}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                    title="الرجوع لأعلى الصفحة"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 1. ملخص الدرس في صورة نقاط ذكية (مباشرة أسفل إدخال الدرس) */}
            <section id="section-summary" className="scroll-mt-36 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    ١
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      ملخص الدرس في صورة نقاط ذكية 📝
                    </h3>
                    <p className="text-xs text-slate-500">
                      أبرز المفاهيم ملخصة بلغة مبسطة مع أمثلة وقراءة صوتية
                    </p>
                  </div>
                </div>
              </div>

              <SummaryView
                lesson={currentLesson}
                onListenAudio={() => triggerReward('listen_audio', 25, 'الاستماع للشرح الصوتي للدرس 🎧 (+25 نقطة)')}
              />
            </section>

            {/* 2. الانفوجرافيك البصري (أسفل الملخص مباشرة) */}
            <section id="section-infographic" className="scroll-mt-36 space-y-4 pt-4 border-t-2 border-slate-200/80">
              <div className="flex items-center justify-between border-b border-sky-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-sky-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    ٢
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      صورة الانفوجرافيك وفيديو الدرس المتحرك 📊🎬
                    </h3>
                    <p className="text-xs text-slate-500">
                      معروض لك مباشرة أسفل التلخيص: فيديو تفاعلي وبطاقة انفوجرافيك ملونة قابلة للحفظ
                    </p>
                  </div>
                </div>
              </div>

              <InfographicView
                infographic={currentLesson.infographic}
                lessonTitle={currentLesson.title}
                emoji={currentLesson.emoji}
                onAnimateVideo={() => {
                  setActiveVideoImage(null);
                  setIsAnimateVideoOpen(true);
                }}
              />
            </section>

            {/* 3. الأسئلة والتدريبات التفاعلية (أسفل الانفوجرافيك) */}
            <section id="section-quiz" className="scroll-mt-36 space-y-4 pt-4 border-t-2 border-slate-200/80">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    ٣
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      الأسئلة والتدريبات التفاعلية 🎯
                    </h3>
                    <p className="text-xs text-slate-500">
                      تدرب على ما تعلمته واجمع نقاط المكافآت واختبر ذكاءك
                    </p>
                  </div>
                </div>
              </div>

              <QuizView
                questions={currentLesson.practiceQuestions}
                onAskTutor={handleAskTutorFromQuiz}
                onQuizCompleted={(score, total, isPerfect) => {
                  if (isPerfect) {
                    triggerReward('perfect_quiz', 120, 'العلامة الكاملة ١٠٠٪ في الاختبار! أداء أسطوري ⭐ (+120 نقطة)');
                  } else {
                    triggerReward('complete_quiz', 80, 'إتمام اختبار التدريب بنجاح! 🎯 (+80 نقطة)');
                  }
                }}
              />
            </section>

            {/* 4. اسأل مساعدي الذكي (الدردشة التفاعلية) */}
            <section id="section-tutor" className="scroll-mt-36 space-y-4 pt-4 border-t-2 border-slate-200/80">
              <div className="flex items-center justify-between border-b border-orange-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-orange-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    ٤
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      اسأل مساعدي الذكي عن أي استفسار 🤖💬
                    </h3>
                    <p className="text-xs text-slate-500">
                      المعلم الودود يجيب عن كافة أسئلتك ويوضح أي نقطة غامضة
                    </p>
                  </div>
                </div>
              </div>

              <TutorChatView
                lesson={currentLesson}
                ageTier={ageTier}
                initialQuestion={tutorInitialQuestion}
              />
            </section>
          </div>
        )}
      </main>

      {/* Homework Solver Modal */}
      <HomeworkSolverModal
        isOpen={isHomeworkModalOpen}
        onClose={() => setIsHomeworkModalOpen(false)}
        ageTier={ageTier}
        onHomeworkSolved={() => triggerReward('solve_homework', 60, 'فهم وحل مسألة واجب بنجاح! ✏️ (+60 نقطة)')}
      />

      {/* Rewards & Leaderboard Modal */}
      <RewardsModal
        isOpen={isRewardsModalOpen}
        onClose={() => setIsRewardsModalOpen(false)}
        profile={studentProfile}
        onUpdateProfile={(updated) => setStudentProfile(updated)}
      />

      {/* Live Voice Conversation Modal (Gemini 3.8 Live) */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        ageTier={ageTier}
        lesson={currentLesson}
        onRewardVoice={() => triggerReward('listen_audio', 40, 'إجراء محادثة صوتية ذكية مع مساعدي! 🎙️ (+40 نقطة)')}
      />

      {/* Animate Video Studio Modal (Gemini Omni 1.2 Flash) */}
      <AnimateVideoModal
        isOpen={isAnimateVideoOpen}
        onClose={() => setIsAnimateVideoOpen(false)}
        defaultImage={activeVideoImage}
        onRewardVideo={() => triggerReward('review_lesson', 50, 'إنتاج فيديو تعليمي متحرك للمخطط! 🎬 (+50 نقطة)')}
      />

      {/* Saved Lessons Drawer */}
      <SavedLessonsDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedLessons={savedLessons}
        onSelectLesson={(lesson) => {
          setCurrentLesson(lesson);
          setAgeTier(lesson.ageTier);
          scrollToResults();
        }}
        onDeleteLesson={handleDeleteSavedLesson}
        onClearAll={handleClearAllSaved}
      />

      {/* Friendly Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-amber-700">
            <img
              src="/assets/aistudio/Cheerful_School_Mascots_and_Smart_Assistant_fa100797.png"
              alt="مساعدي الذكي"
              className="w-6 h-6 object-contain rounded-md"
            />
            <span>مساعدي الذكي</span>
            <span className="text-slate-400 font-normal">| رفيقك في المذاكرة وحل الواجبات للأعمار من ٥ إلى ١٥ سنة</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRewardsModalOpen(true)}
              className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>لوحة الصدارة والميداليات ({studentProfile.totalPoints} ⭐)</span>
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">
              مدعوم بالذكاء الاصطناعي مع مراعاة تبسيط المفاهيم والتشجيع التربوي
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
