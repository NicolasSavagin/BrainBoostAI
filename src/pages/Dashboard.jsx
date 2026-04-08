import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  Trophy, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Zap,
  Award,
  Clock
} from 'lucide-react';
import { useAuthStore, useLearningStore } from '../store';
import StreakWidget from '../components/common/StreakWidget';



export default function Dashboard() {
const { userProfile } = useAuthStore();
const { completedToday, dailyGoal, streak } = useLearningStore();

const accuracy = userProfile?.accuracy || 0;
const totalXP = userProfile?.totalXP || 0;
const exercises = userProfile?.completedExercises || 0;
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  const dailyProgress = (completedToday / dailyGoal) * 100;
  const levelProgress = userProfile ? (userProfile.xp / (userProfile.level * 100)) * 100 : 0;

  const stats = [
    {
      icon: Flame,
      label: 'Streak',
      value: `${streak} dias`,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      icon: Trophy,
      label: 'XP Total',
      value: userProfile?.totalXP || 0,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      icon: Target,
      label: 'Precisão',
      value: `${userProfile?.accuracy || 0}%`,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: BookOpen,
      label: 'Exercícios',
      value: userProfile?.completedExercises || 0,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
  ];

  const recentAchievements = [
    { icon: Award, title: 'Primeira Conquista', description: 'Complete seu primeiro exercício', unlocked: true },
    { icon: Flame, title: 'Streak de 3 dias', description: 'Estude por 3 dias consecutivos', unlocked: streak >= 3 },
    { icon: Zap, title: 'Rápido e Furioso', description: 'Complete 5 exercícios em um dia', unlocked: false },
  ];

  return (
    <div className="space-y-6 animate-scale-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {greeting}, {userProfile?.displayName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Continue sua jornada de aprendizado
        </p>
      </div>
<StreakWidget />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Goal */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Meta Diária
            </h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {completedToday}/{dailyGoal} exercícios
            </span>
          </div>
          <div className="progress-bar mb-2">
            <div 
              className="progress-fill"
              style={{ width: `${Math.min(dailyProgress, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {dailyProgress >= 100 
              ? '🎉 Parabéns! Meta diária completa!' 
              : `Faltam ${dailyGoal - completedToday} exercícios para completar sua meta`
            }
          </p>
        </div>

        {/* Level Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Nível {userProfile?.level || 1}
            </h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {userProfile?.xp || 0} / {(userProfile?.level || 1) * 100} XP
            </span>
          </div>
          <div className="progress-bar mb-2">
            <div 
              className="progress-fill bg-gradient-to-r from-purple-500 to-purple-600"
              style={{ width: `${Math.min(levelProgress, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {((userProfile?.level || 1) * 100 - (userProfile?.xp || 0))} XP para o próximo nível
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to="/learn"
          className="card hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
              <BookOpen className="text-primary-600 dark:text-primary-400" size={28} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Aprender
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Novos conteúdos
              </p>
            </div>
          </div>
        </Link>

        <Link 
          to="/practice"
          className="card hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
              <Target className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Praticar
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exercícios rápidos
              </p>
            </div>
          </div>
        </Link>

        <Link 
          to="/progress"
          className="card hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
              <TrendingUp className="text-purple-600 dark:text-purple-400" size={28} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Progresso
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ver análises
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Achievements */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="text-yellow-500" size={24} />
          Conquistas Recentes
        </h3>
        <div className="space-y-3">
          {recentAchievements.map((achievement, index) => {
            const Icon = achievement.icon;
            return (
              <div 
                key={index}
                className={`flex items-center gap-4 p-3 rounded-lg border ${
                  achievement.unlocked
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  achievement.unlocked 
                    ? 'bg-yellow-100 dark:bg-yellow-900/40' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  <Icon 
                    className={achievement.unlocked ? 'text-yellow-600' : 'text-gray-400'} 
                    size={20} 
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {achievement.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {achievement.description}
                  </p>
                </div>
                {achievement.unlocked && (
                  <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                    DESBLOQUEADO
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Study Reminder */}
      <div className="card bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-primary-200 dark:border-primary-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
            <Clock className="text-primary-600 dark:text-primary-400" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Lembrete de Estudo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Consistência é a chave! Continue praticando todos os dias para manter seu streak.
            </p>
            <Link 
              to="/practice"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Começar agora
              <TrendingUp size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
