import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

class ProfileService {
  
  // 📸 Upload de Foto de Perfil
  async uploadProfilePicture(userId, file) {
    try {
      const storageRef = ref(storage, `profiles/${userId}/avatar.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', userId), {
        photoURL: url,
        updatedAt: serverTimestamp()
      });

      return url;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  }

  // 📝 Upload de Banner
  async uploadBannerImage(userId, file) {
    try {
      const storageRef = ref(storage, `profiles/${userId}/banner.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', userId), {
        bannerURL: url,
        updatedAt: serverTimestamp()
      });

      return url;
    } catch (error) {
      console.error('Erro ao fazer upload do banner:', error);
      throw error;
    }
  }

  // 🎓 Adicionar Formação Acadêmica
  async addEducation(userId, education) {
    try {
      const educationRef = await addDoc(collection(db, 'education'), {
        userId,
        institution: education.institution,
        degree: education.degree, // "Bacharelado", "Mestrado", etc.
        fieldOfStudy: education.fieldOfStudy,
        startDate: education.startDate,
        endDate: education.endDate || null,
        current: education.current || false,
        description: education.description || '',
        createdAt: serverTimestamp()
      });

      return educationRef.id;
    } catch (error) {
      console.error('Erro ao adicionar formação:', error);
      throw error;
    }
  }

  // 💼 Adicionar Experiência Profissional
  async addExperience(userId, experience) {
    try {
      const expRef = await addDoc(collection(db, 'experiences'), {
        userId,
        company: experience.company,
        position: experience.position,
        location: experience.location || '',
        startDate: experience.startDate,
        endDate: experience.endDate || null,
        current: experience.current || false,
        description: experience.description || '',
        skills: experience.skills || [],
        createdAt: serverTimestamp()
      });

      return expRef.id;
    } catch (error) {
      console.error('Erro ao adicionar experiência:', error);
      throw error;
    }
  }

  // 🛠️ Adicionar Habilidade
  async addSkill(userId, skill) {
    try {
      const skillRef = await addDoc(collection(db, 'skills'), {
        userId,
        name: skill.name,
        level: skill.level, // "Iniciante", "Intermediário", "Avançado", "Expert"
        category: skill.category, // "Programação", "Design", "Marketing", etc.
        endorsements: 0,
        createdAt: serverTimestamp()
      });

      return skillRef.id;
    } catch (error) {
      console.error('Erro ao adicionar habilidade:', error);
      throw error;
    }
  }

  // 🏆 Adicionar Certificação
  async addCertification(userId, certification) {
    try {
      const certRef = await addDoc(collection(db, 'certifications'), {
        userId,
        name: certification.name,
        issuer: certification.issuer,
        issueDate: certification.issueDate,
        expirationDate: certification.expirationDate || null,
        credentialId: certification.credentialId || '',
        credentialUrl: certification.credentialUrl || '',
        createdAt: serverTimestamp()
      });

      return certRef.id;
    } catch (error) {
      console.error('Erro ao adicionar certificação:', error);
      throw error;
    }
  }

  // 📂 Adicionar Projeto/Portfólio
  async addProject(userId, project) {
    try {
      const projectRef = await addDoc(collection(db, 'projects'), {
        userId,
        title: project.title,
        description: project.description,
        technologies: project.technologies || [],
        url: project.url || '',
        githubUrl: project.githubUrl || '',
        imageUrl: project.imageUrl || '',
        startDate: project.startDate,
        endDate: project.endDate || null,
        createdAt: serverTimestamp()
      });

      return projectRef.id;
    } catch (error) {
      console.error('Erro ao adicionar projeto:', error);
      throw error;
    }
  }

  // 🔍 Buscar Perfil Completo
  async getFullProfile(userId) {
    try {
      const [
        userDoc,
        educationDocs,
        experienceDocs,
        skillsDocs,
        certificationsDocs,
        projectsDocs
      ] = await Promise.all([
        getDoc(doc(db, 'users', userId)),
        getDocs(query(collection(db, 'education'), where('userId', '==', userId), orderBy('startDate', 'desc'))),
        getDocs(query(collection(db, 'experiences'), where('userId', '==', userId), orderBy('startDate', 'desc'))),
        getDocs(query(collection(db, 'skills'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'certifications'), where('userId', '==', userId), orderBy('issueDate', 'desc'))),
        getDocs(query(collection(db, 'projects'), where('userId', '==', userId), orderBy('createdAt', 'desc')))
      ]);

      return {
        user: userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null,
        education: educationDocs.docs.map(d => ({ id: d.id, ...d.data() })),
        experiences: experienceDocs.docs.map(d => ({ id: d.id, ...d.data() })),
        skills: skillsDocs.docs.map(d => ({ id: d.id, ...d.data() })),
        certifications: certificationsDocs.docs.map(d => ({ id: d.id, ...d.data() })),
        projects: projectsDocs.docs.map(d => ({ id: d.id, ...d.data() }))
      };
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      throw error;
    }
  }

  // ✏️ Atualizar Bio
  async updateBio(userId, bioData) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        bio: bioData.bio || '',
        headline: bioData.headline || '', // ex: "Desenvolvedor Full Stack | React | Node.js"
        location: bioData.location || '',
        website: bioData.website || '',
        github: bioData.github || '',
        linkedin: bioData.linkedin || '',
        twitter: bioData.twitter || '',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao atualizar bio:', error);
      throw error;
    }
  }

  // 🗑️ Deletar Item
  async deleteItem(collection, itemId) {
    try {
      await deleteDoc(doc(db, collection, itemId));
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      throw error;
    }
  }

  // 👍 Endossar Habilidade
  async endorseSkill(skillId, endorserId) {
    try {
      const skillRef = doc(db, 'skills', skillId);
      const skillDoc = await getDoc(skillRef);

      if (skillDoc.exists()) {
        const currentEndorsements = skillDoc.data().endorsements || 0;
        await updateDoc(skillRef, {
          endorsements: currentEndorsements + 1
        });

        // Salvar quem endossou
        await addDoc(collection(db, 'endorsements'), {
          skillId,
          endorserId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Erro ao endossar:', error);
      throw error;
    }
  }

  // 📊 Buscar Estatísticas do Perfil
  async getProfileStats(userId) {
    try {
      const [education, experiences, skills, certifications, projects] = await Promise.all([
        getDocs(query(collection(db, 'education'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'experiences'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'skills'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'certifications'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'projects'), where('userId', '==', userId)))
      ]);

      return {
        educationCount: education.size,
        experiencesCount: experiences.size,
        skillsCount: skills.size,
        certificationsCount: certifications.size,
        projectsCount: projects.size,
        totalEndorsements: skills.docs.reduce((sum, doc) => sum + (doc.data().endorsements || 0), 0)
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        educationCount: 0,
        experiencesCount: 0,
        skillsCount: 0,
        certificationsCount: 0,
        projectsCount: 0,
        totalEndorsements: 0
      };
    }
  }
}

export default new ProfileService();