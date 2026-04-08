import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

class StreakService {
  
  // 🔥 Verificar e atualizar streak do usuário
  async checkAndUpdateStreak(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return { streak: 0, message: 'Usuário não encontrado' };

      const userData = userSnap.data();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const lastLogin = userData.lastLoginDate?.split('T')[0];

      let streak = userData.streak || 0;
      let message = '';
      let streakBroken = false;

      // Primeiro acesso de hoje
      if (lastLogin !== today) {
        
        // Verifica se foi ontem (continuou o streak)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastLogin === yesterdayStr) {
          // Streak continua!
          streak += 1;
          message = `🔥 Streak de ${streak} dias! Continue assim!`;
        } else if (lastLogin && lastLogin < yesterdayStr) {
          // Perdeu o streak 😢
          streakBroken = true;
          const oldStreak = streak;
          streak = 1;
          message = `😔 Você perdeu seu streak de ${oldStreak} dias. Começando um novo!`;
        } else {
          // Primeiro dia
          streak = 1;
          message = '🎉 Primeiro dia de streak! Volte amanhã!';
        }

        // Atualizar no Firebase
        await updateDoc(userRef, {
          streak,
          lastLoginDate: new Date().toISOString(),
          longestStreak: Math.max(userData.longestStreak || 0, streak),
        });

        // Salvar histórico de streak
        await this.saveStreakHistory(userId, streak, streakBroken);

        // Verificar conquistas de streak
        await this.checkStreakAchievements(userId, streak);
      }

      return { 
        streak, 
        message, 
        streakBroken,
        longestStreak: userData.longestStreak || streak 
      };

    } catch (error) {
      console.error('❌ Erro ao atualizar streak:', error);
      throw error;
    }
  }

  // 🔥 Salvar histórico de streak
  async saveStreakHistory(userId, streak, wasBroken) {
    try {
      await addDoc(collection(db, 'streakHistory'), {
        userId,
        streak,
        wasBroken,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Erro ao salvar histórico:', error);
    }
  }

  // 🔥 Verificar e conceder conquistas de streak
  async checkStreakAchievements(userId, currentStreak) {
    try {
      const achievements = [
        { id: 'streak_3', name: 'Iniciante Dedicado', streak: 3, icon: '🔥', xp: 50 },
        { id: 'streak_7', name: 'Uma Semana Forte', streak: 7, icon: '⭐', xp: 100 },
        { id: 'streak_14', name: 'Duas Semanas!', streak: 14, icon: '💪', xp: 200 },
        { id: 'streak_30', name: 'Mês Completo!', streak: 30, icon: '🏆', xp: 500 },
        { id: 'streak_60', name: 'Dois Meses!', streak: 60, icon: '👑', xp: 1000 },
        { id: 'streak_100', name: 'Lenda do Streak!', streak: 100, icon: '🌟', xp: 2000 },
      ];

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      const userAchievements = userData.achievements || [];

      for (const achievement of achievements) {
        // Se atingiu o streak e ainda não tem a conquista
        if (currentStreak >= achievement.streak && !userAchievements.includes(achievement.id)) {
          
          // Adicionar conquista
          await updateDoc(userRef, {
            achievements: [...userAchievements, achievement.id],
            totalXP: (userData.totalXP || 0) + achievement.xp,
            xp: (userData.xp || 0) + achievement.xp,
          });

          // Salvar notificação
          await this.createNotification(userId, {
            type: 'achievement',
            title: '🎉 Nova Conquista!',
            message: `Você desbloqueou: ${achievement.icon} ${achievement.name} (+${achievement.xp} XP)`,
            data: achievement,
          });

          console.log('✅ Conquista desbloqueada:', achievement.name);
        }
      }

    } catch (error) {
      console.error('❌ Erro ao verificar conquistas:', error);
    }
  }

  // 🔥 Criar notificação
  async createNotification(userId, notification) {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        ...notification,
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
    }
  }

  // 🔥 Buscar notificações não lidas
  async getUnreadNotifications(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error);
      return [];
    }
  }

  // 🔥 Marcar notificação como lida
  async markAsRead(notificationId) {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error);
    }
  }

  // 🔥 Verificar meta diária
  async checkDailyGoal(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Buscar exercícios de hoje
      const q = query(
        collection(db, 'attempts'),
        where('userId', '==', userId),
        where('timestamp', '>=', `${today}T00:00:00.000Z`),
        where('timestamp', '<=', `${today}T23:59:59.999Z`)
      );

      const snapshot = await getDocs(q);
      const todayExercises = snapshot.size;

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const dailyGoal = userSnap.data()?.dailyGoal || 5;

      const completed = todayExercises >= dailyGoal;

      // Se completou a meta hoje pela primeira vez
      if (completed) {
        const lastGoalDate = userSnap.data()?.lastDailyGoalDate?.split('T')[0];
        
        if (lastGoalDate !== today) {
          await updateDoc(userRef, {
            lastDailyGoalDate: new Date().toISOString(),
          });

          // Notificação de meta completa
          await this.createNotification(userId, {
            type: 'goal',
            title: '🎯 Meta Diária Completa!',
            message: `Parabéns! Você completou ${dailyGoal} exercícios hoje!`,
          });
        }
      }

      return {
        completed: todayExercises,
        goal: dailyGoal,
        isComplete: completed,
        percentage: Math.min(Math.round((todayExercises / dailyGoal) * 100), 100),
      };

    } catch (error) {
      console.error('❌ Erro ao verificar meta diária:', error);
      return { completed: 0, goal: 5, isComplete: false, percentage: 0 };
    }
  }

  // 🔥 Buscar histórico de streak
  async getStreakHistory(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, 'streakHistory'),
        where('userId', '==', userId),
        where('timestamp', '>=', startDate.toISOString()),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      return [];
    }
  }

  // 🔥 Calcular estatísticas de streak
  async getStreakStats(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      const history = await this.getStreakHistory(userId, 90);

      // Calcular quantos dias perdeu o streak
      const streaksBroken = history.filter(h => h.wasBroken).length;

      // Calcular dias totais de estudo
      const totalDays = history.length;

      return {
        current: userData.streak || 0,
        longest: userData.longestStreak || 0,
        streaksBroken,
        totalDays,
        achievements: userData.achievements || [],
      };

    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      return {
        current: 0,
        longest: 0,
        streaksBroken: 0,
        totalDays: 0,
        achievements: [],
      };
    }
  }

  // 🔥 Sistema de lembrete (para usar com notificações push futuramente)
  async createStudyReminder(userId, time) {
    try {
      await addDoc(collection(db, 'reminders'), {
        userId,
        time, // Formato: "HH:MM"
        enabled: true,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Erro ao criar lembrete:', error);
    }
  }
}

export default new StreakService();