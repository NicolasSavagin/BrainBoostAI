import { useEffect, useState } from 'react';
import { Trophy, Zap, BookOpen } from 'lucide-react';
import { WEEKLY_CHALLENGES } from '../../config/achievements';
import achievementService from '../../services/achievementService';
import { useAuthStore } from '../../store';

const ICONS = { Trophy, Zap, BookOpen };

export default function WeeklyChallenges() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ attempts: 0, lessons: 0, weeklyXP: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    achievementService.getWeekStudyStats(user.uid).then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, [user]);

  const getProgress = (challenge) => {
    const value =
      challenge.metric === 'attempts'
        ? stats.attempts
        : challenge.metric === 'lessons'
          ? stats.lessons
          : stats.weeklyXP;
    return Math.min(value, challenge.target);
  };

  if (loading) return <div className="card animate-pulse h-32" />;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Trophy className="text-purple-500" size={22} />
        Desafios da Semana
      </h3>
      <div className="space-y-3">
        {WEEKLY_CHALLENGES.map((challenge) => {
          const Icon = ICONS[challenge.icon] || Trophy;
          const current = getProgress(challenge);
          const done = current >= challenge.target;
          const pct = Math.min((current / challenge.target) * 100, 100);

          return (
            <div
              key={challenge.id}
              className={`p-3 rounded-lg border ${
                done
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon size={18} className={done ? 'text-purple-600' : 'text-primary-600'} />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{challenge.title}</p>
                  <p className="text-xs text-gray-500">{challenge.description}</p>
                </div>
                <span className="text-xs font-semibold text-purple-600">+{challenge.xpBonus} XP</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${done ? 'bg-purple-500' : 'bg-primary-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {current}/{challenge.target}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
