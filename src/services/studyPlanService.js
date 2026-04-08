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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class StudyPlanService {
  
  // 💾 Salvar Plano de Estudos
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
        status: 'active', // 'active', 'completed', 'paused'
        progress: 0,
        createdAt: serverTimestamp(),
        startDate: new Date().toISOString(),
        endDate: null
      });

      return planRef.id;
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      throw error;
    }
  }

  // 📋 Buscar Planos do Usuário
  async getUserPlans(userId) {
    try {
      const q = query(
        collection(db, 'studyPlans'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      return [];
    }
  }

  // ✅ Marcar Atividade como Completa
  async completeActivity(planId, dayIndex, activityIndex) {
    try {
      const planRef = doc(db, 'studyPlans', planId);
      
      // Buscar o plano atual
      const planDoc = await getDocs(query(collection(db, 'studyPlans'), where('__name__', '==', planId)));
      const planData = planDoc.docs[0]?.data();

      if (!planData) return;

      // Atualizar atividade como completa
      const updatedPlan = { ...planData };
      if (updatedPlan.weeklyPlan[dayIndex]?.activities[activityIndex]) {
        updatedPlan.weeklyPlan[dayIndex].activities[activityIndex].completed = true;
      }

      // Calcular progresso total
      const totalActivities = updatedPlan.weeklyPlan.reduce((sum, day) => 
        sum + (day.activities?.length || 0), 0
      );
      const completedActivities = updatedPlan.weeklyPlan.reduce((sum, day) => 
        sum + (day.activities?.filter(a => a.completed).length || 0), 0
      );
      const progress = Math.round((completedActivities / totalActivities) * 100);

      await updateDoc(planRef, {
        weeklyPlan: updatedPlan.weeklyPlan,
        progress,
        status: progress === 100 ? 'completed' : 'active'
      });

    } catch (error) {
      console.error('Erro ao completar atividade:', error);
      throw error;
    }
  }

  // 🗑️ Deletar Plano
  async deletePlan(planId) {
    try {
      await deleteDoc(doc(db, 'studyPlans', planId));
    } catch (error) {
      console.error('Erro ao deletar plano:', error);
      throw error;
    }
  }

  // ⏸️ Pausar/Retomar Plano
  async togglePlanStatus(planId, newStatus) {
    try {
      await updateDoc(doc(db, 'studyPlans', planId), {
        status: newStatus
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }
}

export default new StudyPlanService();