import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ACHIEVEMENT_BY_ID, DAILY_CHALLENGES, WEEKLY_CHALLENGES } from '../config/achievements';
import { applyXpToProfile } from '../utils/gamification';
import streakService from './streakService';
import authService from './authService';
import { notify } from './notificationService';

function getWeekKey() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

class AchievementService {
  async awardXp(userId, xpGain, reason = '') {
    if (!xpGain || xpGain <= 0) return null;

    try {
      const profile = await authService.getUserProfile(userId);
      if (!profile) return null;

      const { profile: updated, levelUps } = applyXpToProfile(profile, xpGain);
      await authService.updateUserProfile(userId, updated);
      await this.recordWeeklyXp(userId, xpGain);

      if (reason) {
        await notify(userId, {
          type: 'success',
          title: 'XP ganho',
          message: `${reason} (+${xpGain} XP)`,
        });
      }

      levelUps.forEach((lvl) => {
        notify(userId, {
          type: 'success',
          title: 'Level up!',
          message: `Você subiu para o Nível ${lvl}!`,
        });
      });

      await this.checkAfterExercise(userId, updated);
      return { profile: updated, levelUps };
    } catch (error) {
      console.error('❌ Erro ao conceder XP:', error);
      return null;
    }
  }

  async recordWeeklyXp(userId, xpGain) {
    const weekKey = getWeekKey();
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const weeklyXP =
      data.weeklyXPWeek === weekKey ? (data.weeklyXP || 0) + xpGain : xpGain;

    await updateDoc(userRef, {
      weeklyXP,
      weeklyXPWeek: weekKey,
    });
  }

