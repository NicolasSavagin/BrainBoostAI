import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

import { auth, db } from '../config/firebase';

class AuthService {

  async register(email, password, displayName) {
    try {
      console.log("🚀 INICIANDO REGISTRO");

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("✅ USUÁRIO CRIADO:", user.uid);

      // 🔥 tenta atualizar profile (mas não trava se falhar)
      try {
        await updateProfile(user, { displayName });
        console.log("✅ PROFILE ATUALIZADO");
      } catch (e) {
        console.warn("⚠️ ERRO updateProfile:", e);
      }

      // 🔥 salva no Firestore
      await this.createUserProfile(user.uid, {
        email,
        displayName,
        createdAt: new Date().toISOString(),
      });

      console.log("🎉 REGISTRO COMPLETO");

      return user;

    } catch (error) {
      console.error('❌ ERROR REGISTER COMPLETO:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      console.log("🔐 FAZENDO LOGIN");

      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      console.log("✅ LOGIN OK:", userCredential.user.uid);

      return userCredential.user;

    } catch (error) {
      console.error('❌ ERROR LOGIN:', error);
      throw error;
    }
  }

  async loginWithGoogle() {
    try {
      console.log("🌐 LOGIN GOOGLE");

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("✅ GOOGLE USER:", user.uid);

      const userDoc = await this.getUserProfile(user.uid);

      if (!userDoc) {
        console.log("🆕 USUÁRIO NOVO - CRIANDO NO FIRESTORE");

        await this.createUserProfile(user.uid, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
        });
      } else {
        console.log("👤 USUÁRIO JÁ EXISTE");
      }

      return user;

    } catch (error) {
      console.error('❌ ERROR GOOGLE LOGIN:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(auth);
      console.log("🚪 LOGOUT OK");
    } catch (error) {
      console.error('❌ ERROR LOGOUT:', error);
      throw error;
    }
  }

  async createUserProfile(uid, userData) {
    try {
      console.log("🔥 INICIANDO createUserProfile");
      console.log("📌 UID:", uid);
      console.log("📦 DATA:", userData);

      const userProfile = {
        ...userData,
        level: 1,
        xp: 0,
        totalXP: 0,
        streak: 0,
        lastLoginDate: new Date().toISOString(),
        achievements: [],
        completedExercises: 0,
        accuracy: 0,
        studyTime: 30,
        preferences: {
          theme: 'light',
          notifications: true,
          soundEffects: true,
        },
        stats: {
          totalExercises: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          averageTime: 0,
          topicsStudied: [],
        },
      };

      console.log("📝 SALVANDO NO FIRESTORE...");

      await setDoc(doc(db, 'users', uid), userProfile);

      console.log("✅ SALVO NO FIRESTORE COM SUCESSO");

      return userProfile;

    } catch (error) {
      console.error('❌ ERRO AO SALVAR FIRESTORE:', error);
      throw error;
    }
  }

  async getUserProfile(uid) {
    try {
      console.log("🔍 BUSCANDO USER:", uid);

      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("✅ USER ENCONTRADO");
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        console.log("⚠️ USER NÃO EXISTE");
        return null;
      }

    } catch (error) {
      console.error('❌ ERROR GET USER:', error);
      throw error;
    }
  }

  async updateUserProfile(uid, updates) {
    try {
      console.log("✏️ ATUALIZANDO USER:", uid);

      const docRef = doc(db, 'users', uid);

      await updateDoc(docRef, {
        ...updates,
        lastUpdate: new Date().toISOString()
      });

      console.log("✅ USER ATUALIZADO");

    } catch (error) {
      console.error("❌ ERROR UPDATE:", error);
      throw error;
    }
  }

  onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  getCurrentUser() {
    return auth.currentUser;
  }
}

export default new AuthService();