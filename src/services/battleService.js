import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import aiService from './aiService';

const BOT_PROFILE = {
  uid: 'bot-challenger',
  displayName: 'IA Challenger',
  photoURL: null,
  level: 5,
  isBot: true,
};

const ROUND_TIME_SEC = 20;
const TOTAL_ROUNDS = 5;
const MATCH_TIMEOUT_MS = 8000;

export const BATTLE_TOPICS = [
  'Programação - JavaScript',
  'Programação - Python',
  'Matemática - Álgebra',
  'Matemática - Geometria',
  'Inglês - Gramática',
  'Inglês - Vocabulário',
];

class BattleService {
  async setPresence(userId, online = true) {
    await setDoc(
      doc(db, 'battlePresence', userId),
      {
        userId,
        online,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async getOnlineCount() {
    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const q = query(
        collection(db, 'battlePresence'),
        where('online', '==', true),
        where('lastSeen', '>=', fiveMinAgo)
      );
      const snap = await getDocs(q);
      return snap.size;
    } catch {
      const snap = await getDocs(collection(db, 'battlePresence'));
      return snap.docs.filter((d) => d.data().online).length;
    }
  }

  buildPlayer(uid, profile, isBot = false) {
    return {
      uid,
      displayName: profile.displayName || 'Jogador',
      photoURL: profile.photoURL || null,
      level: profile.level || 1,
      isBot,
      score: 0,
      answers: [],
    };
  }

  async createBattle(player1, player2, topic, difficulty, questions) {
    const battleRef = doc(collection(db, 'battles'));
    const now = Date.now();

    await setDoc(battleRef, {
      player1,
      player2,
      topic,
      difficulty,
      questions,
      status: 'playing',
      currentRound: 0,
      totalRounds: TOTAL_ROUNDS,
      roundTimeSec: ROUND_TIME_SEC,
      roundStartedAt: now,
      roundDeadline: now + ROUND_TIME_SEC * 1000,
      roundResults: [],
      winnerId: null,
      isDraw: false,
      createdAt: serverTimestamp(),
    });

    return battleRef.id;
  }

  async generateQuestions(topic, difficulty) {
    return aiService.generateBattleQuestions(topic, difficulty, TOTAL_ROUNDS);
  }

  async createBotBattle(userId, profile, topic, difficulty) {
    const questions = await this.generateQuestions(topic, difficulty);
    const player1 = this.buildPlayer(userId, profile);
    const player2 = this.buildPlayer(BOT_PROFILE.uid, BOT_PROFILE, true);

    return this.createBattle(player1, player2, topic, difficulty, questions);
  }

  async createPvPBattle(userId, profile, opponentId, opponentData, topic, difficulty) {
    const questions = await this.generateQuestions(topic, difficulty);
    const player1 = this.buildPlayer(userId, profile);
    const player2 = this.buildPlayer(opponentId, {
      displayName: opponentData.displayName,
      photoURL: opponentData.photoURL,
      level: opponentData.level,
    });

    const battleId = await this.createBattle(player1, player2, topic, difficulty, questions);

    await deleteDoc(doc(db, 'battleQueue', userId)).catch(() => {});
    await deleteDoc(doc(db, 'battleQueue', opponentId)).catch(() => {});

    await setDoc(doc(db, 'battleQueue', opponentId), { battleId, status: 'matched' }, { merge: true });

    return battleId;
  }

  async findOpponentInQueue(userId, topic) {
    const q = query(
      collection(db, 'battleQueue'),
      where('topic', '==', topic),
      where('status', '==', 'searching'),
      orderBy('createdAt', 'asc'),
      limit(5)
    );

    try {
      const snap = await getDocs(q);
      return snap.docs.find((d) => d.id !== userId) || null;
    } catch {
      const snap = await getDocs(collection(db, 'battleQueue'));
      return (
        snap.docs.find(
          (d) => d.id !== userId && d.data().topic === topic && d.data().status === 'searching'
        ) || null
      );
    }
  }

  async joinQueue(userId, profile, topic, difficulty) {
    await this.setPresence(userId, true);

    const opponentDoc = await this.findOpponentInQueue(userId, topic);

    if (opponentDoc) {
      return this.createPvPBattle(
        userId,
        profile,
        opponentDoc.id,
        opponentDoc.data(),
        topic,
        difficulty
      );
    }

    await setDoc(doc(db, 'battleQueue', userId), {
      userId,
      displayName: profile.displayName || 'Jogador',
      photoURL: profile.photoURL || null,
      level: profile.level || 1,
      topic,
      difficulty,
      status: 'searching',
      battleId: null,
      createdAt: serverTimestamp(),
    });

    return new Promise((resolve, reject) => {
      let resolved = false;
      const queueRef = doc(db, 'battleQueue', userId);

      const unsub = onSnapshot(queueRef, (snap) => {
        const data = snap.data();
        if (data?.battleId && !resolved) {
          resolved = true;
          unsub();
          clearTimeout(timeoutId);
          deleteDoc(queueRef).catch(() => {});
          resolve(data.battleId);
        }
      });

      const timeoutId = setTimeout(async () => {
        if (resolved) return;
        resolved = true;
        unsub();

        const snap = await getDoc(queueRef);
        if (snap.exists() && !snap.data().battleId) {
          try {
            const battleId = await this.createBotBattle(userId, profile, topic, difficulty);
            await deleteDoc(queueRef).catch(() => {});
            resolve(battleId);
          } catch (e) {
            await deleteDoc(queueRef).catch(() => {});
            reject(e);
          }
        }
      }, MATCH_TIMEOUT_MS);
    });
  }

  async cancelQueue(userId) {
    await deleteDoc(doc(db, 'battleQueue', userId)).catch(() => {});
    await this.setPresence(userId, false);
  }

  subscribeBattle(battleId, callback) {
    return onSnapshot(doc(db, 'battles', battleId), (snap) => {
      if (snap.exists()) callback({ id: snap.id, ...snap.data() });
    });
  }

  getMyPlayerKey(battle, userId) {
    if (battle.player1?.uid === userId) return 'player1';
    if (battle.player2?.uid === userId) return 'player2';
    return null;
  }

  getOpponentKey(myKey) {
    return myKey === 'player1' ? 'player2' : 'player1';
  }

  async submitAnswer(battleId, userId, answer, timeMs) {
    const battleRef = doc(db, 'battles', battleId);
    const snap = await getDoc(battleRef);
    if (!snap.exists()) return;

    const battle = snap.data();
    if (battle.status !== 'playing') return;

    const myKey = this.getMyPlayerKey(battle, userId);
    if (!myKey) return;

    const round = battle.currentRound;
    const question = battle.questions[round];
    if (!question) return;

    const already = battle[myKey].answers?.some((a) => a.round === round);
    if (already) return;

    const isCorrect = answer === question.correctAnswer;
    const speedBonus = isCorrect ? Math.max(0, Math.floor((ROUND_TIME_SEC * 1000 - timeMs) / 200)) : 0;
    const points = isCorrect ? 100 + speedBonus : 0;

    const newAnswer = {
      round,
      answer,
      isCorrect,
      points,
      timeMs,
      timestamp: Date.now(),
    };

    const updatedPlayer = {
      ...battle[myKey],
      score: (battle[myKey].score || 0) + points,
      answers: [...(battle[myKey].answers || []), newAnswer],
    };

    await updateDoc(battleRef, { [myKey]: updatedPlayer });

    const fresh = await getDoc(battleRef);
    const data = fresh.data();
    await this.tryAdvanceRound(battleId, data);
  }

  botAccuracy(difficulty) {
    const map = { 1: 0.85, 2: 0.75, 3: 0.65, 4: 0.55, 5: 0.45 };
    return map[difficulty] || 0.65;
  }

  async simulateBotAnswer(battleId, battle) {
    if (battle.player2?.uid !== BOT_PROFILE.uid) return;

    const round = battle.currentRound;
    const question = battle.questions[round];
    if (!question) return;

    const already = battle.player2.answers?.some((a) => a.round === round);
    if (already) return;

    const delay = 2000 + Math.random() * 4000;
    await new Promise((r) => setTimeout(r, delay));

    const freshSnap = await getDoc(doc(db, 'battles', battleId));
    const fresh = freshSnap.data();
    if (fresh.currentRound !== round || fresh.status !== 'playing') return;

    const correct = Math.random() < this.botAccuracy(fresh.difficulty);
    const answer = correct
      ? question.correctAnswer
      : question.options[Math.floor(Math.random() * question.options.length)];

    const timeMs = delay;
    const isCorrect = answer === question.correctAnswer;
    const speedBonus = isCorrect ? Math.max(0, Math.floor((ROUND_TIME_SEC * 1000 - timeMs) / 200)) : 0;
    const points = isCorrect ? 80 + speedBonus : 0;

    const newAnswer = {
      round,
      answer,
      isCorrect,
      points,
      timeMs,
      timestamp: Date.now(),
    };

    await updateDoc(doc(db, 'battles', battleId), {
      player2: {
        ...fresh.player2,
        score: (fresh.player2.score || 0) + points,
        answers: [...(fresh.player2.answers || []), newAnswer],
      },
    });

    const after = await getDoc(doc(db, 'battles', battleId));
    await this.tryAdvanceRound(battleId, after.data());
  }

  async tryAdvanceRound(battleId, battle) {
    const round = battle.currentRound;
    const p1Answered = battle.player1.answers?.some((a) => a.round === round);
    const p2Answered = battle.player2.answers?.some((a) => a.round === round);

    if (!p1Answered || !p2Answered) {
      if (battle.player2?.isBot && p1Answered && !p2Answered) {
        this.simulateBotAnswer(battleId, battle);
      }
      return;
    }

    const q = battle.questions[round];
    const p1a = battle.player1.answers.find((a) => a.round === round);
    const p2a = battle.player2.answers.find((a) => a.round === round);

    const roundResult = {
      round,
      question: q.question,
      player1Correct: p1a.isCorrect,
      player2Correct: p2a.isCorrect,
      player1Points: p1a.points,
      player2Points: p2a.points,
    };

    const nextRound = round + 1;
    const isFinished = nextRound >= battle.totalRounds;

    const updates = {
      roundResults: [...(battle.roundResults || []), roundResult],
    };

    if (isFinished) {
      const s1 = battle.player1.score;
      const s2 = battle.player2.score;
      updates.status = 'finished';
      updates.isDraw = s1 === s2;
      updates.winnerId = s1 > s2 ? battle.player1.uid : s2 > s1 ? battle.player2.uid : null;
    } else {
      const now = Date.now();
      updates.currentRound = nextRound;
      updates.roundStartedAt = now;
      updates.roundDeadline = now + ROUND_TIME_SEC * 1000;
    }

    await updateDoc(doc(db, 'battles', battleId), updates);
  }

  async forceTimeout(battleId, userId) {
    const snap = await getDoc(doc(db, 'battles', battleId));
    if (!snap.exists()) return;
    const battle = snap.data();
    if (battle.status !== 'playing') return;

    const myKey = this.getMyPlayerKey(battle, userId);
    if (!myKey) return;

    const round = battle.currentRound;
    const answered = battle[myKey].answers?.some((a) => a.round === round);
    if (!answered) {
      await this.submitAnswer(battleId, userId, '', ROUND_TIME_SEC * 1000);
    }
  }
}

export default new BattleService();
