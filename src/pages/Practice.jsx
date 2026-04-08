import { useState, useEffect } from 'react';
import { Target, CheckCircle, XCircle, Brain, Lightbulb, ArrowRight, TrendingUp } from 'lucide-react';
import aiService from '../services/aiService';
import authService from '../services/authService';
import exerciseService from '../services/exerciseService';
import { useAuthStore, useLearningStore, useNotificationStore } from '../store';
import skillProgressService from '../services/skillProgressService';


export default function Practice() {
  const { user, userProfile, setUserProfile } = useAuthStore();
  const { addExerciseResult } = useLearningStore();
  const { addNotification } = useNotificationStore();

  const [loading, setLoading] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [currentExerciseId, setCurrentExerciseId] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [topicStats, setTopicStats] = useState(null);
  const [adaptiveMode, setAdaptiveMode] = useState(true);

  const topics = [
    'Programação - JavaScript',
    'Programação - Python',
    'Matemática - Álgebra',
    'Matemática - Geometria',
    'Inglês - Gramática',
    'Inglês - Vocabulário',
  ];

  // 🔥 Carregar estatísticas do tópico selecionado
  useEffect(() => {
    if (selectedTopic && user) {
      loadTopicStats();
    }
  }, [selectedTopic, user]);

  const loadTopicStats = async () => {
    try {
      const stats = await exerciseService.getTopicStats(user.uid, selectedTopic);
      setTopicStats(stats);

      // Se modo adaptativo, ajusta dificuldade automaticamente
      if (adaptiveMode) {
        const adaptiveDiff = await exerciseService.getAdaptiveDifficulty(user.uid, selectedTopic);
        setDifficulty(adaptiveDiff);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const generateExercise = async () => {
    if (!selectedTopic) {
      addNotification({ type: 'warning', message: 'Selecione um tópico' });
      return;
    }

    setLoading(true);
    setShowFeedback(false);
    setUserAnswer('');

    try {
      // 🔥 Buscar exercícios já completados para evitar repetição
      const completedExercises = await exerciseService.getCompletedExercises(
        user.uid, 
        selectedTopic
      );

      // Gerar exercício com IA
      const exercise = await aiService.generateExercise(
        selectedTopic,
        difficulty,
        'multiple_choice',
        userProfile?.level || 1
      );

      // 🔥 Salvar exercício no Firestore
      const exerciseId = await exerciseService.saveExercise(user.uid, {
        ...exercise,
        topic: selectedTopic,
        difficulty,
      });

      setCurrentExercise(exercise);
      setCurrentExerciseId(exerciseId);

      addNotification({
        type: 'info',
        message: `Exercício nível ${difficulty} gerado!`
      });

    } catch (error) {
      console.error(error);
      addNotification({ 
        type: 'error', 
        message: 'Erro ao gerar exercício. Verifique sua API key.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer) return;

    setLoading(true);

    try {
      // 🔥 Gerar feedback com IA
      const feedbackData = await aiService.provideFeedback(
        userAnswer,
        currentExercise.correctAnswer,
        currentExercise.question
      );

      setFeedback(feedbackData);
      setShowFeedback(true);

      // 🔥 Salvar tentativa no Firestore
      await exerciseService.saveAttempt(user.uid, currentExerciseId, {
        userAnswer,
        correctAnswer: currentExercise.correctAnswer,
        isCorrect: feedbackData.isCorrect,
        topic: selectedTopic,
        difficulty,
        timeSpent: 0, // você pode adicionar timer depois
      });
      // 🎯 Adicionar XP à skill
      const skillMap = {
        'Programação - JavaScript': 'JavaScript',
        'Programação - Python': 'Python',
        'Matemática - Álgebra': 'Álgebra',
        'Matemática - Geometria': 'Geometria',
        'Inglês - Gramática': 'Gramática',
        'Inglês - Vocabulário': 'Vocabulário',
      };

      const skillName = skillMap[selectedTopic];
      if (skillName && feedbackData.isCorrect) {
        const skillResult = await skillProgressService.addSkillXP(
          user.uid,
          selectedTopic,
          skillName,
          xpGain
        );

        if (skillResult.leveledUp) {
          addNotification({
            type: 'success',
            message: `🎉 ${skillName} subiu para Nível ${skillResult.newLevel}!`
          });
        }
      }

      // Calcular XP
      const xpGain = feedbackData.isCorrect ? currentExercise.xpReward : 2;

      // 🔥 Atualizar perfil do usuário
      const updatedProfile = {
        ...userProfile,
        totalXP: (userProfile?.totalXP || 0) + xpGain,
        xp: (userProfile?.xp || 0) + xpGain,
        completedExercises: (userProfile?.completedExercises || 0) + 1,
      };

      // Verificar subida de nível
      const currentLevel = userProfile?.level || 1;
      const xpForNextLevel = currentLevel * 100;

      if (updatedProfile.xp >= xpForNextLevel) {
        updatedProfile.level = currentLevel + 1;
        updatedProfile.xp = updatedProfile.xp - xpForNextLevel;

        addNotification({
          type: 'success',
          message: `🎉 Parabéns! Você subiu para o Nível ${updatedProfile.level}!`
        });
      }

      // Recalcular precisão
      const attempts = await exerciseService.getUserAttempts(user.uid, 100);
      const correct = attempts.filter(a => a.isCorrect).length;
      updatedProfile.accuracy = Math.round((correct / attempts.length) * 100);

      // 🔥 Atualizar no Firebase
      await authService.updateUserProfile(user.uid, updatedProfile);

      // 🔥 Atualizar estado local
      setUserProfile(updatedProfile);

      // Histórico local
      addExerciseResult({
        exerciseId: currentExerciseId,
        topic: selectedTopic,
        correct: feedbackData.isCorrect,
        timestamp: new Date().toISOString()
      });

      // Recarregar estatísticas
      await loadTopicStats();

      addNotification({
        type: feedbackData.isCorrect ? 'success' : 'info',
        message: feedbackData.isCorrect
          ? `✅ Correto! +${xpGain} XP`
          : '❌ Resposta incorreta. Continue tentando!'
      });

    } catch (error) {
      console.error(error);
      addNotification({
        type: 'error',
        message: 'Erro ao processar resposta'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Praticar
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Exercícios personalizados com IA adaptativa
        </p>
      </div>

      {/* Topic Selection */}
      {!currentExercise && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="text-primary-600" size={24} />
            Configure seu exercício
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Escolha o tópico
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="input-field"
              >
                <option value="">Selecione um tópico</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            {/* 🔥 Mostrar estatísticas do tópico */}
            {topicStats && topicStats.total > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-600" />
                  Suas estatísticas neste tópico
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {topicStats.total}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Tentativas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {topicStats.correct}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Acertos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary-600">
                      {topicStats.accuracy}%
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Precisão</p>
                  </div>
                </div>
              </div>
            )}

            {/* Toggle Modo Adaptativo */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Modo Adaptativo</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  A IA ajusta a dificuldade automaticamente
                </p>
              </div>
              <button
                onClick={() => setAdaptiveMode(!adaptiveMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  adaptiveMode ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    adaptiveMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {!adaptiveMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dificuldade Manual: {difficulty}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Muito Fácil</span>
                  <span>Muito Difícil</span>
                </div>
              </div>
            )}

            <button
              onClick={generateExercise}
              disabled={loading || !selectedTopic}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Gerando exercício...
                </>
              ) : (
                <>
                  <Brain size={20} />
                  Gerar Exercício com IA
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Exercise Display - mantém o mesmo */}
      {currentExercise && !showFeedback && (
        <div className="card">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="badge bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                {currentExercise.topic}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Dificuldade: {'⭐'.repeat(currentExercise.difficulty)}
              </span>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {currentExercise.question}
            </h3>
          </div>

          {currentExercise.type === 'multiple_choice' && (
            <div className="space-y-3">
              {currentExercise.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setUserAnswer(option)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    userAnswer === option
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      userAnswer === option
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {userAnswer === option && (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-white">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={submitAnswer}
              disabled={!userAnswer || loading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'Confirmar Resposta'}
            </button>
            <button
              onClick={() => setCurrentExercise(null)}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Feedback - mantém o mesmo código anterior */}
      {showFeedback && feedback && (
        <div className="card">
          <div className={`flex items-start gap-4 p-4 rounded-lg mb-6 ${
            feedback.isCorrect
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            {feedback.isCorrect ? (
              <CheckCircle className="text-green-600 flex-shrink-0" size={28} />
            ) : (
              <XCircle className="text-red-600 flex-shrink-0" size={28} />
            )}
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${
                feedback.isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {feedback.isCorrect ? 'Correto! 🎉' : 'Incorreto'}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {feedback.feedback}
              </p>
            </div>
          </div>

          {currentExercise.explanation && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Lightbulb className="text-yellow-500" size={20} />
                Explicação
              </h4>
              <p className="text-gray-700 dark:text-gray-300">
                {currentExercise.explanation}
              </p>
            </div>
          )}

          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Sugestões
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                {feedback.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => {
              setCurrentExercise(null);
              setShowFeedback(false);
              setFeedback(null);
              setUserAnswer('');
            }}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            Próximo Exercício
            <ArrowRight size={20} />
          </button>
        </div>
      )}

      {/* Info Card */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Brain className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" size={24} />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Sistema Inteligente
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {adaptiveMode 
                ? 'A IA está ajustando a dificuldade baseada no seu desempenho. Continue praticando!'
                : 'Você está no modo manual. Ative o modo adaptativo para melhores resultados!'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}