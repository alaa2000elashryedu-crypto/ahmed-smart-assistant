import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Award, 
  RotateCcw, 
  ArrowLeft, 
  Sparkles, 
  Volume2, 
  Flame, 
  Star, 
  Trophy 
} from 'lucide-react';
import { Question } from '../types';
import { soundManager, speakArabic } from '../utils/audio';

interface QuizViewProps {
  questions: Question[];
  onAskTutor: (questionPrompt: string) => void;
  onQuizCompleted?: (score: number, totalQuestions: number, isPerfect: boolean) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ questions, onAskTutor, onQuizCompleted }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, { selected: string; isCorrect: boolean }>>({});

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-600 font-bold">لا توجد أسئلة كافية لهذا الدرس حالياً.</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isCorrect = selectedOption === currentQ.correctAnswer;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // fallback
    }
  };

  const triggerBigConfetti = () => {
    try {
      const end = Date.now() + 1500;
      const interval: any = setInterval(() => {
        if (Date.now() > end) {
          return clearInterval(interval);
        }
        confetti({
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          origin: {
            x: Math.random(),
            y: Math.random() - 0.2,
          },
        });
      }, 250);
    } catch {
      // fallback
    }
  };

  const handleSelectOption = (opt: string) => {
    if (isAnswerChecked) return;
    setSelectedOption(opt);
    soundManager.playClick();
  };

  const handleCheckAnswer = () => {
    if (!selectedOption || isAnswerChecked) return;
    setIsAnswerChecked(true);

    const correct = selectedOption === currentQ.correctAnswer;
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: { selected: selectedOption, isCorrect: correct },
    }));

    if (correct) {
      soundManager.playCorrect();
      triggerConfetti();
      setScore((prev) => prev + 100);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
    } else {
      soundManager.playWrong();
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    soundManager.playClick();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setShowHint(false);
    } else {
      setIsFinished(true);
      soundManager.playFanfare();
      triggerBigConfetti();
      if (onQuizCompleted) {
        const correctCount = Object.values(userAnswers).filter((a) => a.isCorrect).length;
        onQuizCompleted(score, questions.length, correctCount === questions.length);
      }
    }
  };

  const handleRestart = () => {
    soundManager.playClick();
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setShowHint(false);
    setScore(0);
    setStreak(0);
    setIsFinished(false);
    setUserAnswers({});
  };

  const handleReadQuestion = () => {
    speakArabic(`${currentQ.question}. الخيارات هي: ${currentQ.options.join(', ')}.`);
  };

  // Completion screen
  if (isFinished) {
    const totalQuestions = questions.length;
    const correctCount = Object.values(userAnswers).filter((a) => a.isCorrect).length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-xl text-center">
        <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-amber-100 flex items-center justify-center text-5xl shadow-inner animate-bounce">
          {percentage >= 80 ? '🏆' : percentage >= 50 ? '🌟' : '💪'}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          {percentage >= 80 ? 'مذهل جداً يا بطل! أداء أسطوري!' : percentage >= 50 ? 'عمل رائع ومجهود ممتاز!' : 'محاولة جيدة! المذاكرة تصنع الأبطال!'}
        </h2>
        <p className="text-slate-600 font-medium text-sm sm:text-base mt-2">
          لقد أتممت أسئلة التدريب على هذا الدرس بنجاح
        </p>

        {/* Score Cards */}
        <div className="grid grid-cols-3 gap-3 my-6 max-w-md mx-auto">
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="text-xs text-amber-800 font-bold">النقاط ⭐</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{score}</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="text-xs text-emerald-800 font-bold">الإجابات الصحيحة</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {correctCount} / {totalQuestions}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
            <div className="text-xs text-rose-800 font-bold">أعلى تتابع 🔥</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{maxStreak}</div>
          </div>
        </div>

        {/* Answers Review List */}
        <div className="text-right space-y-3 my-6">
          <h4 className="font-bold text-sm text-slate-800 border-b pb-2">مراجعة سريعة لأسئلة الاختبار:</h4>
          {questions.map((q, idx) => {
            const ans = userAnswers[idx];
            return (
              <div
                key={q.id}
                className={`p-3 rounded-xl border text-xs sm:text-sm ${
                  ans?.isCorrect ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                }`}
              >
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>س{idx + 1}: {q.question}</span>
                  {ans?.isCorrect ? (
                    <span className="text-emerald-600 font-black flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> صحيح
                    </span>
                  ) : (
                    <span className="text-rose-600 font-black flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> الإجابة: {q.correctAnswer}
                    </span>
                  )}
                </div>
                {!ans?.isCorrect && (
                  <p className="text-slate-600 text-xs mt-1.5">{q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <button
            onClick={handleRestart}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة التدريب مرة أخرى</span>
          </button>
          <button
            onClick={() => onAskTutor('لدي سؤال إضافي حول أسئلة التدريب والدرس')}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>اسأل مساعدي الذكي عن أي سؤال</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Gamification Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-slate-500">
            السؤال {currentIndex + 1} من {questions.length}
          </div>
          {currentQ.difficulty && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
              {currentQ.difficulty}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {streak > 1 && (
            <div className="flex items-center gap-1 text-xs font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full animate-bounce">
              <Flame className="w-4 h-4 fill-orange-500" />
              <span>تتابع: {streak} 🔥</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-100/70 px-3 py-1 rounded-full">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>{score} نقطة</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-slate-200 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
            {currentQ.question}
          </h3>
          <button
            onClick={handleReadQuestion}
            className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 transition-colors shrink-0"
            title="استمع للسؤال بصوت واضح"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="grid grid-cols-1 gap-3">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isOptionCorrect = option === currentQ.correctAnswer;

            let optionStyle = 'border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/30 text-slate-800';

            if (isAnswerChecked) {
              if (isOptionCorrect) {
                optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400/30 font-bold';
              } else if (isSelected && !isOptionCorrect) {
                optionStyle = 'border-rose-500 bg-rose-50 text-rose-950 line-through';
              } else {
                optionStyle = 'border-slate-200 opacity-50 bg-slate-50 text-slate-500';
              }
            } else if (isSelected) {
              optionStyle = 'border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-400/30 font-bold';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswerChecked}
                onClick={() => handleSelectOption(option)}
                className={`p-4 rounded-2xl border-2 text-right transition-all flex items-center justify-between gap-3 text-sm sm:text-base font-semibold cursor-pointer ${optionStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option}</span>
                </div>
                {isAnswerChecked && isOptionCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isAnswerChecked && isSelected && !isOptionCorrect && (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Hint toggle */}
        {currentQ.hint && !isAnswerChecked && (
          <div>
            {!showHint ? (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700"
              >
                <HelpCircle className="w-4 h-4" />
                <span>أحتاج تلميحاً ذكياً من مساعدي الذكي 💡</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-medium flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">تلميح مساعدي الذكي: </span>
                  <span>{currentQ.hint}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feedback Banner after checking */}
        {isAnswerChecked && (
          <div
            className={`p-4 rounded-2xl border ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-sm sm:text-base">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>إجابة صحيحة وممتازة! (+100 نقطة) 🌟</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>محاولة جيدة، الإجابة الصحيحة هي: {currentQ.correctAnswer}</span>
                </>
              )}
            </div>
            {currentQ.explanation && (
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-700">
                {currentQ.explanation}
              </p>
            )}
          </div>
        )}

        {/* Action Button: Check Answer OR Next Question */}
        <div className="pt-2 flex items-center justify-end gap-3">
          {!isAnswerChecked ? (
            <button
              type="button"
              disabled={!selectedOption}
              onClick={handleCheckAnswer}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-white font-black text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              تأكيد الإجابة 🚀
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{currentIndex < questions.length - 1 ? 'السؤال التالي' : 'عرض النتيجة النهائية 🏆'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
