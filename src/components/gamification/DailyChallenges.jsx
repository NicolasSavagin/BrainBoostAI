import { useEffect, useState } from 'react';
import { Target, CheckCircle, BookOpen, Sparkles } from 'lucide-react';
import { DAILY_CHALLENGES } from '../../config/achievements';
import achievementService from '../../services/achievementService';
import { useAuthStore } from '../../store';

const ICONS = { Target, CheckCircle, BookOpen };

export default function DailyChallenges() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ attempts: 0, correct: 0, lessons: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    achievementService.getTodayStudyStats(user.uid).then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, [user]);

  const getProgress = (challenge) => {
    const value =
      challenge.metric === 'attempts'
        ? stats.attempts
        : challenge.metric === 'correct'
          ? stats.correct
          : stats.lessons;
    return Math.min(value, challenge.target);
  };

  const allComplete = DAILY_CHALLENGES.every(
    (c) => getProgress(c) >= c.target
  );

  if (loading) {
    return (
      <div className="card animate-pulse h-32" />
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="text-primary-500" size={22} />
          Desafios de Hoje
        </h3>
        {allComplete && (
          <span className="text-xs font-semibold text-green-600 dark:text-green-400">
            Todos completos!
          </span>
        )}
      </div>
      <div className="space-y-3">
        {DAILY_CHALLENGES.map((challenge) => {
          const Icon = ICONS[challenge.icon] || Target;
          const current = getProgress(challenge);
          const done = current >= challenge.target;
          const pct = Math.min((current / challenge.target) * 100, 100);

          return (
            <div
              key={challenge.id}
              className={`p-3 rounded-lg border ${
                done
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon
                  size={18}
                  className={done ? 'text-green-600' : 'text-primary-600'}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {challenge.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {challenge.description}
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary-600 shrink-0">
                  +{challenge.xpBonus} XP
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${done ? 'bg-green-500' : 'bg-primary-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 w-10 text-right">
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
