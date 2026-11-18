import React, { useEffect } from 'react';
import { Star, Trophy, Sparkles, X } from 'lucide-react';
import { RewardNotification } from '../types';

interface RewardToastProps {
  notification: RewardNotification | null;
  onDismiss: () => void;
}

export const RewardToast: React.FC<RewardToastProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-2xl shadow-orange-500/30 border-2 border-amber-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl border border-white/30 animate-bounce">
          {notification.badge ? '🏆' : '⭐'}
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1.5 font-black text-sm">
            <span>+{notification.points} نقطة مكافأة!</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          </div>
          <p className="text-xs text-amber-100 font-bold mt-0.5">
            {notification.reason}
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors mr-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
