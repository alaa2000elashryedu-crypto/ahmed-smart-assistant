import React, { useState } from 'react';
import { 
  X, 
  Trophy, 
  Medal, 
  Star, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Flame, 
  User, 
  TrendingUp, 
  Award, 
  Edit3, 
  Check, 
  HelpCircle 
} from 'lucide-react';
import { StudentProfile, AchievementBadge, LeaderboardEntry } from '../types';
import { AVATARS, getLeaderboard, saveStudentProfile } from '../utils/rewards';
import { soundManager } from '../utils/audio';

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onUpdateProfile: (updated: StudentProfile) => void;
}

export const RewardsModal: React.FC<RewardsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'badges' | 'leaderboard' | 'guide'>('badges');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  if (!isOpen) return null;

  const leaderboard = getLeaderboard(profile);
  const userRank = leaderboard.find((e) => e.isCurrentUser)?.rank || 1;
  const unlockedBadgesCount = profile.badges.filter((b) => b.unlocked).length;

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    const updated = { ...profile, name: trimmed };
    onUpdateProfile(updated);
    saveStudentProfile(updated);
    setIsEditingName(false);
    soundManager.playClick();
  };

  const handleSelectAvatar = (av: string) => {
    const updated = { ...profile, avatar: av };
    onUpdateProfile(updated);
    saveStudentProfile(updated);
    setShowAvatarPicker(false);
    soundManager.playClick();
  };

  const xpPercent = Math.min(
    100,
    Math.round((profile.currentXp / Math.max(1, profile.nextLevelXp)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl border border-white/30 shadow-inner">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl">مكافآت المذاكرة والإنجازات</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                  مركزك: #{userRank}
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                اجمع النقاط مع كل درس واختبار وتصدر لوحة الأبطال!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Profile & Level Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-amber-50/70 to-white border-b border-slate-200 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Avatar & Name */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="w-14 h-14 rounded-2xl bg-white shadow-md border-2 border-amber-300 flex items-center justify-center text-3xl hover:scale-105 transition-transform cursor-pointer"
                  title="تغيير صورتك الرمزية"
                >
                  {profile.avatar}
                </button>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  ✏️
                </span>

                {/* Avatar Picker Dropdown */}
                {showAvatarPicker && (
                  <div className="absolute top-16 right-0 z-20 p-2 bg-white rounded-2xl shadow-xl border border-slate-200 grid grid-cols-5 gap-2 w-52 animate-in fade-in">
                    {AVATARS.map((av) => (
                      <button
                        key={av}
                        onClick={() => handleSelectAvatar(av)}
                        className="w-9 h-9 rounded-xl hover:bg-amber-100 flex items-center justify-center text-xl transition-transform hover:scale-110"
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-amber-400 text-xs font-bold outline-hidden w-36"
                      maxLength={18}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1 rounded-md bg-emerald-500 text-white"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-base text-slate-800">{profile.name}</h4>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-slate-400 hover:text-amber-600 transition-colors"
                      title="تعديل الاسم"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-black text-amber-700 bg-amber-100/90 px-2.5 py-0.5 rounded-full">
                    {profile.levelTitle}
                  </span>
                  <span className="text-xs font-black text-orange-600 flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                    <span>{profile.totalPoints} نقطة</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Chips */}
            <div className="flex items-center gap-2 sm:gap-3 text-center">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-400 font-bold">الاختبارات</div>
                <div className="text-sm font-black text-slate-800">{profile.quizzesCompleted} 🎯</div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-400 font-bold">الدروس</div>
                <div className="text-sm font-black text-slate-800">{profile.lessonsReviewed} 📖</div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-400 font-bold">الأوسمة</div>
                <div className="text-sm font-black text-amber-600">
                  {unlockedBadgesCount} / {profile.badges.length} 🏅
                </div>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span>التقدم للمستوى التالي (المستوى {profile.level + 1})</span>
              <span>
                {profile.currentXp} / {profile.nextLevelXp} XP ({xpPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-slate-100 bg-white shrink-0">
          <button
            onClick={() => {
              setActiveTab('badges');
              soundManager.playClick();
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Medal className="w-4 h-4" />
            <span>الأوسمة والميداليات ({unlockedBadgesCount}/{profile.badges.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('leaderboard');
              soundManager.playClick();
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>لوحة صدارة الأبطال 🏆</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('guide');
              soundManager.playClick();
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>كيف تجمع النقاط؟ ⭐</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Tab 1: Badges & Medals */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {profile.badges.map((badge: AchievementBadge) => {
                const progress = Math.min(
                  100,
                  Math.round((badge.currentCount / Math.max(1, badge.targetCount)) * 100)
                );

                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 relative overflow-hidden ${
                      badge.unlocked
                        ? 'border-amber-300 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 shadow-xs'
                        : 'border-slate-200 bg-slate-50/60 opacity-80'
                    }`}
                  >
                    {/* Badge Icon */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-2xs border ${
                        badge.unlocked
                          ? 'bg-gradient-to-tr from-amber-400 to-orange-400 text-white border-amber-300 ring-2 ring-amber-200'
                          : 'bg-slate-200 text-slate-400 border-slate-300 grayscale'
                      }`}
                    >
                      {badge.unlocked ? badge.icon : '🔒'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-black text-sm text-slate-900 truncate">
                          {badge.title}
                        </h4>
                        <span
                          className={`text-[11px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                            badge.unlocked
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          +{badge.rewardPoints} نقطة
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {badge.description}
                      </p>

                      {/* Progress / Status */}
                      <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold">
                        {badge.unlocked ? (
                          <span className="text-emerald-700 flex items-center gap-1 font-black">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تم الحصول على الوسام! 🏅</span>
                          </span>
                        ) : (
                          <div className="w-full">
                            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                              <span>التقدم</span>
                              <span>
                                {badge.currentCount} / {badge.targetCount} ({progress}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Leaderboard */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              {/* Top 3 Podium */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto pt-4 pb-2 items-end text-center">
                {/* 2nd Place */}
                <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center">
                  <span className="text-2xl mb-1">{leaderboard[1]?.avatar || '🥈'}</span>
                  <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center -mt-3 mb-1 border-2 border-white">
                    2
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate max-w-full">
                    {leaderboard[1]?.name}
                  </div>
                  <div className="text-[11px] font-black text-slate-600 mt-0.5">
                    {leaderboard[1]?.points} ⭐
                  </div>
                </div>

                {/* 1st Place - Gold */}
                <div className="p-4 rounded-3xl bg-gradient-to-b from-amber-100 to-amber-50 border-2 border-amber-300 shadow-md flex flex-col items-center -translate-y-2">
                  <span className="text-4xl mb-1 animate-bounce">👑</span>
                  <span className="text-2xl">{leaderboard[0]?.avatar || '🥇'}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-black text-sm flex items-center justify-center -mt-3 mb-1 border-2 border-white shadow-xs">
                    1
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-full">
                    {leaderboard[0]?.name}
                  </div>
                  <div className="text-xs font-black text-amber-700 mt-0.5">
                    {leaderboard[0]?.points} ⭐
                  </div>
                </div>

                {/* 3rd Place - Bronze */}
                <div className="p-3 rounded-2xl bg-orange-50/70 border border-orange-200 flex flex-col items-center">
                  <span className="text-2xl mb-1">{leaderboard[2]?.avatar || '🥉'}</span>
                  <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center -mt-3 mb-1 border-2 border-white">
                    3
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate max-w-full">
                    {leaderboard[2]?.name}
                  </div>
                  <div className="text-[11px] font-black text-orange-700 mt-0.5">
                    {leaderboard[2]?.points} ⭐
                  </div>
                </div>
              </div>

              {/* Full Leaderboard List */}
              <div className="space-y-2 mt-4">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      entry.isCurrentUser
                        ? 'border-amber-400 bg-amber-50/90 shadow-md ring-2 ring-amber-300'
                        : 'border-slate-200/90 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                          entry.rank === 1
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : entry.rank === 2
                            ? 'bg-slate-300 text-slate-900'
                            : entry.rank === 3
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {entry.rank}
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">
                        {entry.avatar}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            {entry.name}
                          </span>
                          {entry.isCurrentUser && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black">
                              أنت 🌟
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {entry.levelTitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 font-black text-sm text-amber-600">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>{entry.points} نقطة</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Rewards Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <h4 className="font-black text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>طرق سهلة وممتعة لجمع النقاط كل يوم:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-amber-100">
                    <div className="font-bold text-slate-800">📖 تلخيص درس جديد</div>
                    <p className="text-slate-500 mt-0.5">+٤٠ نقطة لكل درس تلخصه</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-amber-100">
                    <div className="font-bold text-slate-800">🎯 حل اختبار تدريبي</div>
                    <p className="text-slate-500 mt-0.5">+٨٠ نقطة عند إتمام أسئلة الدرس</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-amber-100">
                    <div className="font-bold text-slate-800">⭐ تحقيق العلامة الكاملة</div>
                    <p className="text-slate-500 mt-0.5">+١٠٠ نقطة إضافية عند الحصول على 100%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-amber-100">
                    <div className="font-bold text-slate-800">🎧 الاستماع للشرح الصوتي</div>
                    <p className="text-slate-500 mt-0.5">+٢٥ نقطة عند الاستماع للدرس</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-amber-100">
                    <div className="font-bold text-slate-800">✏️ حل مسألة واجب خطوة بخطوة</div>
                    <p className="text-slate-500 mt-0.5">+٥٠ نقطة عند فهم وحل مسألة</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-amber-100">
                    <div className="font-bold text-slate-800">🤖 سؤال مساعدي الذكي</div>
                    <p className="text-slate-500 mt-0.5">+٢٠ نقطة لكل استفسار ومناقشة علمية</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