  async grantAchievement(userId, achievementId) {
    const meta = ACHIEVEMENT_BY_ID[achievementId];
    if (!meta) return null;

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return null;

      const userData = userSnap.data();
      const userAchievements = userData.achievements || [];

      if (userAchievements.includes(achievementId)) return null;

      const { profile: withXp } = applyXpToProfile(userData, meta.xp);

      await updateDoc(userRef, {
        achievements: [...userAchievements, achievementId],
        totalXP: withXp.totalXP,
        xp: withXp.xp,
        level: withXp.level,
      });

      await notify(userId, {
        type: 'achievement',
        title: '🎉 Nova Conquista!',
        message: `${meta.name} (+${meta.xp} XP)`,
      });

      return { ...meta, granted: true };
    } catch (error) {
      console.error('❌ Erro ao conceder conquista:', error);
      return null;
    }
  }

  async checkAfterExercise(userId, profile) {
    const granted = [];
    const completed = profile?.completedExercises || 0;
    const level = profile?.level || 1;

    if (completed >= 1) {
      const g = await this.grantAchievement(userId, 'first_exercise');
      if (g) granted.push(g);
    }
    if (completed >= 50) {
      const g = await this.grantAchievement(userId, 'exercises_50');
      if (g) granted.push(g);
    }
    if (completed >= 100) {
      const g = await this.grantAchievement(userId, 'exercises_100');
      if (g) granted.push(g);
    }
    if (level >= 5) {
      const g = await this.grantAchievement(userId, 'level_5');
      if (g) granted.push(g);
    }
    if (level >= 10) {
      const g = await this.grantAchievement(userId, 'level_10');
      if (g) granted.push(g);
    }

    const perfect = await this.checkPerfectStreak(userId);
    if (perfect) granted.push(perfect);

    await this.checkChallengeRewards(userId);

    return granted;
  }

  async checkPerfectStreak(userId) {
    try {
      const q = query(
        collection(db, 'attempts'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      if (snapshot.size < 10) return null;

      const allCorrect = snapshot.docs.every((d) => d.data().isCorrect === true);
      if (!allCorrect) return null;

      return this.grantAchievement(userId, 'perfect_accuracy');
    } catch (error) {
      console.error('❌ Erro ao verificar sequência perfeita:', error);
      return null;
    }
  }

  async checkAfterLessonComplete(userId, subtopicProgress) {
    if (subtopicProgress !== 100) return null;
    const result = await this.grantAchievement(userId, 'master_learner');
    await this.checkChallengeRewards(userId);
    return result;
  }

  async checkAfterDailyGoal(userId, isComplete) {
    if (!isComplete) return null;
    return this.grantAchievement(userId, 'daily_goal');
  }

  async getTodayStudyStats(userId) {
    const today = getTodayKey();
    const start = `${today}T00:00:00.000Z`;
    const end = `${today}T23:59:59.999Z`;

    try {
      const attemptsQ = query(
        collection(db, 'attempts'),
        where('userId', '==', userId),
        where('timestamp', '>=', start),
        where('timestamp', '<=', end)
      );
      const attemptsSnap = await getDocs(attemptsQ);
      const attempts = attemptsSnap.docs.map((d) => d.data());

      const lessonsQ = query(
        collection(db, 'lessonAttempts'),
        where('userId', '==', userId),
        where('timestamp', '>=', start),
        where('timestamp', '<=', end)
      );
      const lessonsSnap = await getDocs(lessonsQ);

      return {
        attempts: attempts.length,
        correct: attempts.filter((a) => a.isCorrect).length,
        lessons: lessonsSnap.size,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar stats do dia:', error);
      return { attempts: 0, correct: 0, lessons: 0 };
    }
  }

  async getWeekStudyStats(userId) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const start = weekStart.toISOString().split('T')[0] + 'T00:00:00.000Z';

    try {
      const attemptsQ = query(
        collection(db, 'attempts'),
        where('userId', '==', userId),
        where('timestamp', '>=', start)
      );
      const attemptsSnap = await getDocs(attemptsQ);

      const lessonsQ = query(
        collection(db, 'lessonAttempts'),
        where('userId', '==', userId),
        where('timestamp', '>=', start)
      );
      const lessonsSnap = await getDocs(lessonsQ);

      const userSnap = await getDoc(doc(db, 'users', userId));
      const userData = userSnap.data() || {};
      const weekKey = getWeekKey();
      const weeklyXP =
        userData.weeklyXPWeek === weekKey ? userData.weeklyXP || 0 : 0;

      return {
        attempts: attemptsSnap.size,
        lessons: lessonsSnap.size,
        weeklyXP,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar stats da semana:', error);
      return { attempts: 0, lessons: 0, weeklyXP: 0 };
    }
  }

  getChallengeProgress(challenge, todayStats, weekStats) {
    if (challenge.metric === 'attempts') {
      const val = DAILY_CHALLENGES.some((c) => c.id === challenge.id)
        ? todayStats.attempts
        : weekStats.attempts;
      return Math.min(val, challenge.target);
    }
    if (challenge.metric === 'correct') return Math.min(todayStats.correct, challenge.target);
    if (challenge.metric === 'lessons') {
      const val = DAILY_CHALLENGES.some((c) => c.id === challenge.id)
        ? todayStats.lessons
        : weekStats.lessons;
      return Math.min(val, challenge.target);
    }
    if (challenge.metric === 'weeklyXP') return Math.min(weekStats.weeklyXP, challenge.target);
    return 0;
  }

  async checkChallengeRewards(userId) {
    const [todayStats, weekStats] = await Promise.all([
      this.getTodayStudyStats(userId),
      this.getWeekStudyStats(userId),
    ]);

    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const todayKey = getTodayKey();
    const weekKey = getWeekKey();

    let completedToday = data.completedChallengesToday || [];
    let completedWeek = data.completedChallengesWeek || [];
    let totalBonusXp = 0;
    const newlyCompleted = [];

    if (data.challengesDate !== todayKey) {
      completedToday = [];
    }
    if (data.challengesWeek !== weekKey) {
      completedWeek = [];
    }

    for (const challenge of DAILY_CHALLENGES) {
      const progress = this.getChallengeProgress(challenge, todayStats, weekStats);
      if (progress >= challenge.target && !completedToday.includes(challenge.id)) {
        completedToday.push(challenge.id);
        totalBonusXp += challenge.xpBonus;
        newlyCompleted.push(challenge.title);
      }
    }

    for (const challenge of WEEKLY_CHALLENGES) {
      const progress = this.getChallengeProgress(challenge, todayStats, weekStats);
      if (progress >= challenge.target && !completedWeek.includes(challenge.id)) {
        completedWeek.push(challenge.id);
        totalBonusXp += challenge.xpBonus;
        newlyCompleted.push(challenge.title);
      }
    }

    await updateDoc(userRef, {
      completedChallengesToday: completedToday,
      completedChallengesWeek: completedWeek,
      challengesDate: todayKey,
      challengesWeek: weekKey,
    });

    if (totalBonusXp > 0) {
      await this.awardXp(
        userId,
        totalBonusXp,
        `Desafio concluído: ${newlyCompleted.join(', ')}`
      );
    }
  }

  async refreshUserProfile(userId) {
    return authService.getUserProfile(userId);
  }
}

export default new AchievementService();
