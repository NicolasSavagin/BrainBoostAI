import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  getTierFromLP,
  getLPChange,
  topicToCategory,
  RANKING_CATEGORIES,
} from '../config/rankings';

class RankingService {
  async applyBattleResult(userId, { won, draw, vsBot }) {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    const oldLP = data.battleLP || 0;
    const oldTier = getTierFromLP(oldLP);

    const lpChange = getLPChange({ won, draw, vsBot });
    const newLP = Math.max(0, oldLP + lpChange);
    const newTier = getTierFromLP(newLP);

    const updates = {
      battleLP: newLP,
      battleTier: newTier.id,
      battlePlayed: (data.battlePlayed || 0) + 1,
    };

    if (draw) updates.battleDraws = (data.battleDraws || 0) + 1;
    else if (won) updates.battleWins = (data.battleWins || 0) + 1;
    else updates.battleLosses = (data.battleLosses || 0) + 1;

    await updateDoc(userRef, updates);

    return {
      lpChange,
      oldLP,
      newLP,
      oldTier: oldTier.id,
      newTier: newTier.id,
      tierInfo: newTier,
      promoted: newTier.id !== oldTier.id && newLP > oldLP,
      demoted: newTier.id !== oldTier.id && newLP < oldLP,
    };
  }

  async addCategoryXP(userId, topic, xpGain) {
    if (!xpGain || xpGain <= 0) return;

    const category = topicToCategory(topic);
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const categoryXP = { ...(snap.data().categoryXP || {}) };
    categoryXP[category] = (categoryXP[category] || 0) + xpGain;
    categoryXP.Geral = (categoryXP.Geral || 0) + xpGain;

    await updateDoc(userRef, { categoryXP });
  }

  async getGeneralLeaderboard(limitCount = 50) {
    try {
      const q = query(collection(db, 'users'), orderBy('totalXP', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      return this._mapRanked(snap.docs, (u) => u.totalXP || 0, 'XP');
    } catch (e) {
      console.error('Ranking geral:', e);
      return [];
    }
  }

  async getBattleLeaderboard(limitCount = 50) {
    try {
      const q = query(collection(db, 'users'), orderBy('battleLP', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      return this._mapRanked(snap.docs, (u) => u.battleLP || 0, 'LP', true);
    } catch (e) {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('totalXP', 'desc'), limit(100)));
      const sorted = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.battleLP || 0) - (a.battleLP || 0))
        .slice(0, limitCount);
      return sorted.map((u, i) => ({
        id: u.id,
        rank: i + 1,
        displayName: u.displayName || 'Usuário',
        photoURL: u.photoURL,
        level: u.level || 1,
        score: u.battleLP || 0,
        scoreLabel: 'LP',
        battleTier: getTierFromLP(u.battleLP || 0),
        battleWins: u.battleWins || 0,
        battleLosses: u.battleLosses || 0,
        battlePlayed: u.battlePlayed || 0,
        isBattle: true,
      }));
    }
  }

  async getCategoryLeaderboard(categoryId, limitCount = 50) {
    try {
      const snap = await getDocs(
        query(collection(db, 'users'), orderBy('totalXP', 'desc'), limit(100))
      );
      const users = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .map((u) => ({
          ...u,
          categoryScore: u.categoryXP?.[categoryId] || 0,
        }))
        .filter((u) => u.categoryScore > 0)
        .sort((a, b) => b.categoryScore - a.categoryScore)
        .slice(0, limitCount);

      return users.map((u, i) => ({
        id: u.id,
        rank: i + 1,
        displayName: u.displayName || 'Usuário',
        photoURL: u.photoURL,
        level: u.level || 1,
        score: u.categoryScore,
        scoreLabel: 'XP',
        category: categoryId,
        streak: u.streak || 0,
      }));
    } catch (e) {
      console.error('Ranking categoria:', e);
      return [];
    }
  }

  _mapRanked(docs, scoreFn, scoreLabel, isBattle = false) {
    return docs.map((d, i) => {
      const u = { id: d.id, ...d.data() };
      const entry = {
        id: u.id,
        rank: i + 1,
        displayName: u.displayName || 'Usuário',
        photoURL: u.photoURL,
        level: u.level || 1,
        score: scoreFn(u),
        scoreLabel,
        streak: u.streak || 0,
        totalXP: u.totalXP || 0,
      };
      if (isBattle) {
        entry.battleTier = getTierFromLP(u.battleLP || 0);
        entry.battleWins = u.battleWins || 0;
        entry.battleLosses = u.battleLosses || 0;
        entry.battlePlayed = u.battlePlayed || 0;
        entry.isBattle = true;
      }
      return entry;
    });
  }

  async getUserRanks(userId) {
    const [general, battle, ...categoryBoards] = await Promise.all([
      this.getGeneralLeaderboard(100),
      this.getBattleLeaderboard(100),
      ...RANKING_CATEGORIES.map((c) => this.getCategoryLeaderboard(c.id, 100)),
    ]);

    return {
      general: general.findIndex((u) => u.id === userId) + 1 || null,
      battle: battle.findIndex((u) => u.id === userId) + 1 || null,
      categories: RANKING_CATEGORIES.reduce((acc, cat, i) => {
        const pos = categoryBoards[i].findIndex((u) => u.id === userId) + 1;
        acc[cat.id] = pos || null;
        return acc;
      }, {}),
    };
  }
}

export default new RankingService();
