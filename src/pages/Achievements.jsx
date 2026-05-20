import { useState, useEffect } from 'react';
import {
  Award,
  Trophy,
  Star,
  Lock,
  Zap,
  Target,
  Brain,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../store';
import streakService from '../services/streakService';
import { ACHIEVEMENT_CATALOG } from '../config/achievements';

const ICON_MAP = {
  Star,
  Flame,
  Trophy,
  Award,
  Target,
  Zap,
  Brain,
  TrendingUp,
};

export default function Achievements() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const streakStats = await streakService.getStreakStats(user.uid);
      setStats(streakStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achievementId) =>
    stats?.achievements?.includes(achievementId) || false;

  const unlockedCount = ACHIEVEMENT_CATALOG.filter((a) =>
    isUnlocked(a.id)
  ).length;

  const totalXPFromAchievements = ACHIEVEMENT_CATALOG.filter((a) =>
    isUnlocked(a.id)
  ).reduce((sum, a) => sum + a.xp, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando conquistas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Conquistas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Desbloqueie conquistas estudando, praticando e mantendo seu streak.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {unlockedCount}/{ACHIEVEMENT_CATALOG.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Conquistas Desbloqueadas
          </p>
        </div>

        <div className="card text-center">
          <Star className="w-12 h-12 mx-auto mb-3 text-blue-500" />
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {totalXPFromAchievements}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">XP de Conquistas</p>
        </div>

        <div className="card text-center">
          <Zap className="w-12 h-12 mx-auto mb-3 text-purple-500" />
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {ACHIEVEMENT_CATALOG.length
              ? Math.round((unlockedCount / ACHIEVEMENT_CATALOG.length) * 100)
              : 0}
            %
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Progresso Total</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ACHIEVEMENT_CATALOG.map((achievement) => {
          const Icon = ICON_MAP[achievement.icon] || Award;
          const unlocked = isUnlocked(achievement.id);

          return (
            <div
              key={achievement.id}
              className={`card transition-all ${
                unlocked ? achievement.bgColor : 'opacity-60 grayscale'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl ${
                    unlocked ? 'bg-white dark:bg-gray-800' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {unlocked ? (
                    <Icon className={achievement.color} size={28} />
                  ) : (
                    <Lock className="text-gray-400" size={28} />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {achievement.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{achievement.requirement}</span>
                    <span className="badge bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs">
                      +{achievement.xp} XP
                    </span>
                  </div>
                </div>
              </div>

              {unlocked && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                    ✓ DESBLOQUEADO
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
