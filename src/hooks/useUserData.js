// src/hooks/useUserData.js

import { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import streakService from '../services/streakService';
import exerciseService from '../services/exerciseService';

export function useUserData() {
  const { user, userProfile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    streak: 0,
    totalXP: 0,
    accuracy: 0,
    completedExercises: 0,
    level: 1,
    achievements: [],
  });

  useEffect(() => {
    if (user && userProfile) {
      loadAllData();
    }
  }, [user, userProfile]);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Buscar dados em paralelo
      const [streakData, dailyGoal] = await Promise.all([
        streakService.checkAndUpdateStreak(user.uid),
        streakService.checkDailyGoal(user.uid),
      ]);

      setStats({
        streak: streakData.streak || userProfile.streak || 0,
        totalXP: userProfile.totalXP || 0,
        accuracy: userProfile.accuracy || 0,
        completedExercises: userProfile.completedExercises || 0,
        level: userProfile.level || 1,
        achievements: userProfile.achievements || [],
        dailyGoal: dailyGoal,
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadAllData();
  };

  return { stats, loading, refreshData };
}