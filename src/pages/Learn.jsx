import { useState, useEffect } from 'react';
import { BookOpen, Brain, Code, Globe, Calculator, Palette, Lock, CheckCircle, ArrowRight, PlayCircle } from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../store';
import lessonService from '../services/lessonService';
import { useNavigate } from 'react-router-dom';

export default function Learn() {
  const { user, userProfile } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({});
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  const topicsConfig = {
    'Programação': {
      icon: Code,
      color: 'bg-blue-500',
      description: 'Aprenda linguagens de programação modernas'
    },
    'Matemática': {
      icon: Calculator,
      color: 'bg-green-500',
      description: 'Domine conceitos matemáticos fundamentais'
    },
    'Inglês': {
      icon: Globe,
      color: 'bg-purple-500',
      description: 'Desenvolva fluência no idioma inglês'
    }
  };

  useEffect(() => {
    if (user) {
      loadUserProgress();
      loadRecommendation();
    }
  }, [user]);

  const loadUserProgress = async () => {
    try {
      setLoading(true);

      // Inicializar progresso se for primeira vez
      await lessonService.initializeUserProgress(user.uid);

      // Carregar progresso
      const progress = await lessonService.getUserProgress(user.uid);
      setUserProgress(progress);

    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendation = async () => {
    try {
      const rec = await lessonService.getRecommendedLesson(user.uid);
      setRecommendation(rec);
    } catch (error) {
      console.error('Erro ao carregar recomendação:', error);
    }
  };

  const calculateTopicProgress = (topic) => {
    const subtopics = userProgress[topic] || [];
    if (subtopics.length === 0) return 0;

    const total = subtopics.reduce((sum, s) => sum + s.progress, 0);
    return Math.round(total / subtopics.length);
  };

  const getCompletedLessons = (topic) => {
    const subtopics = userProgress[topic] || [];
    return subtopics.reduce((sum, s) => sum + s.completedLessons, 0);
  };

  const getTotalLessons = (topic) => {
    const subtopics = userProgress[topic] || [];
    return subtopics.reduce((sum, s) => sum + s.totalLessons, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando suas lições...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Aprender
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sistema de lições progressivo com IA
        </p>
      </div>

      {/* Recomendação da IA */}
      {recommendation && (
        <div className="card bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-primary-200 dark:border-primary-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <Brain className="text-primary-600 dark:text-primary-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Continue de onde parou
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                <strong>{recommendation.subtopic}</strong> - Lição {recommendation.nextLesson} de {recommendation.totalLessons}
              </p>
              <button 
                onClick={() => navigate(`/lesson/${recommendation.subtopicId}/${recommendation.nextLesson}`)}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <PlayCircle size={16} />
                Continuar Aprendendo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Tópicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(topicsConfig).map(([topicName, config]) => {
          const Icon = config.icon;
          const progress = calculateTopicProgress(topicName);
          const completed = getCompletedLessons(topicName);
          const total = getTotalLessons(topicName);

          return (
            <div
              key={topicName}
              className="card hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
              onClick={() => setSelectedTopic(topicName)}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 ${config.color} rounded-xl`}>
                  <Icon className="text-white" size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {topicName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {completed} de {total} lições
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {config.description}
              </p>

              <div className="mb-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Progresso</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {progress}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Subtópicos */}
      {selectedTopic && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTopic(null)}
        >
          <div 
            className="card max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedTopic}
              </h2>
              <button
                onClick={() => setSelectedTopic(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {(userProgress[selectedTopic] || [])
                .sort((a, b) => {
                  const aData = lessonService.topics[selectedTopic]?.subtopics.find(s => s.id === a.subtopicId);
                  const bData = lessonService.topics[selectedTopic]?.subtopics.find(s => s.id === b.subtopicId);
                  return (aData?.order || 0) - (bData?.order || 0);
                })
                .map((subtopic) => (
                  <div
                    key={subtopic.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      subtopic.isUnlocked
                        ? 'border-gray-200 dark:border-gray-700 hover:border-primary-500 cursor-pointer'
                        : 'border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (subtopic.isUnlocked) {
                        const nextLesson = subtopic.completedLessons + 1;
                        if (nextLesson <= subtopic.totalLessons) {
                          navigate(`/lesson/${subtopic.subtopicId}/${nextLesson}`);
                        } else {
                          addNotification({
                            type: 'info',
                            message: 'Você já completou todas as lições deste subtópico! 🎉'
                          });
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {subtopic.isUnlocked ? (
                          <CheckCircle className="text-green-500" size={20} />
                        ) : (
                          <Lock className="text-gray-400" size={20} />
                        )}
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {subtopic.subtopicName}
                        </h3>
                      </div>
                      {subtopic.progress === 100 && (
                        <span className="badge bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs">
                          Completo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        {subtopic.completedLessons} de {subtopic.totalLessons} lições
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {subtopic.progress}%
                      </span>
                    </div>

                    <div className="progress-bar h-2">
                      <div 
                        className="progress-fill"
                        style={{ width: `${subtopic.progress}%` }}
                      ></div>
                    </div>

                    {!subtopic.isUnlocked && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Complete o subtópico anterior para desbloquear
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}