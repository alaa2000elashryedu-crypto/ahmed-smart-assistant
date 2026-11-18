import { StudentProfile, AchievementBadge, LeaderboardEntry, RewardNotification } from '../types';
import confetti from 'canvas-confetti';
import { soundManager } from './audio';

const PROFILE_STORAGE_KEY = 'fateen_student_profile_v2';

export const INITIAL_BADGES: AchievementBadge[] = [
  {
    id: 'badge_first_lesson',
    title: '🌱 خطوة الانطلاق',
    description: 'لخص وذاكر درسك الأول بنجاح واكتشف متعة التعلم',
    icon: '🌱',
    rewardPoints: 50,
    targetCount: 1,
    currentCount: 0,
    unlocked: false,
    color: 'emerald',
  },
  {
    id: 'badge_quiz_master',
    title: '🎯 بطل الاختبارات',
    description: 'أتمم حل ٣ اختبارات تدريبية وأثبت مهاراتك',
    icon: '🎯',
    rewardPoints: 120,
    targetCount: 3,
    currentCount: 0,
    unlocked: false,
    color: 'amber',
  },
  {
    id: 'badge_perfect_score',
    title: '⭐ العلامة الكاملة',
    description: 'احصل على الدرجة الكاملة (١٠٠٪) في أي اختبار تدريبي',
    icon: '⭐',
    rewardPoints: 100,
    targetCount: 1,
    currentCount: 0,
    unlocked: false,
    color: 'amber',
  },
  {
    id: 'badge_listener',
    title: '🎧 أذن المعرفة',
    description: 'استمع للشرح الصوتي للملخص أو الإجابات ٣ مرات',
    icon: '🎧',
    rewardPoints: 60,
    targetCount: 3,
    currentCount: 0,
    unlocked: false,
    color: 'sky',
  },
  {
    id: 'badge_homework_hero',
    title: '✏️ مفتاح الحل',
    description: 'استعن بمساعد حل الواجبات لفهم وحل مسألتين تعليميتين',
    icon: '✏️',
    rewardPoints: 80,
    targetCount: 2,
    currentCount: 0,
    unlocked: false,
    color: 'purple',
  },
  {
    id: 'badge_curious',
    title: '🤖 العقل المتسائل',
    description: 'اطرح ٣ أسئلة ذكية على مساعدي الذكي لتفهم بعمق',
    icon: '🤖',
    rewardPoints: 70,
    targetCount: 3,
    currentCount: 0,
    unlocked: false,
    color: 'sky',
  },
  {
    id: 'badge_scholar',
    title: '📚 فيلسوف المستقبل',
    description: 'ذاكر وراجع ٥ دروس تعليمية مختلفة في مجالات المعرفة',
    icon: '📚',
    rewardPoints: 200,
    targetCount: 5,
    currentCount: 0,
    unlocked: false,
    color: 'emerald',
  },
  {
    id: 'badge_legend',
    title: '👑 أسطورة الذكاء',
    description: 'اجمع أكثر من ٦٠٠ نقطة في مسيرتك التعليمية',
    icon: '👑',
    rewardPoints: 250,
    targetCount: 600,
    currentCount: 0,
    unlocked: false,
    color: 'rose',
  },
];

export const AVATARS = ['👦', '👧', '🦁', '🚀', '🤖', '🦊', '⭐', '🦖', '🎨', '⚽'];

// Calculate level details based on points
export function calculateLevel(points: number): {
  level: number;
  levelTitle: string;
  currentXp: number;
  nextLevelXp: number;
} {
  const tiers = [
    { level: 1, title: 'مستكشف مبتدئ 🌱', min: 0, max: 150 },
    { level: 2, title: 'باحث ذكي ⭐', min: 151, max: 350 },
    { level: 3, title: 'بطل المعرفة 🚀', min: 351, max: 650 },
    { level: 4, title: 'عبقري الواجبات 🎓', min: 651, max: 1050 },
    { level: 5, title: 'أسطورة الذكاء 👑', min: 1051, max: 2000 },
  ];

  for (const t of tiers) {
    if (points <= t.max) {
      const currentXp = points - t.min;
      const nextLevelXp = t.max - t.min;
      return {
        level: t.level,
        levelTitle: t.title,
        currentXp: Math.max(0, currentXp),
        nextLevelXp,
      };
    }
  }

  return {
    level: 5,
    levelTitle: 'أسطورة الذكاء 👑',
    currentXp: 1000,
    nextLevelXp: 1000,
  };
}

