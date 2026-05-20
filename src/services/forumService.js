import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  increment,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const FORUM_CATEGORIES = [
  { id: 'Geral', label: 'Geral', emoji: '💬' },
  { id: 'Programação', label: 'Programação', emoji: '💻' },
  { id: 'Matemática', label: 'Matemática', emoji: '📐' },
  { id: 'Inglês', label: 'Inglês', emoji: '🇬🇧' },
  { id: 'Dúvidas', label: 'Dúvidas', emoji: '❓' },
  { id: 'Dicas', label: 'Dicas de Estudo', emoji: '💡' },
  { id: 'Batalhas', label: 'Batalhas', emoji: '⚔️' },
];

class ForumService {
  async createTopic(user, userProfile, { title, content, category, tags = [] }) {
    const ref = await addDoc(collection(db, 'forumTopics'), {
      title: title.trim(),
      content: content.trim(),
      category,
      tags,
      authorId: user.uid,
      authorName: userProfile.displayName || 'Usuário',
      authorPhoto: userProfile.photoURL || null,
      authorLevel: userProfile.level || 1,
      upvotes: 0,
      upvotedBy: [],
      replyCount: 0,
      views: 0,
      isPinned: false,
      isSolved: false,
      solvedReplyId: null,
      lastReplyPreview: null,
      lastReplyAuthor: null,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
    });
    return ref.id;
  }

  async getTopics({ category = 'all', sortBy = 'recent' } = {}) {
    try {
      let constraints = [];
      if (category !== 'all') {
        constraints.push(where('category', '==', category));
      }

      const sortField =
        sortBy === 'popular' ? 'upvotes' : sortBy === 'active' ? 'lastActivity' : 'createdAt';

      const q = query(collection(db, 'forumTopics'), ...constraints, orderBy(sortField, 'desc'));
      const snapshot = await getDocs(q);
      const topics = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      return topics.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
    } catch (error) {
      console.error('Erro ao carregar tópicos:', error);
      const snapshot = await getDocs(collection(db, 'forumTopics'));
      let topics = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (category !== 'all') topics = topics.filter((t) => t.category === category);
      return topics.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
      });
    }
  }

  subscribeTopics({ category, sortBy }, callback) {
    return this.getTopics({ category, sortBy }).then(callback);
  }

  async getTopic(topicId, incrementView = false) {
    const topicRef = doc(db, 'forumTopics', topicId);
    const snap = await getDoc(topicRef);
    if (!snap.exists()) return null;
    if (incrementView) {
      await updateDoc(topicRef, { views: increment(1) }).catch(() => {});
    }
    return { id: snap.id, ...snap.data() };
  }

  async getReplies(topicId) {
    try {
      const q = query(
        collection(db, 'forumReplies'),
        where('topicId', '==', topicId),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      const q = query(collection(db, 'forumReplies'), where('topicId', '==', topicId));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
    }
  }

  subscribeTopic(topicId, callback) {
    const topicRef = doc(db, 'forumTopics', topicId);
    const repliesQ = query(
      collection(db, 'forumReplies'),
      where('topicId', '==', topicId),
      orderBy('createdAt', 'asc')
    );

    let topic = null;
    let replies = [];

    const emit = () => callback({ topic, replies });

    const unsubTopic = onSnapshot(topicRef, (snap) => {
      if (snap.exists()) {
        topic = { id: snap.id, ...snap.data() };
      }
      emit();
    });

    const unsubReplies = onSnapshot(
      repliesQ,
      (snap) => {
        replies = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      () => {
        getDocs(query(collection(db, 'forumReplies'), where('topicId', '==', topicId))).then(
          (snap) => {
            replies = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            emit();
          }
        );
      }
    );

    return () => {
      unsubTopic();
      unsubReplies();
    };
  }

  async addReply(topicId, user, userProfile, content, quoteReplyId = null) {
    const text = content.trim();
    const replyRef = await addDoc(collection(db, 'forumReplies'), {
      topicId,
      content: text,
      quoteReplyId,
      authorId: user.uid,
      authorName: userProfile.displayName || 'Usuário',
      authorPhoto: userProfile.photoURL || null,
      authorLevel: userProfile.level || 1,
      upvotes: 0,
      upvotedBy: [],
      isAccepted: false,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'forumTopics', topicId), {
      replyCount: increment(1),
      lastActivity: serverTimestamp(),
      lastReplyPreview: text.slice(0, 120),
      lastReplyAuthor: userProfile.displayName || 'Usuário',
    });

    return replyRef.id;
  }

  async toggleVote(collectionName, docId, userId, upvotedBy = []) {
    const ref = doc(db, collectionName, docId);
    const hasVoted = upvotedBy.includes(userId);
    await updateDoc(ref, {
      upvotes: increment(hasVoted ? -1 : 1),
      upvotedBy: hasVoted ? arrayRemove(userId) : arrayUnion(userId),
    });
  }

  async markAsSolved(topicId, replyId, userId) {
    const topic = await this.getTopic(topicId);
    if (topic.authorId !== userId) throw new Error('Apenas o autor pode marcar como resolvido');

    await updateDoc(doc(db, 'forumTopics', topicId), {
      isSolved: true,
      solvedReplyId: replyId,
    });
    await updateDoc(doc(db, 'forumReplies', replyId), { isAccepted: true });
  }

  async deleteTopic(topicId, userId) {
    const topic = await this.getTopic(topicId);
    if (topic.authorId !== userId) throw new Error('Sem permissão');

    const replies = await getDocs(
      query(collection(db, 'forumReplies'), where('topicId', '==', topicId))
    );
    await Promise.all(replies.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'forumTopics', topicId));
  }

  async deleteReply(replyId, userId) {
    const snap = await getDoc(doc(db, 'forumReplies', replyId));
    if (!snap.exists() || snap.data().authorId !== userId) throw new Error('Sem permissão');

    const topicId = snap.data().topicId;
    await deleteDoc(doc(db, 'forumReplies', replyId));
    await updateDoc(doc(db, 'forumTopics', topicId), {
      replyCount: increment(-1),
    });
  }

  async editTopic(topicId, userId, { title, content }) {
    const topic = await this.getTopic(topicId);
    if (topic.authorId !== userId) throw new Error('Sem permissão');
    await updateDoc(doc(db, 'forumTopics', topicId), {
      title: title.trim(),
      content: content.trim(),
      editedAt: serverTimestamp(),
    });
  }

  async editReply(replyId, userId, content) {
    const snap = await getDoc(doc(db, 'forumReplies', replyId));
    if (!snap.exists() || snap.data().authorId !== userId) throw new Error('Sem permissão');
    await updateDoc(doc(db, 'forumReplies', replyId), {
      content: content.trim(),
      editedAt: serverTimestamp(),
    });
  }
}

export default new ForumService();
