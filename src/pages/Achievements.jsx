import { useState, useEffect } from 'react';
import { Award, Trophy, Star, Lock, Zap, Target, Brain, Flame } from 'lucide-react';
import { useAuthStore } from '../store';
import streakService from '../services/streakService';

export default function Achievements() {
  const { user, userProfile } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lista completa de conquistas
  const allAchievements = [
    {
      id: 'first_exercise',
      name: 'Primeiro Passo',
      description: 'Complete seu primeiro exercício',
      icon: Star,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      requirement: 'Completar 1 exercício',
      xp: 10,
    },
    {
      id: 'streak_3',
      name: 'Iniciante Dedicado',
      description: 'Mantenha um streak de 3 dias',
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      requirement: '3 dias de streak',
      xp: 50,
    },
    {
      id: 'streak_7',
      name: 'Uma Semana Forte',
      description: 'Mantenha um streak de 7 dias',
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      requirement: '7 dias de streak',
      xp: 100,
    },
    {
      id: 'streak_14',
      name: 'Duas Semanas!',
      description: 'Mantenha um streak de 14 dias',
      icon: Award,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      requirement: '14 dias de streak',
      xp: 200,
    },
    {
      id: 'streak_30',
      name: 'Mês Completo',
      description: 'Mantenha um streak de 30 dias',
      icon: Trophy,
      color: 'text-pink-500',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      requirement: '30 dias de streak',
      xp: 500,
    },
    {
      id: 'exercises_50',
      name: 'Praticante',
      description: 'Complete 50 exercícios',
      icon: Target,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      requirement: '50 exercícios',
      xp: 100,
    },
    {
      id: 'exercises_100',
      name: 'Veterano',
      description: 'Complete 100 exercícios',
      icon: Zap,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
      requirement: '100 exercícios',
      xp: 300,
    },
    {
      id: 'perfect_accuracy',
      name: 'Perfeição',
      description: 'Atinja 100% de precisão em 10 exercícios seguidos',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      requirement: '10 acertos consecutivos',
      xp: 250,
    },
    {
      id: 'master_learner',
      name: 'Mestre do Conhecimento',
      description: 'Complete todas as lições de um tópico',
      icon: Brain,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      requirement: 'Completar 1 tópico',
      xp: 400,
    },
  ];

  useEffect(() => {
    if (user) {
      loadStats();
    }
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

  const isUnlocked = (achievementId) => {
    return stats?.achievements?.includes(achievementId) || false;
  };

  const unlockedCount = allAchievements.filter(a => isUnlocked(a.id)).length;
  const totalXPFromAchievements = allAchievements
    .filter(a => isUnlocked(a.id))
    .reduce((sum, a) => sum + a.xp, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
          Desbloqueie conquistas estudando e praticando!
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {unlockedCount}/{allAchievements.length}
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            XP de Conquistas
          </p>
        </div>

        <div className="card text-center">
          <Zap className="w-12 h-12 mx-auto mb-3 text-purple-500" />
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {Math.round((unlockedCount / allAchievements.length) * 100)}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Progresso Total
          </p>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allAchievements.map((achievement) => {
          const Icon = achievement.icon;
          const unlocked = isUnlocked(achievement.id);

          return (
            <div
              key={achievement.id}
              className={`card transition-all ${
                unlocked
                  ? achievement.bgColor
                  : 'opacity-60 grayscale'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  unlocked ? 'bg-white dark:bg-gray-800' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
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
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {achievement.requirement}
                    </span>
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