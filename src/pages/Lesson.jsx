import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, XCircle, ArrowRight, ArrowLeft, Award } from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../store';
import lessonService from '../services/lessonService';
import authService from '../services/authService';

export default function Lesson() {
  const { subtopicId, lessonNumber } = useParams();
  const navigate = useNavigate();
  const { user, userProfile, setUserProfile } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    if (user && subtopicId && lessonNumber) {
      generateLesson();
    }
  }, [user, subtopicId, lessonNumber]);

  const generateLesson = async () => {
    try {
      setLoading(true);

      const lessonData = await lessonService.generateLesson(
        subtopicId,
        parseInt(lessonNumber),
        userProfile?.level || 1
      );

      setLesson(lessonData);

    } catch (error) {
      console.error('Erro ao gerar lição:', error);
      addNotification({
        type: 'error',
        message: 'Erro ao carregar lição. Verifique sua API key.'
      });
    } finally {
      setLoading(false);
    }
  };

  const nextSection = () => {
    if (currentSection < lesson.content.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setQuizMode(true);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const answerQuiz = (answer) => {
    const newAnswers = [...quizAnswers];
    newAnswers[currentQuiz] = answer;
    setQuizAnswers(newAnswers);
  };

  const nextQuiz = () => {
    if (currentQuiz < lesson.quiz.length - 1) {
      setCurrentQuiz(currentQuiz + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    let correct = 0;

    lesson.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) {
        correct++;
      }
    });

    const score = Math.round((correct / lesson.quiz.length) * 100);
    setQuizScore(score);
    setShowQuizResult(true);

    // 🔥 Salvar progresso
    try {
      await lessonService.completeLesson(
        user.uid,
        subtopicId,
        parseInt(lessonNumber),
        score
      );

      // Adicionar XP
      const xpGain = score >= 70 ? 50 : 20;

      const updatedProfile = {
        ...userProfile,
        totalXP: (userProfile?.totalXP || 0) + xpGain,
        xp: (userProfile?.xp || 0) + xpGain,
      };

      await authService.updateUserProfile(user.uid, updatedProfile);
      setUserProfile(updatedProfile);

      addNotification({
        type: 'success',
        message: `Lição concluída! +${xpGain} XP`
      });

    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Gerando sua lição...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Erro ao carregar lição</p>
        <button onClick={() => navigate('/learn')} className="btn-primary mt-4">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {lesson.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Lição {lessonNumber} • {lesson.subtopicName}
            </p>
          </div>
          <BookOpen className="text-primary-600" size={32} />
        </div>
      </div>

      {/* Objective */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          🎯 Objetivo da Lição
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          {lesson.objective}
        </p>
      </div>

      {/* Content or Quiz */}
      {!quizMode ? (
        <>
          {/* Content Section */}
          <div className="card min-h-[400px]">
            {lesson.content[currentSection] && (
              <div>
                {lesson.content[currentSection].type === 'text' && (
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                      {lesson.content[currentSection].data}
                    </p>
                  </div>
                )}

                {lesson.content[currentSection].type === 'example' && (
                  <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg border-l-4 border-primary-500">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      💡 Exemplo
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {lesson.content[currentSection].data}
                    </p>
                  </div>
                )}

                {lesson.content[currentSection].type === 'tip' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border-l-4 border-yellow-500">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      ⭐ Dica Importante
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {lesson.content[currentSection].data}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevSection}
              disabled={currentSection === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowLeft size={20} />
              Anterior
            </button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentSection + 1} de {lesson.content.length}
            </span>

            <button
              onClick={nextSection}
              className="btn-primary flex items-center gap-2"
            >
              {currentSection === lesson.content.length - 1 ? 'Fazer Quiz' : 'Próximo'}
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      ) : !showQuizResult ? (
        <>
          {/* Quiz */}
          <div className="card min-h-[400px]">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Questão {currentQuiz + 1} de {lesson.quiz.length}
            </h3>

            <p className="text-lg text-gray-800 dark:text-gray-200 mb-6">
              {lesson.quiz[currentQuiz].question}
            </p>

            <div className="space-y-3">
              {lesson.quiz[currentQuiz].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => answerQuiz(option)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    quizAnswers[currentQuiz] === option
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuiz(Math.max(0, currentQuiz - 1))}
              disabled={currentQuiz === 0}
              className="btn-secondary disabled:opacity-50"
            >
              Anterior
            </button>

            <button
              onClick={nextQuiz}
              disabled={!quizAnswers[currentQuiz]}
              className="btn-primary disabled:opacity-50"
            >
              {currentQuiz === lesson.quiz.length - 1 ? 'Finalizar' : 'Próxima'}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Quiz Result */}
          <div className={`card text-center py-12 ${
            quizScore >= 70
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
          }`}>
            {quizScore >= 70 ? (
              <CheckCircle className="text-green-600 w-16 h-16 mx-auto mb-4" />
            ) : (
              <XCircle className="text-orange-600 w-16 h-16 mx-auto mb-4" />
            )}

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {quizScore}%
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {quizScore >= 70
                ? '🎉 Parabéns! Você passou na lição!'
                : '😊 Continue tentando! Você pode refazer a lição.'}
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/learn')}
                className="btn-secondary"
              >
                Voltar
              </button>

              {quizScore >= 70 ? (
                <button
                  onClick={() => navigate(`/lesson/${subtopicId}/${parseInt(lessonNumber) + 1}`)}
                  className="btn-primary flex items-center gap-2"
                >
                  Próxima Lição
                  <ArrowRight size={20} />
                </button>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary"
                >
                  Refazer Lição
                </button>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              📝 Resumo da Lição
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {lesson.summary}
            </p>
          </div>
        </>
      )}
    </div>
  );
}