// Load Profile
export function loadStudentProfile(): StudentProfile {
  if (typeof window === 'undefined') {
    return createInitialProfile();
  }

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return createInitialProfile();
    const parsed: StudentProfile = JSON.parse(raw);

    // Merge any newly introduced badges if missing
    const existingBadgeIds = new Set(parsed.badges?.map((b) => b.id) || []);
    const mergedBadges = [
      ...(parsed.badges || []),
      ...INITIAL_BADGES.filter((b) => !existingBadgeIds.has(b.id)),
    ];

    const { level, levelTitle, currentXp, nextLevelXp } = calculateLevel(parsed.totalPoints || 0);

    return {
      name: parsed.name || 'البطل الذكي',
      avatar: parsed.avatar || '👦',
      totalPoints: parsed.totalPoints || 0,
      level,
      levelTitle,
      currentXp,
      nextLevelXp,
      quizzesCompleted: parsed.quizzesCompleted || 0,
      lessonsReviewed: parsed.lessonsReviewed || 0,
      audioListened: parsed.audioListened || 0,
      homeworkSolved: parsed.homeworkSolved || 0,
      badges: mergedBadges,
    };
  } catch {
    return createInitialProfile();
  }
}

function createInitialProfile(): StudentProfile {
  const { level, levelTitle, currentXp, nextLevelXp } = calculateLevel(0);
  return {
    name: 'البطل الذكي',
    avatar: '👦',
    totalPoints: 0,
    level,
    levelTitle,
    currentXp,
    nextLevelXp,
    quizzesCompleted: 0,
    lessonsReviewed: 0,
    audioListened: 0,
    homeworkSolved: 0,
    badges: INITIAL_BADGES,
  };
}

// Save Profile
export function saveStudentProfile(profile: StudentProfile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // storage error
  }
}

