import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class SkillProgressService {
  
  // 🎯 Skills disponíveis na plataforma
  platformSkills = {
    'Programação': {
      'JavaScript': { maxLevel: 10, xpPerLevel: 100 },
      'Python': { maxLevel: 10, xpPerLevel: 100 },
      'React': { maxLevel: 10, xpPerLevel: 120 },
      'Node.js': { maxLevel: 10, xpPerLevel: 120 },
    },
    'Matemática': {
      'Álgebra': { maxLevel: 10, xpPerLevel: 80 },
      'Geometria': { maxLevel: 10, xpPerLevel: 80 },
      'Cálculo': { maxLevel: 10, xpPerLevel: 100 },
    },
    'Inglês': {
      'Gramática': { maxLevel: 10, xpPerLevel: 70 },
      'Vocabulário': { maxLevel: 10, xpPerLevel: 70 },
      'Conversação': { maxLevel: 10, xpPerLevel: 90 },
    }
  };

  // 📊 Adicionar XP a uma Skill
  async addSkillXP(userId, topic, skillName, xpAmount) {
    try {
      const skillRef = doc(db, 'userSkills', `${userId}_${skillName}`);
      const skillDoc = await getDoc(skillRef);

      const category = Object.keys(this.platformSkills).find(cat => 
        this.platformSkills[cat][skillName]
      );

      if (!category) return;

      const skillConfig = this.platformSkills[category][skillName];

      if (!skillDoc.exists()) {
        // Criar skill
        await setDoc(skillRef, {
          userId,
          skillName,
          category,
          level: 1,
          currentXP: xpAmount,
          totalXP: xpAmount,
          maxLevel: skillConfig.maxLevel,
          xpPerLevel: skillConfig.xpPerLevel,
          createdAt: serverTimestamp(),
          lastPracticed: serverTimestamp()
        });
      } else {
        // Atualizar skill
        const current = skillDoc.data();
        const newTotalXP = current.totalXP + xpAmount;
        const newCurrentXP = current.currentXP + xpAmount;
        
        // Calcular nível
        let newLevel = current.level;
        let remainingXP = newCurrentXP;

        while (remainingXP >= skillConfig.xpPerLevel && newLevel < skillConfig.maxLevel) {
          remainingXP -= skillConfig.xpPerLevel;
          newLevel++;
        }

        await updateDoc(skillRef, {
          level: newLevel,
          currentXP: remainingXP,
          totalXP: newTotalXP,
          lastPracticed: serverTimestamp()
        });

        // Se subiu de nível, retornar notificação
        if (newLevel > current.level) {
          return {
            leveledUp: true,
            skill: skillName,
            newLevel
          };
        }
      }

      return { leveledUp: false };

    } catch (error) {
      console.error('Erro ao adicionar XP:', error);
      throw error;
    }
  }

  // 📈 Buscar Skills do Usuário
  async getUserSkills(userId) {
    try {
      const skills = [];
      
      for (const [category, skillList] of Object.entries(this.platformSkills)) {
        for (const skillName of Object.keys(skillList)) {
          const skillRef = doc(db, 'userSkills', `${userId}_${skillName}`);
          const skillDoc = await getDoc(skillRef);

          if (skillDoc.exists()) {
            skills.push({
              id: skillDoc.id,
              ...skillDoc.data()
            });
          } else {
            // Adicionar skills não iniciadas
            skills.push({
              userId,
              skillName,
              category,
              level: 0,
              currentXP: 0,
              totalXP: 0,
              maxLevel: skillList[skillName].maxLevel,
              xpPerLevel: skillList[skillName].xpPerLevel,
              notStarted: true
            });
          }
        }
      }

      return skills;
    } catch (error) {
      console.error('Erro ao buscar skills:', error);
      return [];
    }
  }

  // 🏆 Obter Ranking de Skill
  getSkillRank(level) {
    if (level === 0) return { rank: 'Novato', color: 'text-gray-500' };
    if (level <= 2) return { rank: 'Iniciante', color: 'text-blue-500' };
    if (level <= 4) return { rank: 'Aprendiz', color: 'text-green-500' };
    if (level <= 6) return { rank: 'Competente', color: 'text-yellow-500' };
    if (level <= 8) return { rank: 'Especialista', color: 'text-orange-500' };
    return { rank: 'Mestre', color: 'text-purple-600' };
  }
}

export default new SkillProgressService();