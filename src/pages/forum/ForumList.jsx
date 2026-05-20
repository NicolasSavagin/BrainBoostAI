import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  ThumbsUp,
  MessageCircle,
  Eye,
  Clock,
  Search,
  Pin,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { useAuthStore } from '../../store';
import forumService, { FORUM_CATEGORIES } from '../../services/forumService';
import { notify } from '../../services/notificationService';

function formatDate(timestamp) {
  if (!timestamp) return 'Agora';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return 'Agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString('pt-BR');
}

export default function ForumList() {
  const { user, userProfile } = useAuthStore();
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '', category: 'Geral', tags: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTopics();
    const interval = setInterval(loadTopics, 15000);
    return () => clearInterval(interval);
  }, [selectedCategory, sortBy]);

  const loadTopics = async () => {
    try {
      const data = await forumService.getTopics({ category: selectedCategory, sortBy });
      setTopics(data);
    } finally {
      setLoading(false);
    }
  };

  const createTopic = async () => {
    if (!newTopic.title.trim() || !newTopic.content.trim()) {
      notify(user.uid, { type: 'warning', message: 'Preencha título e conteúdo' });
      return;
    }
    setSubmitting(true);
    try {
      const id = await forumService.createTopic(user, userProfile, {
        title: newTopic.title,
        content: newTopic.content,
        category: newTopic.category,
        tags: newTopic.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      notify(user.uid, { type: 'success', message: 'Tópico publicado!' });
      setShowNewTopic(false);
      setNewTopic({ title: '', content: '', category: 'Geral', tags: '' });
      navigate(`/forum/topic/${id}`);
    } catch (e) {
      notify(user.uid, { type: 'error', message: 'Erro ao publicar tópico' });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = topics.filter(
    (t) =>
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: topics.length,
    solved: topics.filter((t) => t.isSolved).length,
    hot: topics.filter((t) => (t.replyCount || 0) >= 5).length,
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="lg:w-64 shrink-0 space-y-4">
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Categorias</h3>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                selectedCategory === 'all'
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              📋 Todas
            </button>
            {FORUM_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  selectedCategory === cat.id
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card text-sm space-y-2">
          <p className="flex justify-between">
            <span className="text-gray-500">Tópicos</span>
            <span className="font-semibold">{stats.total}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-500">Resolvidos</span>
            <span className="font-semibold text-green-600">{stats.solved}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-500">Em alta</span>
            <span className="font-semibold text-orange-600">{stats.hot}</span>
          </p>
        </div>
      </aside>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fórum</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Discussões, dúvidas e troca de conhecimento entre estudantes
            </p>
          </div>
          <button type="button" onClick={() => setShowNewTopic(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Novo tópico
          </button>
        </div>

        <div className="card flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar discussões..."
              className="input-field pl-10"
            />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field sm:w-44">
            <option value="recent">Mais recentes</option>
            <option value="active">Mais ativos</option>
            <option value="popular">Mais votados</option>
          </select>
        </div>

        {loading ? (
          <div className="card py-16 text-center text-gray-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="card py-16 text-center">
            <MessageSquare className="w-14 h-14 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">Nenhuma discussão encontrada</p>
            <button type="button" onClick={() => setShowNewTopic(true)} className="btn-primary">
              Criar primeiro tópico
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((topic) => (
              <Link
                key={topic.id}
                to={`/forum/topic/${topic.id}`}
                className={`card block hover:shadow-md transition-all ${
                  topic.isPinned ? 'border-l-4 border-l-yellow-500' : ''
                }`}
              >
                <div className="flex gap-4">
                  <div className="flex flex-col items-center min-w-[48px] pt-1">
                    <ThumbsUp size={18} className="text-gray-400" />
                    <span className="font-bold text-sm">{topic.upvotes || 0}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {topic.isPinned && <Pin size={14} className="text-yellow-500" />}
                      {topic.isSolved && (
                        <span className="badge bg-green-100 dark:bg-green-900/40 text-green-700 text-xs flex items-center gap-1">
                          <CheckCircle2 size={12} /> Resolvido
                        </span>
                      )}
                      <span className="badge bg-gray-100 dark:bg-gray-700 text-xs">{topic.category}</span>
                      {(topic.replyCount || 0) >= 5 && (
                        <span className="badge bg-orange-100 text-orange-700 text-xs flex items-center gap-1">
                          <Flame size={12} /> Popular
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{topic.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{topic.content}</p>
                    {topic.lastReplyPreview && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        Última resposta por <strong>{topic.lastReplyAuthor}</strong>: {topic.lastReplyPreview}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      <span>{topic.authorName}</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={12} /> {topic.replyCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={12} /> {topic.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {formatDate(topic.lastActivity || topic.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showNewTopic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Novo tópico</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Categoria</label>
                <select
                  value={newTopic.category}
                  onChange={(e) => setNewTopic({ ...newTopic, category: e.target.value })}
                  className="input-field"
                >
                  {FORUM_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Título</label>
                <input
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  className="input-field"
                  placeholder="Seja claro e objetivo"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Conteúdo</label>
                <textarea
                  value={newTopic.content}
                  onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                  rows={8}
                  className="input-field"
                  placeholder="Descreva sua dúvida ou compartilhe conhecimento..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tags (opcional)</label>
                <input
                  value={newTopic.tags}
                  onChange={(e) => setNewTopic({ ...newTopic, tags: e.target.value })}
                  className="input-field"
                  placeholder="javascript, arrays, dica"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={createTopic} disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Publicando...' : 'Publicar'}
                </button>
                <button type="button" onClick={() => setShowNewTopic(false)} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
