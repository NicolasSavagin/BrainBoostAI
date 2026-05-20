// src/pages/Progress.jsx - VERSÃO MELHORADA

import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Award, Calendar, Target, Activity, Zap, BookOpen } from 'lucide-react';
import { useAuthStore } from '../store';
import exerciseService from '../services/exerciseService';
import streakService from '../services/streakService';
import aiService from '../services/aiService';

export default function Progress() {
  const { user, userProfile } = useAuthStore();
  const [weeklyData, setWeeklyData] = useState([]);
  const [topicData, setTopicData] = useState([]);
  const [streakHistory, setStreakHistory] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAllProgress();
    }
  }, [user]);

  const loadAllProgress = async () => {
    try {
      setLoading(true);

      // Buscar dados dos últimos 30 dias
      const [attempts, history] = await Promise.all([
        exerciseService.getUserAttempts(user.uid, 100),
        streakService.getStreakHistory(user.uid, 30)
      ]);

      // Processar dados semanais (últimos 7 dias)
      const last7Days = generateLast7Days();
      const weeklyStats = last7Days.map(day => {
        const dayAttempts = attempts.filter(a => {
          const attemptDate = new Date(a.timestamp).toDateString();
          return attemptDate === day.date.toDateString();
        });

        const correct = dayAttempts.filter(a => a.isCorrect).length;

        return {
          day: day.label,
          xp: dayAttempts.reduce((sum, a) => sum + (a.isCorrect ? 10 : 2), 0),
          exercicios: dayAttempts.length,
          acertos: correct,
          accuracy: dayAttempts.length > 0 ? Math.round((correct / dayAttempts.length) * 100) : 0,
        };
      });

      setWeeklyData(weeklyStats);

      // Processar dados por tópico
      const topicMap = {};
      attempts.forEach(attempt => {
        if (!topicMap[attempt.topic]) {
          topicMap[attempt.topic] = { total: 0, correct: 0 };
        }
        topicMap[attempt.topic].total++;
        if (attempt.isCorrect) {
          topicMap[attempt.topic].correct++;
        }
      });

      const topicStats = Object.entries(topicMap).map(([topic, stats]) => ({
        subject: topic.split(' - ')[0], // Pega só "Programação" de "Programação - JavaScript"
        progress: Math.round((stats.correct / stats.total) * 100),
        total: stats.total,
        correct: stats.correct,
      }));

      setTopicData(topicStats);

      setStreakHistory(history);
      setRecentAttempts(attempts);
      loadAiInsights(attempts);

    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAiInsights = async (attempts) => {
    try {
      setInsightsLoading(true);
      const insights = await aiService.analyzeProgress(
        {
          accuracy: userProfile?.accuracy || 0,
          completed: userProfile?.completedExercises || 0,
          level: userProfile?.level || 1,
          streak: userProfile?.streak || 0,
        },
        attempts
      );
      setAiInsights(insights);
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      setAiInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  };

  const generateLast7Days = () => {
    const days = [];
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date,
        label: weekdays[date.getDay()],
      });
    }
    return days;
  };

  const stats = [
    {
      icon: TrendingUp,
      label: "Taxa de Acerto",
      value: `${userProfile?.accuracy || 0}%`,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      trend: null
    },
    {
      icon: Award,
      label: "Conquistas",
      value: userProfile?.achievements?.length || 0,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      trend: null
    },
    {
      icon: Calendar,
      label: "Dias de Streak",
      value: userProfile?.streak || 0,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      trend: userProfile?.streak > 0 ? "🔥" : null
    },
    {
      icon: Target,
      label: "Exercícios Completos",
      value: userProfile?.completedExercises || 0,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      trend: null
    },
  ];

  const totalXPWeek = weeklyData.reduce((sum, day) => sum + day.xp, 0);
  const totalExercisesWeek = weeklyData.reduce((sum, day) => sum + day.exercicios, 0);
  const avgAccuracy = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((sum, day) => sum + day.accuracy, 0) / weeklyData.filter(d => d.exercicios > 0).length)
    : 0;

  // Cores para gráfico de pizza
  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando progresso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Seu Progresso
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Análise detalhada da sua evolução
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="card hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={stat.color} size={24} />
                </div>
                {stat.trend && (
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Resumo Semanal Expandido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-primary-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              XP Semanal
            </h3>
          </div>
          <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
            {totalXPWeek}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Média de {Math.round(totalXPWeek / 7)} XP/dia
          </p>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {totalXPWeek > 700 ? '🚀 Excelente semana!' : 'Continue praticando!'}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Target className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Precisão
            </h3>
          </div>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">
            {avgAccuracy}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {avgAccuracy > 80 ? 'Nível Expert 🎯' : avgAccuracy > 60 ? 'Bom desempenho' : 'Pratique mais'}
          </p>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-500">Meta: 80%</span>
              <span className={`font-semibold ${avgAccuracy >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                {avgAccuracy >= 80 ? '✓' : `${80 - avgAccuracy}% faltando`}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-purple-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Exercícios
            </h3>
          </div>
          <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
            {totalExercisesWeek}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Esta semana
          </p>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {totalExercisesWeek > 35 ? '🏆 Semana produtiva!' : 'Meta: 35 exercícios/semana'}
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de XP e Exercícios */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Atividade Semanal
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="day" 
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Legend />
              <Bar dataKey="exercicios" fill="#3B82F6" name="Exercícios" radius={[8, 8, 0, 0]} />
              <Bar dataKey="acertos" fill="#10B981" name="Acertos" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Precisão */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Evolução da Precisão
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="day" 
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 5 }}
                activeDot={{ r: 7 }}
                name="Precisão (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribuição por Tópico */}
      {topicData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Gráfico de Pizza */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Distribuição de Exercícios
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topicData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ subject, total }) => `${subject}: ${total}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {topicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Lista de Progresso por Tópico */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Desempenho por Tópico
            </h3>
            <div className="space-y-4">
              {topicData.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {item.subject}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                        ({item.correct}/{item.total})
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {item.progress}%
                    </span>
                  </div>
                  <div className="progress-bar h-3">
                    <div 
                      className={`h-full rounded-full transition-all duration-500`}
                      style={{ 
                        width: `${item.progress}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Streak Calendar Visualization */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="text-orange-500" size={24} />
          Histórico de Streak (Últimos 30 dias)
        </h3>
        <div className="grid grid-cols-10 gap-2">
          {Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            const hasStreak = streakHistory.some(h => {
              const histDate = new Date(h.timestamp).toDateString();
              return histDate === date.toDateString() && !h.wasBroken;
            });

            return (
              <div
                key={i}
                className={`aspect-square rounded flex items-center justify-center text-xs font-semibold transition-all ${
                  hasStreak
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}
                title={date.toLocaleDateString('pt-BR')}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Com Atividade</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Sem Atividade</span>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <Zap className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Insights com IA</h3>
              <p className="text-xs text-gray-500">Análise personalizada do seu desempenho</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadAiInsights(recentAttempts)}
            disabled={insightsLoading}
            className="btn-secondary text-sm"
          >
            {insightsLoading ? 'Analisando...' : 'Atualizar'}
          </button>
        </div>

        {insightsLoading && !aiInsights ? (
          <p className="text-sm text-gray-500">Gerando análise com Gemini...</p>
        ) : aiInsights ? (
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            {aiInsights.motivationalMessage && (
              <p className="font-medium text-primary-700 dark:text-primary-300">
                {aiInsights.motivationalMessage}
              </p>
            )}
            {aiInsights.insights?.length > 0 && (
              <ul className="space-y-2">
                {aiInsights.insights.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            {aiInsights.nextSteps?.length > 0 && (
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Próximos passos</p>
                <ul className="space-y-1">
                  {aiInsights.nextSteps.map((step, i) => (
                    <li key={i}>→ {step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• Você completou <strong>{totalExercisesWeek}</strong> exercícios esta semana</li>
            <li>• Precisão média: <strong>{avgAccuracy}%</strong></li>
          </ul>
        )}
      </div>
    </div>
  );
}