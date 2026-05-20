import { useEffect } from 'react';
import { useAuthStore } from '../store';
import streakService from '../services/streakService';
import achievementService from '../services/achievementService';

export function useStreakCheck() {
  const { user, setUserProfile } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const syncStreak = async () => {
      try {
        await streakService.checkAndUpdateStreak(user.uid);
        const profile = await achievementService.refreshUserProfile(user.uid);
        if (profile) setUserProfile(profile);
      } catch (error) {
        console.error('Erro ao verificar streak:', error);
      }
    };

    syncStreak();
  }, [user, setUserProfile]);

  return null;
}
