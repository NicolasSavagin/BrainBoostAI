import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

class AIService {

  async generateBattleQuestions(topic, difficulty, count = 5) {
    try {
      const prompt = `Gere exatamente ${count} perguntas de múltipla escolha para uma batalha educacional.

Tópico: ${topic}
Dificuldade: ${difficulty} (1=fácil, 5=difícil)

Retorne APENAS JSON válido:
{
  "questions": [
    {
      "question": "texto da pergunta",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "resposta exata igual a uma das options",
      "explanation": "breve explicação"
    }
  ]
}`;

      const result = await this.generateJSON(prompt);
      return result.questions || [];
    } catch (error) {
      console.error('Error generating battle questions:', error);
      throw error;
    }
  }

  async generateExercise(topic, difficulty, type, userLevel) {
    try {
      const prompt = this.buildExercisePrompt(topic, difficulty, type, userLevel);
      return await this.generateJSON(prompt);
    } catch (error) {
      console.error('Error generating exercise:', error);
      throw error;
    }
  }

  buildExercisePrompt(topic, difficulty, type, userLevel) {
    return `Você é um tutor de ensino adaptativo. Gere um exercício educacional.

Tópico: ${topic}
Dificuldade: ${difficulty} (1-5)
Tipo: ${type}
Nível do Usuário: ${userLevel}

Retorne APENAS JSON válido:

{
  "question": "pergunta",
  "type": "${type}",
  "difficulty": ${difficulty},
  "options": ["opção 1", "opção 2", "opção 3", "opção 4"],
  "correctAnswer": "resposta correta",
  "explanation": "explicação",
  "hints": ["dica 1", "dica 2"],
  "xpReward": 50,
  "topic": "${topic}",
  "estimatedTime": 5
}`;
  }

  async provideFeedback(userAnswer, correctAnswer, question) {
    try {
      const prompt = `Analise a resposta e retorne JSON:

Pergunta: ${question}
Resposta do aluno: ${userAnswer}
Resposta correta: ${correctAnswer}

{
  "isCorrect": true,
  "feedback": "explicação",
  "suggestions": ["dica"],
  "relatedConcepts": ["conceito"]
}`;

      return await this.generateJSON(prompt);

    } catch (error) {
      console.error('Error providing feedback:', error);
      throw error;
    }
  }

  async generateLearningPath(userProfile, goals, weaknesses) {
    try {
      const prompt = `Crie plano de estudos em JSON:

Nível: ${userProfile.level}
XP: ${userProfile.totalXP}

Objetivos: ${goals.join(', ')}
Dificuldades: ${weaknesses.join(', ')}

{
  "weeklyPlan": [
    {
      "day": 1,
      "topics": ["..."],
      "exercises": 5,
      "focusArea": "...",
      "estimatedTime": 30,
      "goals": ["..."]
    }
  ],
  "milestones": [
    {
      "week": 1,
      "goal": "...",
      "metrics": ["..."]
    }
  ],
  "recommendations": ["..."]
}`;

      return await this.generateJSON(prompt);

    } catch (error) {
      console.error('Error generating learning path:', error);
      throw error;
    }
  }

  async analyzeProgress(userStats, recentExercises = []) {
    try {
      const exerciseSummary = recentExercises.slice(0, 15).map((e) => ({
        topic: e.topic,
        correct: e.isCorrect,
        date: e.timestamp,
      }));

      const prompt = `Você é um tutor educacional. Analise o progresso do aluno e responda APENAS JSON válido em português.

Dados:
- Taxa de acerto: ${userStats.accuracy}%
- Exercícios completados: ${userStats.completed}
- Nível: ${userStats.level || 1}
- Streak: ${userStats.streak || 0} dias
- Últimos exercícios: ${JSON.stringify(exerciseSummary)}

{
  "overallPerformance": "excellent|good|average|needs_improvement",
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "weaknesses": ["área a melhorar 1"],
  "insights": ["insight personalizado 1", "insight 2"],
  "nextSteps": ["próximo passo 1", "próximo passo 2"],
  "motivationalMessage": "mensagem motivacional curta"
}`;

      return await this.generateJSON(prompt);

    } catch (error) {
      console.error('Error analyzing progress:', error);
      throw error;
    }
  }

  async chatWithTutor(conversationHistory, currentQuestion) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash"
      });

      const chat = model.startChat({
        history: conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      });

      const result = await chat.sendMessage(currentQuestion);
      return result.response.text();

    } catch (error) {
      console.error('Error in tutor chat:', error);
      throw error;
    }
  }

  // 🔥 FUNÇÃO CENTRAL (ANTI-ERRO)
  async generateJSON(prompt) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash"
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Proteção contra resposta inválida
      const match = text.match(/\{[\s\S]*\}/);

      if (!match) {
        throw new Error("Resposta inválida da IA");
      }

      return JSON.parse(match[0]);

    } catch (error) {
      console.error("Erro no Gemini:", error);
      throw error;
    }
  }
}

export default new AIService();