// Event-based reward tracker
export function awardStudentAction(
  action: 'review_lesson' | 'complete_quiz' | 'perfect_quiz' | 'listen_audio' | 'solve_homework' | 'ask_tutor',
  customPoints?: number,
  customReason?: string
): { profile: StudentProfile; notification?: RewardNotification } {
  const profile = loadStudentProfile();
  let pointsToAdd = customPoints || 0;
  let reason = customReason || '';

  switch (action) {
    case 'review_lesson':
      profile.lessonsReviewed += 1;
      pointsToAdd = customPoints || 40;
      reason = reason || 'مراجعة وتلخيص درس تعليمي 📖 (+40 نقطة)';
      break;

    case 'complete_quiz':
      profile.quizzesCompleted += 1;
      pointsToAdd = customPoints || 80;
      reason = reason || 'إتمام تدريب واختبار فهم الدرس 🎯';
      break;

    case 'perfect_quiz':
      pointsToAdd = customPoints || 100;
      reason = reason || 'العلامة الكاملة ١٠٠٪ في الاختبار! ⭐ (+100 نقطة)';
      break;

    case 'listen_audio':
      profile.audioListened += 1;
      pointsToAdd = customPoints || 25;
      reason = reason || 'الاستماع للشرح الصوتي للدرس 🎧 (+25 نقطة)';
      break;

    case 'solve_homework':
      profile.homeworkSolved += 1;
      pointsToAdd = customPoints || 50;
      reason = reason || 'حل وفهم مسألة واجب خطوة بخطوة ✏️ (+50 نقطة)';
      break;

    case 'ask_tutor':
      pointsToAdd = customPoints || 20;
      reason = reason || 'طرح سؤال ذكي على مساعدي الذكي 🤖 (+20 نقطة)';
      break;
  }

  profile.totalPoints += pointsToAdd;

  // Check badges unlock
  let newlyUnlockedBadge: AchievementBadge | undefined;

  profile.badges = profile.badges.map((b) => {
    let count = b.currentCount;
    if (b.id === 'badge_first_lesson') count = profile.lessonsReviewed;
    if (b.id === 'badge_quiz_master') count = profile.quizzesCompleted;
    if (b.id === 'badge_perfect_score' && action === 'perfect_quiz') count = 1;
    if (b.id === 'badge_listener') count = profile.audioListened;
    if (b.id === 'badge_homework_hero') count = profile.homeworkSolved;
    if (b.id === 'badge_curious' && action === 'ask_tutor') count = Math.min(b.targetCount, count + 1);
    if (b.id === 'badge_scholar') count = profile.lessonsReviewed;
    if (b.id === 'badge_legend') count = profile.totalPoints;

    const shouldUnlock = !b.unlocked && count >= b.targetCount;
    if (shouldUnlock) {
      newlyUnlockedBadge = {
        ...b,
        currentCount: count,
        unlocked: true,
        unlockedAt: Date.now(),
      };
      profile.totalPoints += b.rewardPoints; // bonus points for unlocking badge!
      return newlyUnlockedBadge;
    }

    return {
      ...b,
      currentCount: count,
    };
  });

  // Re-calculate level
  const { level, levelTitle, currentXp, nextLevelXp } = calculateLevel(profile.totalPoints);
  profile.level = level;
  profile.levelTitle = levelTitle;
  profile.currentXp = currentXp;
  profile.nextLevelXp = nextLevelXp;

  saveStudentProfile(profile);

  // Trigger celebration
  if (newlyUnlockedBadge) {
    try {
      soundManager.playFanfare();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // ignore
    }
  }

  const notification: RewardNotification = {
    id: `reward-${Date.now()}`,
    points: pointsToAdd + (newlyUnlockedBadge ? newlyUnlockedBadge.rewardPoints : 0),
    reason: newlyUnlockedBadge
      ? `وسام جديد: ${newlyUnlockedBadge.title}! 🏆 +${newlyUnlockedBadge.rewardPoints} نقطة إضافية!`
      : reason,
    badge: newlyUnlockedBadge,
  };

  return { profile, notification };
}

// Generate an inspiring peer leaderboard
export function getLeaderboard(student: StudentProfile): LeaderboardEntry[] {
  // Preset list of inspiring peer learners
  const peers = [
    { id: 'peer-1', name: 'سارة المتفوقة', avatar: '👧', points: 940, levelTitle: 'عبقري الواجبات 🎓' },
    { id: 'peer-2', name: 'عمر المبتكر', avatar: '🚀', points: 760, levelTitle: 'عبقري الواجبات 🎓' },
    { id: 'peer-3', name: 'جنى المستكشفة', avatar: '🌟', points: 610, levelTitle: 'بطل المعرفة 🚀' },
    { id: 'peer-4', name: 'ياسين العبقري', avatar: '🦊', points: 480, levelTitle: 'بطل المعرفة 🚀' },
    { id: 'peer-5', name: 'نور الفلكية', avatar: '⭐', points: 330, levelTitle: 'باحث ذكي ⭐' },
    { id: 'peer-6', name: 'كريم البطل', avatar: '🦁', points: 210, levelTitle: 'باحث ذكي ⭐' },
    { id: 'peer-7', name: 'مريم الرائعة', avatar: '🎨', points: 120, levelTitle: 'مستكشف مبتدئ 🌱' },
  ];

  const currentEntry: LeaderboardEntry = {
    id: 'current-user',
    rank: 1,
    name: student.name || 'أنت (البطل)',
    avatar: student.avatar || '👦',
    points: student.totalPoints,
    levelTitle: student.levelTitle,
    isCurrentUser: true,
  };

  // Combine & sort descending by points
  const allEntries: LeaderboardEntry[] = [
    ...peers.map((p) => ({ ...p, rank: 1, isCurrentUser: false })),
    currentEntry,
  ].sort((a, b) => b.points - a.points);

  // Assign ranks
  return allEntries.map((item, index) => ({
    ...item,
    rank: index + 1,
    trend: index === 0 ? 'up' : 'same',
  }));
}
