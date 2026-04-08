// src/hooks/useStreakCheck.js

import { useEffect } from 'react';
import { useAuthStore } from '../store';
import streakService from '../services/streakService';

export function useStreakCheck() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      // Verifica streak ao carregar a aplicação
      checkStreak();
    }
  }, [user]);

  const checkStreak = async () => {
    try {
      await streakService.checkAndUpdateStreak(user.uid);
    } catch (error) {
      console.error('Erro ao verificar streak:', error);
    }
  };

  return null;
}