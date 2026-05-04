// src/pages/Forum.jsx - FÓRUM COMPLETO COM DISCUSSÕES

import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  ThumbsUp, 
  MessageCircle,
  Eye,
  Clock,
  TrendingUp,
  Star,
  Search,
  Filter,
  Send,
  X,
  User,
  Award,
  Pin
} from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../store';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs,
  updateDoc,
  doc,
  increment,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Forum() {
  const { user, userProfile } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [showTopicDetail, setShowTopicDetail] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, popular, trending

  // New Topic Form
  const [newTopic, setNewTopic] = useState({
    title: '',
    content: '',
    category: 'Geral'
  });

  // Reply Form
  const [replyContent, setReplyContent] = useState('');

  const categories = [
    { id: 'all', label: 'Todas', icon: MessageSquare },
    { id: 'Geral', label: 'Geral', icon: MessageCircle },
    { id: 'Programação', label: 'Programação', icon: '💻' },
    { id: 'Matemática', label: 'Matemática', icon: '📐' },
    { id: 'Inglês', label: 'Inglês', icon: '🇬🇧' },
    { id: 'Dúvidas', label: 'Dúvidas', icon: '❓' },
    { id: 'Conquistas', label: 'Conquistas', icon: '🏆' },
  ];

  useEffect(() => {
    loadTopics();
  }, [sortBy, selectedCategory]);

  const loadTopics = async () => {
    try {
      setLoading(true);
      
      let q = collection(db, 'forumTopics');
      
      if (selectedCategory !== 'all') {
        q = query(q, where('category', '==', selectedCategory));
      }

      // Ordenação
      if (sortBy === 'recent') {
        q = query(q, orderBy('createdAt', 'desc'));
      } else if (sortBy === 'popular') {
        q = query(q, orderBy('upvotes', 'desc'));
      } else if (sortBy === 'trending') {
        q = query(q, orderBy('replyCount', 'desc'));
      }

      const snapshot = await getDocs(q);
      const topicsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTopics(topicsData);
    } catch (error) {
      console.error('Erro ao carregar tópicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTopic = async () => {
    if (!newTopic.title.trim() || !newTopic.content.trim()) {
      addNotification({
        type: 'warning',
        message: 'Preencha título e conteúdo'
      });
      return;
    }

    try {
      await addDoc(collection(db, 'forumTopics'), {
        ...newTopic,
        authorId: user.uid,
        authorName: userProfile.displayName || 'Usuário',
        authorPhoto: userProfile.photoURL || null,
        authorLevel: userProfile.level || 1,
        upvotes: 0,
        upvotedBy: [],
        replyCount: 0,
        views: 0,
        isPinned: false,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });

      addNotification({
        type: 'success',
        message: '✅ Tópico criado com sucesso!'
      });

      setShowNewTopicModal(false);
      setNewTopic({ title: '', content: '', category: 'Geral' });
      loadTopics();

    } catch (error) {
      console.error('Erro ao criar tópico:', error);
      addNotification({
        type: 'error',
        message: 'Erro ao criar tópico'
      });
    }
  };

  const upvoteTopic = async (topicId, upvotedBy = []) => {
    const topicRef = doc(db, 'forumTopics', topicId);
    const hasUpvoted = upvotedBy.includes(user.uid);

    try {
      await updateDoc(topicRef, {
        upvotes: increment(hasUpvoted ? -1 : 1),
        upvotedBy: hasUpvoted 
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid)
      });

      loadTopics();
    } catch (error) {
      console.error('Erro ao votar:', error);
    }
  };

  const viewTopic = async (topic) => {
    const topicRef = doc(db, 'forumTopics', topic.id);
    
    try {
      await updateDoc(topicRef, {
        views: increment(1)
      });

      // Carregar respostas
      const repliesQuery = query(
        collection(db, 'forumReplies'),
        where('topicId', '==', topic.id),
        orderBy('createdAt', 'asc')
      );

      const repliesSnapshot = await getDocs(repliesQuery);
      const replies = repliesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setShowTopicDetail({ ...topic, replies });
    } catch (error) {
      console.error('Erro ao abrir tópico:', error);
    }
  };

  const addReply = async () => {
    if (!replyContent.trim()) {
      addNotification({
        type: 'warning',
        message: 'Digite uma resposta'
      });
      return;
    }

    try {
      await addDoc(collection(db, 'forumReplies'), {
        topicId: showTopicDetail.id,
        content: replyContent,
        authorId: user.uid,
        authorName: userProfile.displayName || 'Usuário',
        authorPhoto: userProfile.photoURL || null,
        authorLevel: userProfile.level || 1,
        upvotes: 0,
        upvotedBy: [],
        createdAt: serverTimestamp()
      });

      // Atualizar contador de respostas
      const topicRef = doc(db, 'forumTopics', showTopicDetail.id);
      await updateDoc(topicRef, {
        replyCount: increment(1),
        lastActivity: serverTimestamp()
      });

      addNotification({
        type: 'success',
        message: '✅ Resposta enviada!'
      });

      setReplyContent('');
      
      // Recarregar tópico com novas respostas
      const updatedTopic = topics.find(t => t.id === showTopicDetail.id);
      if (updatedTopic) {
        viewTopic(updatedTopic);
      }

    } catch (error) {
      console.error('Erro ao adicionar resposta:', error);
      addNotification({
        type: 'error',
        message: 'Erro ao enviar resposta'
      });
    }
  };

  const upvoteReply = async (replyId, upvotedBy = []) => {
    const replyRef = doc(db, 'forumReplies', replyId);
    const hasUpvoted = upvotedBy.includes(user.uid);

    try {
      await updateDoc(replyRef, {
        upvotes: increment(hasUpvoted ? -1 : 1),
        upvotedBy: hasUpvoted 
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid)
      });

      // Recarregar respostas
      const updatedTopic = topics.find(t => t.id === showTopicDetail.id);
      if (updatedTopic) {
        viewTopic(updatedTopic);
      }
    } catch (error) {
      console.error('Erro ao votar:', error);
    }
  };

  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Agora';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // segundos

    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Fórum da Comunidade 💬
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Compartilhe conhecimento, tire dúvidas e conecte-se com outros estudantes
          </p>
        </div>

        <button
          onClick={() => setShowNewTopicModal(true)}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={20} />
          Novo Tópico
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar discussões..."
              className="input-field pl-10"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field md:w-48"
          >
            <option value="recent">Mais Recentes</option>
            <option value="popular">Mais Votados</option>
            <option value="trending">Mais Comentados</option>
          </select>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-2 border-primary-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {typeof Icon === 'string' ? (
                  <span>{Icon}</span>
                ) : (
                  <Icon size={16} />
                )}
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Topics List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando discussões...</p>
          </div>
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="card text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm ? 'Nenhuma discussão encontrada' : 'Seja o primeiro a criar uma discussão!'}
          </p>
          <button
            onClick={() => setShowNewTopicModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Criar Tópico
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTopics.map((topic) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card hover:shadow-lg transition-all cursor-pointer ${
                topic.isPinned ? 'border-2 border-yellow-500' : ''
              }`}
              onClick={() => viewTopic(topic)}
            >
              <div className="flex gap-4">
                
                {/* Vote Section */}
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      upvoteTopic(topic.id, topic.upvotedBy);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      topic.upvotedBy?.includes(user.uid)
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <ThumbsUp size={20} />
                  </button>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {topic.upvotes || 0}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {topic.isPinned && (
                          <Pin className="text-yellow-500" size={16} />
                        )}
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg hover:text-primary-600 transition-colors line-clamp-1">
                          {topic.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-2">
                        {topic.content}
                      </p>
                    </div>

                    <span className="badge bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                      {topic.category}
                    </span>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                        {topic.authorPhoto ? (
                          <img src={topic.authorPhoto} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          topic.authorName?.[0]?.toUpperCase()
                        )}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {topic.authorName}
                      </span>
                      <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs">
                        Nível {topic.authorLevel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <MessageCircle size={14} />
                      <span>{topic.replyCount || 0}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      <span>{topic.views || 0}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{formatDate(topic.lastActivity || topic.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Topic Modal */}
      <AnimatePresence>
        {showNewTopicModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewTopicModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Plus className="text-primary-600" size={28} />
                  Novo Tópico
                </h2>
                <button
                  onClick={() => setShowNewTopicModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoria
                  </label>
                  <select
                    value={newTopic.category}
                    onChange={(e) => setNewTopic({ ...newTopic, category: e.target.value })}
                    className="input-field"
                  >
                    {categories.filter(c => c.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={newTopic.title}
                    onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                    placeholder="Ex: Como melhorar meu desempenho em JavaScript?"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Conteúdo
                  </label>
                  <textarea
                    value={newTopic.content}
                    onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                    placeholder="Descreva sua dúvida, compartilhe conhecimento ou inicie uma discussão..."
                    rows={8}
                    className="input-field"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={createTopic}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Publicar Tópico
                  </button>
                  <button
                    onClick={() => setShowNewTopicModal(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Topic Detail Modal */}
      <AnimatePresence>
        {showTopicDetail && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTopicDetail(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Topic Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {showTopicDetail.isPinned && (
                      <Pin className="text-yellow-500" size={20} />
                    )}
                    <span className="badge bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {showTopicDetail.category}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {showTopicDetail.title}
                  </h2>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                        {showTopicDetail.authorPhoto ? (
                          <img src={showTopicDetail.authorPhoto} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          showTopicDetail.authorName?.[0]?.toUpperCase()
                        )}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {showTopicDetail.authorName}
                      </span>
                      <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs">
                        Nível {showTopicDetail.authorLevel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{formatDate(showTopicDetail.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      <span>{showTopicDetail.views} visualizações</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowTopicDetail(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Topic Content */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {showTopicDetail.content}
                </p>
              </div>

              {/* Vote Button */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => upvoteTopic(showTopicDetail.id, showTopicDetail.upvotedBy)}
                  className={`btn-secondary flex items-center gap-2 ${
                    showTopicDetail.upvotedBy?.includes(user.uid) ? 'bg-primary-100 dark:bg-primary-900 text-primary-600' : ''
                  }`}
                >
                  <ThumbsUp size={18} />
                  {showTopicDetail.upvotedBy?.includes(user.uid) ? 'Votado' : 'Votar'}
                  <span className="badge bg-gray-200 dark:bg-gray-700">
                    {showTopicDetail.upvotes || 0}
                  </span>
                </button>
              </div>

              {/* Replies */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                  <MessageCircle size={20} />
                  Respostas ({showTopicDetail.replies?.length || 0})
                </h3>

                {showTopicDetail.replies?.map((reply) => (
                  <div key={reply.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => upvoteReply(reply.id, reply.upvotedBy)}
                          className={`p-1 rounded transition-colors ${
                            reply.upvotedBy?.includes(user.uid)
                              ? 'bg-primary-100 dark:bg-primary-900 text-primary-600'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <ThumbsUp size={16} />
                        </button>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {reply.upvotes || 0}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                            {reply.authorPhoto ? (
                              <img src={reply.authorPhoto} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              reply.authorName?.[0]?.toUpperCase()
                            )}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {reply.authorName}
                          </span>
                          <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs">
                            Nível {reply.authorLevel}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {showTopicDetail.replies?.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Seja o primeiro a responder!
                    </p>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Adicionar Resposta
                </h4>
                <div className="space-y-3">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Compartilhe sua opinião ou ajude respondendo..."
                    rows={4}
                    className="input-field"
                  />
                  <button
                    onClick={addReply}
                    disabled={!replyContent.trim()}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Send size={18} />
                    Enviar Resposta
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}