import { useState, useEffect } from 'react';
import { Flame, Calendar, Trophy, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../store';
import streakService from '../../services/streakService';

export default function StreakWidget() {
  const { user } = useAuthStore();
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStreakData();
    }
  }, [user]);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      
      // Verificar e atualizar streak
      const result = await streakService.checkAndUpdateStreak(user.uid);
      
      // Buscar estatísticas
      const stats = await streakService.getStreakStats(user.uid);

      setStreakData({ ...result, ...stats });

    } catch (error) {
      console.error('Erro ao carregar streak:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!streakData) return null;

  return (
    <div className="card bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Flame className="text-orange-500" size={24} />
            Sequência de Dias
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Continue estudando todos os dias!
          </p>
        </div>

        <div className="text-right">
          <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
            {streakData.current}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            dias
          </p>
        </div>
      </div>

      {streakData.message && (
        <div className={`p-3 rounded-lg mb-4 ${
          streakData.streakBroken
            ? 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
            : 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
        }`}>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {streakData.message}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
          <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {streakData.longest}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Recorde
          </p>
        </div>

        <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
          <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-500" />
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {streakData.totalDays}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Total
          </p>
        </div>

        <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {streakData.achievements?.length || 0}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Conquistas
          </p>
        </div>
      </div>
    </div>
  );
}