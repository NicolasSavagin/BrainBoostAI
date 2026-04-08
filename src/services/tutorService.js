import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import aiService from './aiService';
import exerciseService from './exerciseService';

class TutorService {
  
  // 🔥 Analisar desempenho do aluno e gerar insights
  async analyzeStudentPerformance(userId) {
    try {
      // Buscar últimas 20 tentativas
      const attempts = await exerciseService.getUserAttempts(userId, 20);
      
      if (attempts.length === 0) {
        return {
          level: 'beginner',
          strengths: [],
          weaknesses: [],
          recommendation: 'Comece fazendo alguns exercícios para que eu possa te conhecer melhor!',
          motivation: 'Estou animado para começar esta jornada com você! 🚀'
        };
      }

      // Análise por tópico
      const topicStats = {};
      
      attempts.forEach(attempt => {
        if (!topicStats[attempt.topic]) {
          topicStats[attempt.topic] = { correct: 0, total: 0 };
        }
        topicStats[attempt.topic].total++;
        if (attempt.isCorrect) {
          topicStats[attempt.topic].correct++;
        }
      });

      // Identificar pontos fortes e fracos
      const strengths = [];
      const weaknesses = [];

      Object.entries(topicStats).forEach(([topic, stats]) => {
        const accuracy = (stats.correct / stats.total) * 100;
        
        if (accuracy >= 75) {
          strengths.push(topic);
        } else if (accuracy < 50) {
          weaknesses.push(topic);
        }
      });

      // Calcular nível geral
      const overallAccuracy = attempts.filter(a => a.isCorrect).length / attempts.length * 100;
      
      let level = 'beginner';
      if (overallAccuracy >= 80) level = 'advanced';
      else if (overallAccuracy >= 60) level = 'intermediate';

      return {
        level,
        strengths,
        weaknesses,
        attempts: attempts.length,
        overallAccuracy: Math.round(overallAccuracy),
        topicStats
      };

    } catch (error) {
      console.error('❌ Erro ao analisar desempenho:', error);
      return null;
    }
  }

  // 🔥 Gerar resposta personalizada do tutor
  async getTutorResponse(userId, userMessage, conversationHistory) {
    try {
      // Analisar desempenho do aluno
      const performance = await this.analyzeStudentPerformance(userId);

      // Construir contexto para a IA
      const systemContext = `Você é um tutor educacional paciente, motivador e experiente.

PERFIL DO ALUNO:
- Nível: ${performance?.level || 'iniciante'}
- Precisão geral: ${performance?.overallAccuracy || 0}%
- Tentativas totais: ${performance?.attempts || 0}
- Pontos fortes: ${performance?.strengths?.join(', ') || 'A descobrir'}
- Áreas de melhoria: ${performance?.weaknesses?.join(', ') || 'A descobrir'}

SUAS DIRETRIZES:
1. Seja encorajador e motivador, especialmente quando o aluno errar
2. Use exemplos práticos e analogias simples
3. Não dê respostas diretas - use método socrático (faça perguntas que guiem o aluno)
4. Celebre conquistas, mesmo pequenas
5. Sugira tópicos com base nos pontos fracos identificados
6. Seja conciso - respostas de 2-4 parágrafos no máximo
7. Use emojis ocasionalmente para tornar a conversa amigável
8. Adapte a linguagem ao nível do aluno

ESTILO DE CONVERSAÇÃO:
- Iniciante: Explicações muito simples, passo a passo
- Intermediário: Conceitos mais profundos, faça conexões
- Avançado: Discussões teóricas, desafios complexos`;

      // Preparar histórico de conversação
      const messages = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.content
      }));

      // Adicionar contexto do sistema
      messages.unshift({
        role: 'model',
        content: systemContext
      });

      // Adicionar mensagem atual
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Chamar IA
      const response = await aiService.chatWithTutor(messages, userMessage);

      return response;

    } catch (error) {
      console.error('❌ Erro ao gerar resposta do tutor:', error);
      throw error;
    }
  }

  // 🔥 Salvar conversa no histórico
  async saveChatMessage(userId, role, content) {
    try {
      await addDoc(collection(db, 'tutorChats'), {
        userId,
        role, // 'user' ou 'assistant'
        content,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Erro ao salvar mensagem:', error);
    }
  }

  // 🔥 Buscar histórico de conversas
  async getChatHistory(userId, limitCount = 50) {
    try {
      const q = query(
        collection(db, 'tutorChats'),
        where('userId', '==', userId),
        orderBy('timestamp', 'asc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      return [];
    }
  }

  // 🔥 Gerar sugestões de perguntas baseadas no perfil
  async generateQuestionSuggestions(userId) {
    try {
      const performance = await this.analyzeStudentPerformance(userId);

      const suggestions = [];

      // Sugestões baseadas em pontos fracos
      if (performance?.weaknesses && performance.weaknesses.length > 0) {
        suggestions.push(
          `Como posso melhorar em ${performance.weaknesses[0]}?`,
          `Me explica conceitos básicos de ${performance.weaknesses[0]}`
        );
      }

      // Sugestões baseadas em pontos fortes
      if (performance?.strengths && performance.strengths.length > 0) {
        suggestions.push(
          `Quais exercícios avançados de ${performance.strengths[0]} você recomenda?`
        );
      }

      // Sugestões gerais
      suggestions.push(
        'Como posso organizar melhor meus estudos?',
        'Qual a melhor forma de revisar o conteúdo?',
        'Me dê dicas de como manter a motivação'
      );

      return suggestions.slice(0, 4); // Retorna 4 sugestões

    } catch (error) {
      console.error('❌ Erro ao gerar sugestões:', error);
      return [
        'Como posso melhorar meu desempenho?',
        'Quais tópicos devo focar?',
        'Me dê dicas de estudo',
        'Como funciona o sistema de XP?'
      ];
    }
  }

  // 🔥 Gerar plano de estudos personalizado
  async generateStudyPlan(userId, goals, availableTimePerDay) {
    try {
      const performance = await this.analyzeStudentPerformance(userId);
      const weakTopics = await exerciseService.getWeakTopics(userId);

      const prompt = `Crie um plano de estudos personalizado em JSON:

PERFIL DO ALUNO:
- Nível: ${performance?.level || 'iniciante'}
- Precisão: ${performance?.overallAccuracy || 0}%
- Pontos fracos: ${weakTopics.map(t => t.topic).join(', ') || 'Nenhum identificado'}

OBJETIVOS: ${goals.join(', ')}
TEMPO DISPONÍVEL: ${availableTimePerDay} minutos por dia

Retorne APENAS um JSON válido:

{
  "weeklyPlan": [
    {
      "day": "Segunda-feira",
      "focus": "Tópico principal do dia",
      "activities": [
        {
          "time": "10 min",
          "activity": "Revisão de conceitos",
          "topic": "Nome do tópico"
        },
        {
          "time": "15 min",
          "activity": "Exercícios práticos",
          "topic": "Nome do tópico"
        }
      ],
      "goal": "Objetivo do dia"
    }
  ],
  "tips": [
    "Dica 1 personalizada",
    "Dica 2 personalizada"
  ],
  "motivation": "Mensagem motivacional"
}`;

      const plan = await aiService.generateJSON(prompt);
      return plan;

    } catch (error) {
      console.error('❌ Erro ao gerar plano:', error);
      throw error;
    }
  }
}

export default new TutorService();