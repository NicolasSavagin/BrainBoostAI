import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

class ExerciseService {
  
  // 🔥 Salvar exercício gerado pela IA
  async saveExercise(userId, exerciseData) {
    try {
      const exerciseRef = await addDoc(collection(db, 'exercises'), {
        userId,
        ...exerciseData,
        createdAt: new Date().toISOString(),
        attemptCount: 0,
        lastAttempt: null,
      });

      console.log('✅ Exercício salvo:', exerciseRef.id);
      return exerciseRef.id;
    } catch (error) {
      console.error('❌ Erro ao salvar exercício:', error);
      throw error;
    }
  }

  // 🔥 Salvar tentativa do usuário
  async saveAttempt(userId, exerciseId, attemptData) {
    try {
      const attemptRef = await addDoc(collection(db, 'attempts'), {
        userId,
        exerciseId,
        ...attemptData,
        timestamp: new Date().toISOString(),
      });

      // Atualiza contador no exercício
      const exerciseRef = doc(db, 'exercises', exerciseId);
      const exerciseSnap = await getDoc(exerciseRef);
      
      if (exerciseSnap.exists()) {
        await updateDoc(exerciseRef, {
          attemptCount: (exerciseSnap.data().attemptCount || 0) + 1,
          lastAttempt: new Date().toISOString(),
        });
      }

      return attemptRef.id;
    } catch (error) {
      console.error('❌ Erro ao salvar tentativa:', error);
      throw error;
    }
  }

  // 🔥 Buscar exercícios já respondidos pelo usuário no mesmo tópico
  async getCompletedExercises(userId, topic) {
    try {
      const q = query(
        collection(db, 'exercises'),
        where('userId', '==', userId),
        where('topic', '==', topic),
        where('attemptCount', '>', 0)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Erro ao buscar exercícios completos:', error);
      return [];
    }
  }

  // 🔥 Buscar histórico de tentativas do usuário
  async getUserAttempts(userId, limitCount = 10) {
    try {
      const q = query(
        collection(db, 'attempts'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('❌ Erro ao buscar tentativas:', error);
      return [];
    }
  }

  // 🔥 Calcular estatísticas do usuário por tópico
  async getTopicStats(userId, topic) {
    try {
      const q = query(
        collection(db, 'attempts'),
        where('userId', '==', userId),
        where('topic', '==', topic)
      );

      const snapshot = await getDocs(q);
      const attempts = snapshot.docs.map(doc => doc.data());

      const total = attempts.length;
      const correct = attempts.filter(a => a.isCorrect).length;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

      return { total, correct, accuracy };
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      return { total: 0, correct: 0, accuracy: 0 };
    }
  }

  // 🔥 Calcular dificuldade adaptativa
  async getAdaptiveDifficulty(userId, topic) {
    try {
      const stats = await this.getTopicStats(userId, topic);

      // Lógica adaptativa
      if (stats.accuracy >= 80) return 4; // Difícil
      if (stats.accuracy >= 60) return 3; // Médio
      if (stats.accuracy >= 40) return 2; // Fácil
      return 1; // Muito fácil
    } catch (error) {
      console.error('❌ Erro ao calcular dificuldade:', error);
      return 2; // Padrão
    }
  }

  // 🔥 Buscar tópicos fracos do usuário
  async getWeakTopics(userId) {
    try {
      const allTopics = [
        'Programação - JavaScript',
        'Programação - Python',
        'Matemática - Álgebra',
        'Matemática - Geometria',
        'Inglês - Gramática',
        'Inglês - Vocabulário',
      ];

      const weakTopics = [];

      for (const topic of allTopics) {
        const stats = await this.getTopicStats(userId, topic);
        if (stats.total > 0 && stats.accuracy < 60) {
          weakTopics.push({ topic, ...stats });
        }
      }

      return weakTopics.sort((a, b) => a.accuracy - b.accuracy);
    } catch (error) {
      console.error('❌ Erro ao buscar tópicos fracos:', error);
      return [];
    }
  }
}

export default new ExerciseService();