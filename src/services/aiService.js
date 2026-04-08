import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

class AIService {

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

  async analyzeProgress(userStats, recentExercises) {
    try {
      const prompt = `Analise progresso em JSON:

Taxa de acerto: ${userStats.accuracy}
Exercícios: ${userStats.completed}

{
  "overallPerformance": "good",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "insights": ["..."],
  "nextSteps": ["..."],
  "motivationalMessage": "..."
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