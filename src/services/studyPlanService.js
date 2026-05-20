import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

class StudyPlanService {
  async saveStudyPlan(userId, plan) {
    try {
      const planRef = await addDoc(collection(db, 'studyPlans'), {
        userId,
        title: plan.title || 'Plano de Estudos',
        weeklyPlan: plan.weeklyPlan || [],
        tips: plan.tips || [],
        motivation: plan.motivation || '',
        goals: plan.goals || [],
        dailyMinutes: plan.dailyMinutes || 30,
        status: 'active',
        progress: 0,
        createdAt: serverTimestamp(),
        startDate: new Date().toISOString(),
        endDate: null,
      });

      return planRef.id;
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      throw error;
    }
  }

  async getUserPlans(userId) {
    try {
      const q = query(
        collection(db, 'studyPlans'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      return [];
    }
  }

  async getPlan(planId) {
    const snap = await getDoc(doc(db, 'studyPlans', planId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }

  async completeActivity(planId, dayIndex, activityIndex) {
    try {
      const planRef = doc(db, 'studyPlans', planId);
      const planSnap = await getDoc(planRef);

      if (!planSnap.exists()) return { progress: 0, wasAlreadyComplete: true };

      const planData = planSnap.data();
      const activity = planData.weeklyPlan?.[dayIndex]?.activities?.[activityIndex];

      if (!activity) return { progress: planData.progress || 0, wasAlreadyComplete: true };
      if (activity.completed) {
        return { progress: planData.progress || 0, wasAlreadyComplete: true };
      }

      const updatedPlan = JSON.parse(JSON.stringify(planData.weeklyPlan));
      updatedPlan[dayIndex].activities[activityIndex].completed = true;

      const totalActivities = updatedPlan.reduce(
        (sum, day) => sum + (day.activities?.length || 0),
        0
      );
      const completedActivities = updatedPlan.reduce(
        (sum, day) => sum + (day.activities?.filter((a) => a.completed).length || 0),
        0
      );
      const progress = totalActivities
        ? Math.round((completedActivities / totalActivities) * 100)
        : 0;

      await updateDoc(planRef, {
        weeklyPlan: updatedPlan,
        progress,
        status: progress === 100 ? 'completed' : 'active',
      });

      return { progress, wasAlreadyComplete: false, totalActivities, completedActivities };
    } catch (error) {
      console.error('Erro ao completar atividade:', error);
      throw error;
    }
  }

  async deletePlan(planId) {
    try {
      await deleteDoc(doc(db, 'studyPlans', planId));
    } catch (error) {
      console.error('Erro ao deletar plano:', error);
      throw error;
    }
  }

  async togglePlanStatus(planId, newStatus) {
    try {
      await updateDoc(doc(db, 'studyPlans', planId), {
        status: newStatus,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }
}

export default new StudyPlanService();
