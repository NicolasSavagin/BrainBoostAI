import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Sparkles, 
  BookOpen, 
  Lightbulb,
  Brain,
  TrendingUp,
  Calendar,
  Loader2
} from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../store';
import tutorService from '../services/tutorService';

export default function Tutor() {
  const { user, userProfile } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [showStudyPlan, setShowStudyPlan] = useState(false);
  const [studyPlan, setStudyPlan] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadChatHistory();
      loadSuggestions();
      loadPerformance();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await tutorService.getChatHistory(user.uid);
      
      if (history.length === 0) {
        // Mensagem de boas-vindas
        setMessages([{
          role: 'assistant',
          content: `Olá, ${userProfile?.displayName || 'estudante'}! 👋

Sou seu tutor virtual e estou aqui para te ajudar em sua jornada de aprendizado! 

Posso te auxiliar com:
- Explicações sobre conceitos difíceis
- Dicas de estudo personalizadas
- Análise do seu desempenho
- Motivação e orientação

Como posso te ajudar hoje?`,
          timestamp: new Date().toISOString()
        }]);
      } else {
        setMessages(history);
      }

    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const sugg = await tutorService.generateQuestionSuggestions(user.uid);
      setSuggestions(sugg);
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
    }
  };

  const loadPerformance = async () => {
    try {
      const perf = await tutorService.analyzeStudentPerformance(user.uid);
      setPerformance(perf);
    } catch (error) {
      console.error('Erro ao carregar desempenho:', error);
    }
  };

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Salvar mensagem do usuário
      await tutorService.saveChatMessage(user.uid, 'user', messageText);

      // Obter resposta do tutor
      const response = await tutorService.getTutorResponse(
        user.uid,
        messageText,
        messages
      );

      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Salvar resposta do tutor
      await tutorService.saveChatMessage(user.uid, 'assistant', response);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      addNotification({
        type: 'error',
        message: 'Erro ao obter resposta do tutor. Verifique sua API key.'
      });

      // Mensagem de erro amigável
      const errorMessage = {
        role: 'assistant',
        content: 'Desculpe, tive um problema técnico. Pode tentar novamente? 😅',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);

    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const generateStudyPlan = async () => {
    try {
      setLoading(true);
      
      const plan = await tutorService.generateStudyPlan(
        user.uid,
        ['Melhorar desempenho geral', 'Fortalecer pontos fracos'],
        30 // 30 minutos por dia
      );

      setStudyPlan(plan);
      setShowStudyPlan(true);

      addNotification({
        type: 'success',
        message: 'Plano de estudos gerado com sucesso!'
      });

    } catch (error) {
      console.error('Erro ao gerar plano:', error);
      addNotification({
        type: 'error',
        message: 'Erro ao gerar plano de estudos'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando conversa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      
      {/* Sidebar - Performance */}
      <div className="hidden lg:block w-80 space-y-4">
        
        {/* Performance Card */}
        {performance && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-primary-600" size={20} />
              Seu Desempenho
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Nível</span>
                <span className="font-semibold text-gray-900 dark:text-white capitalize">
                  {performance.level}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Precisão</span>
                <span className="font-semibold text-primary-600">
                  {performance.overallAccuracy}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tentativas</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {performance.attempts}
                </span>
              </div>

              {performance.strengths.length > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Pontos Fortes
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {performance.strengths.map((s, idx) => (
                      <span 
                        key={idx}
                        className="badge bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {performance.weaknesses.length > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Áreas de Melhoria
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {performance.weaknesses.map((w, idx) => (
                      <span 
                        key={idx}
                        className="badge bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Study Plan Button */}
        <button
          onClick={generateStudyPlan}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Calendar size={18} />
          Gerar Plano de Estudos
        </button>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Lightbulb className="text-yellow-500" size={20} />
            Ações Rápidas
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => sendMessage('Como posso melhorar meu desempenho?')}
              className="w-full text-left text-sm p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              💪 Dicas de melhoria
            </button>
            <button
              onClick={() => sendMessage('Analise meu progresso recente')}
              className="w-full text-left text-sm p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              📊 Analisar progresso
            </button>
            <button
              onClick={() => sendMessage('Me ajude a manter a motivação')}
              className="w-full text-left text-sm p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              🚀 Motivação
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col card p-0 overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-full">
              <Brain className="text-primary-600 dark:text-primary-400" size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Tutor Virtual
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sempre disponível para te ajudar
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-primary-600 dark:text-primary-400" />
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                      Tutor
                    </span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && suggestions.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Sugestões de perguntas:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(suggestion)}
                  className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1 input-field resize-none"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || loading}
              className="btn-primary px-4 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Study Plan Modal */}
      {showStudyPlan && studyPlan && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowStudyPlan(false)}
        >
          <div 
            className="card max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="text-primary-600" size={28} />
                Seu Plano de Estudos
              </h2>
              <button
                onClick={() => setShowStudyPlan(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Weekly Plan */}
              {studyPlan.weeklyPlan?.map((day, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                    {day.day}
                  </h3>
                  <p className="text-sm text-primary-600 dark:text-primary-400 mb-3">
                    Foco: {day.focus}
                  </p>

                  <div className="space-y-2">
                    {day.activities?.map((activity, actIdx) => (
                      <div 
                        key={actIdx}
                        className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-1">
                          {activity.time}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.activity}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {activity.topic}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    🎯 {day.goal}
                  </p>
                </div>
              ))}

              {/* Tips */}
              {studyPlan.tips && studyPlan.tips.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Lightbulb className="text-yellow-500" size={20} />
                    Dicas Personalizadas
                  </h3>
                  <ul className="space-y-2">
                    {studyPlan.tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <span>•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Motivation */}
              {studyPlan.motivation && (
                <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 text-center">
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    💪 {studyPlan.motivation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}