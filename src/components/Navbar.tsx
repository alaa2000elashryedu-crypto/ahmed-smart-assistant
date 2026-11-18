import React from 'react';
import { Sparkles, BookOpen, Volume2, VolumeX, FolderHeart, HelpCircle, PenTool, Trophy, Star } from 'lucide-react';
import { AgeTier, StudentProfile } from '../types';
import { soundManager } from '../utils/audio';

interface NavbarProps {
  ageTier: AgeTier;
  onSelectAgeTier: (tier: AgeTier) => void;
  savedLessonsCount: number;
  onOpenSavedDrawer: () => void;
  onOpenHomeworkModal: () => void;
  onOpenRewardsModal: () => void;
  onOpenLiveVoice: () => void;
  onOpenAnimateVideo: () => void;
  onNewLesson: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  profile: StudentProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  ageTier,
  onSelectAgeTier,
  savedLessonsCount,
  onOpenSavedDrawer,
  onOpenHomeworkModal,
  onOpenRewardsModal,
  onOpenLiveVoice,
  onOpenAnimateVideo,
  onNewLesson,
  isMuted,
  onToggleMute,
  profile,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div 
          onClick={onNewLesson}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          title="العودة للصفحة الرئيسية وبدء درس جديد"
        >
          <div className="w-12 h-12 rounded-2xl bg-white p-1 border-2 border-amber-300 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform overflow-hidden flex items-center justify-center">
            <img
              src="/assets/aistudio/Cheerful_School_Mascots_and_Smart_Assistant_fa100797.png"
              alt="شعار مساعدي الذكي"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent">
                مساعدي الذكي
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                للأبطال ⭐
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block font-medium">
              رفيق الواجبات والدروس للأبطال الصغار واليافعين
            </p>
          </div>
        </div>

        {/* Age Tier Selector Tabs */}
        <div className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => onSelectAgeTier('5-8')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              ageTier === '5-8'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-200/60'
            }`}
          >
            <span>🌱</span>
            <span>٥ - ٨ سنوات (براعم)</span>
          </button>
          <button
            onClick={() => onSelectAgeTier('9-11')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              ageTier === '9-11'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-amber-700 hover:bg-slate-200/60'
            }`}
          >
            <span>🚀</span>
            <span>٩ - ١١ سنة (مستكشف)</span>
          </button>
          <button
            onClick={() => onSelectAgeTier('12-15')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              ageTier === '12-15'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-200/60'
            }`}
          >
            <span>🎓</span>
            <span>١٢ - ١٥ سنة (رواد)</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Live Voice Button (Gemini 3.8 Live) */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenLiveVoice();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 border border-emerald-300 shadow-2xs font-black text-xs sm:text-sm transition-all hover:scale-102 cursor-pointer"
            title="محادثة صوتية مباشرة مع مساعدي الذكي (Live API)"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>🎙️ محادثة صوتية</span>
          </button>

          {/* Animate to Video Button (Gemini Omni 1.2 Flash) */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenAnimateVideo();
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 hover:from-sky-100 hover:to-indigo-100 text-sky-800 border border-sky-300 shadow-2xs font-black text-xs sm:text-sm transition-all hover:scale-102 cursor-pointer"
            title="تحريك الصور والرسومات إلى مقطع فيديو تعليمي (Omni Flash)"
          >
            <span>🎬 تحريك لفيديو</span>
          </button>

          {/* Rewards & Leaderboard Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenRewardsModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 border border-amber-300 shadow-2xs font-bold text-xs sm:text-sm transition-all hover:scale-102 cursor-pointer group"
            title="مكافآت المذاكرة ولوحة الصدارة"
          >
            <Trophy className="w-4 h-4 text-amber-500 fill-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="font-black text-amber-700">{profile.totalPoints} ⭐</span>
            <span className="hidden xl:inline text-[11px] px-1.5 py-0.5 rounded-md bg-amber-200/80 text-amber-950 font-black">
              {profile.levelTitle.split(' ')[0]}
            </span>
          </button>

          {/* Homework Solver Button */}
          <button
            onClick={onOpenHomeworkModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs sm:text-sm border border-orange-200 transition-all hover:scale-102 cursor-pointer"
            title="حل مسألة أو سؤال واجب خطوة بخطوة"
          >
            <PenTool className="w-4 h-4 text-orange-600" />
            <span className="hidden sm:inline">حل مسألة</span>
          </button>

          {/* Saved Lessons */}
          <button
            onClick={onOpenSavedDrawer}
            className="relative p-2.5 rounded-xl text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200/80 transition-all cursor-pointer"
            title="الدروس المحفوظة"
          >
            <FolderHeart className="w-4 h-4" />
            {savedLessonsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                {savedLessonsCount}
              </span>
            )}
          </button>

          {/* Mute Audio Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-50 border-rose-200 text-rose-500'
                : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
            }`}
            title={isMuted ? 'تشغيل المؤثرات الصوتية' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* New Lesson Button */}
          <button
            onClick={onNewLesson}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-xs shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden xs:inline">درس جديد</span>
          </button>
        </div>
      </div>

      {/* Mobile Age Tier & Points Bar */}
      <div className="flex md:hidden items-center justify-between bg-slate-100/90 px-3 py-1.5 border-t border-slate-200 text-[11px] font-bold">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectAgeTier('5-8')}
            className={`px-2 py-0.5 rounded-lg ${ageTier === '5-8' ? 'bg-emerald-500 text-white' : 'text-slate-600'}`}
          >
            🌱 ٥-٨
          </button>
          <button
            onClick={() => onSelectAgeTier('9-11')}
            className={`px-2 py-0.5 rounded-lg ${ageTier === '9-11' ? 'bg-amber-500 text-white' : 'text-slate-600'}`}
          >
            🚀 ٩-١١
          </button>
          <button
            onClick={() => onSelectAgeTier('12-15')}
            className={`px-2 py-0.5 rounded-lg ${ageTier === '12-15' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
          >
            🎓 ١٢-١٥
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenLiveVoice}
            className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1"
          >
            <span>🎙️ صوت</span>
          </button>
          <button
            onClick={onOpenAnimateVideo}
            className="px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800 font-black text-[10px] flex items-center gap-1"
          >
            <span>🎬 فيديو</span>
          </button>
          <button
            onClick={onOpenRewardsModal}
            className="flex items-center gap-1 text-amber-800 font-black text-xs"
          >
            <span>🏆 {profile.totalPoints} ⭐</span>
          </button>
        </div>
      </div>
    </header>
  );
};
