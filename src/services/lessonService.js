import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import aiService from './aiService';

class LessonService {
  
  // 🔥 Estrutura de tópicos e subtópicos
  topics = {
    'Programação': {
      icon: 'Code',
      color: 'bg-blue-500',
      subtopics: [
        { id: 'js-basics', name: 'JavaScript - Fundamentos', order: 1, lessons: 5 },
        { id: 'js-dom', name: 'JavaScript - DOM', order: 2, lessons: 4 },
        { id: 'python-basics', name: 'Python - Fundamentos', order: 3, lessons: 5 },
        { id: 'react-intro', name: 'React - Introdução', order: 4, lessons: 6 },
      ]
    },
    'Matemática': {
      icon: 'Calculator',
      color: 'bg-green-500',
      subtopics: [
        { id: 'algebra-basic', name: 'Álgebra Básica', order: 1, lessons: 5 },
        { id: 'geometry', name: 'Geometria', order: 2, lessons: 4 },
        { id: 'calculus', name: 'Cálculo', order: 3, lessons: 6 },
      ]
    },
    'Inglês': {
      icon: 'Globe',
      color: 'bg-purple-500',
      subtopics: [
        { id: 'grammar-basic', name: 'Gramática Básica', order: 1, lessons: 5 },
        { id: 'vocabulary', name: 'Vocabulário', order: 2, lessons: 5 },
        { id: 'conversation', name: 'Conversação', order: 3, lessons: 4 },
      ]
    }
  };

  // 🔥 Inicializar progresso do usuário
  async initializeUserProgress(userId) {
    try {
      const progressRef = collection(db, 'userProgress');
      
      for (const [topic, data] of Object.entries(this.topics)) {
        for (const subtopic of data.subtopics) {
          // Verifica se já existe
          const q = query(
            progressRef,
            where('userId', '==', userId),
            where('subtopicId', '==', subtopic.id)
          );
          
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
            await addDoc(progressRef, {
              userId,
              topic,
              subtopicId: subtopic.id,
              subtopicName: subtopic.name,
              completedLessons: 0,
              totalLessons: subtopic.lessons,
              isUnlocked: subtopic.order === 1, // Só o primeiro desbloqueado
              progress: 0,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      console.log('✅ Progresso inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar progresso:', error);
    }
  }

  // 🔥 Buscar progresso do usuário
  async getUserProgress(userId) {
    try {
      const q = query(
        collection(db, 'userProgress'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const progress = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!progress[data.topic]) {
          progress[data.topic] = [];
        }
        progress[data.topic].push({ id: doc.id, ...data });
      });

      return progress;
    } catch (error) {
      console.error('❌ Erro ao buscar progresso:', error);
      return {};
    }
  }

  // 🔥 Gerar lição com IA
  async generateLesson(subtopicId, lessonNumber, userLevel) {
    try {
      // Encontrar subtópico
      let subtopicData = null;
      let topicName = '';

      for (const [topic, data] of Object.entries(this.topics)) {
        const found = data.subtopics.find(s => s.id === subtopicId);
        if (found) {
          subtopicData = found;
          topicName = topic;
          break;
        }
      }

      if (!subtopicData) {
        throw new Error('Subtópico não encontrado');
      }

      const prompt = `Você é um tutor educacional experiente. Crie uma lição completa sobre o tema abaixo.

Tópico: ${topicName}
Subtópico: ${subtopicData.name}
Lição: ${lessonNumber} de ${subtopicData.lessons}
Nível do aluno: ${userLevel}

Retorne APENAS um JSON válido com esta estrutura:

{
  "title": "Título da lição",
  "objective": "O que o aluno vai aprender",
  "content": [
    {
      "type": "text",
      "data": "Conteúdo explicativo em texto"
    },
    {
      "type": "example",
      "data": "Exemplo prático"
    },
    {
      "type": "tip",
      "data": "Dica importante"
    }
  ],
  "quiz": [
    {
      "question": "Pergunta 1",
      "options": ["A", "B", "C", "D"],
      "correct": "A",
      "explanation": "Explicação da resposta"
    },
    {
      "question": "Pergunta 2",
      "options": ["A", "B", "C", "D"],
      "correct": "B",
      "explanation": "Explicação"
    }
  ],
  "summary": "Resumo da lição em 2-3 frases"
}`;

      const lesson = await aiService.generateJSON(prompt);

      return {
        ...lesson,
        subtopicId,
        subtopicName: subtopicData.name,
        lessonNumber,
        topic: topicName,
      };

    } catch (error) {
      console.error('❌ Erro ao gerar lição:', error);
      throw error;
    }
  }

  // 🔥 Salvar lição completada
  async completeLesson(userId, subtopicId, lessonNumber, quizScore) {
    try {
      // Buscar progresso do usuário neste subtópico
      const q = query(
        collection(db, 'userProgress'),
        where('userId', '==', userId),
        where('subtopicId', '==', subtopicId)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docRef = doc(db, 'userProgress', snapshot.docs[0].id);
        const data = snapshot.docs[0].data();

        const newCompleted = Math.max(data.completedLessons, lessonNumber);
        const newProgress = Math.round((newCompleted / data.totalLessons) * 100);

        await updateDoc(docRef, {
          completedLessons: newCompleted,
          progress: newProgress,
          lastCompleted: new Date().toISOString(),
        });

        // 🔥 Se completou 100%, desbloquear próximo subtópico
        if (newProgress === 100) {
          await this.unlockNextSubtopic(userId, data.topic, subtopicId);
        }

        // Salvar tentativa do quiz
        await addDoc(collection(db, 'lessonAttempts'), {
          userId,
          subtopicId,
          lessonNumber,
          quizScore,
          timestamp: new Date().toISOString(),
        });

        return newProgress;
      }

      return 0;
    } catch (error) {
      console.error('❌ Erro ao completar lição:', error);
      throw error;
    }
  }

  // 🔥 Desbloquear próximo subtópico
  async unlockNextSubtopic(userId, topic, currentSubtopicId) {
    try {
      const topicData = this.topics[topic];
      if (!topicData) return;

      const current = topicData.subtopics.find(s => s.id === currentSubtopicId);
      if (!current) return;

      const nextSubtopic = topicData.subtopics.find(s => s.order === current.order + 1);
      if (!nextSubtopic) return;

      // Desbloquear próximo
      const q = query(
        collection(db, 'userProgress'),
        where('userId', '==', userId),
        where('subtopicId', '==', nextSubtopic.id)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docRef = doc(db, 'userProgress', snapshot.docs[0].id);
        await updateDoc(docRef, {
          isUnlocked: true,
          unlockedAt: new Date().toISOString(),
        });

        console.log('✅ Próximo subtópico desbloqueado:', nextSubtopic.name);
      }
    } catch (error) {
      console.error('❌ Erro ao desbloquear subtópico:', error);
    }
  }

  // 🔥 Recomendar próxima lição
  async getRecommendedLesson(userId) {
    try {
      const progress = await this.getUserProgress(userId);

      for (const [topic, subtopics] of Object.entries(progress)) {
        for (const subtopic of subtopics) {
          if (subtopic.isUnlocked && subtopic.progress < 100) {
            return {
              topic,
              subtopic: subtopic.subtopicName,
              subtopicId: subtopic.subtopicId,
              nextLesson: subtopic.completedLessons + 1,
              totalLessons: subtopic.totalLessons,
              progress: subtopic.progress,
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar recomendação:', error);
      return null;
    }
  }
}

export default new LessonService();