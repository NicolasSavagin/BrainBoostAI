import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ThumbsUp,
  Send,
  CheckCircle2,
  Trash2,
  MessageCircle,
  Clock,
  Pin,
  Quote,
} from 'lucide-react';
import { useAuthStore } from '../../store';
import forumService from '../../services/forumService';
import { notify } from '../../services/notificationService';

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function ForumTopic() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuthStore();
  const repliesEndRef = useRef(null);

  const [topic, setTopic] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [quoteId, setQuoteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    forumService.getTopic(topicId, true);
    const unsub = forumService.subscribeTopic(topicId, ({ topic: t, replies: r }) => {
      setTopic(t);
      setReplies(r || []);
      setLoading(false);
    });
    return unsub;
  }, [topicId]);

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await forumService.addReply(topicId, user, userProfile, replyContent, quoteId);
      setReplyContent('');
      setQuoteId(null);
      notify(user.uid, { type: 'success', message: 'Resposta publicada!' });
    } catch (e) {
      notify(user.uid, { type: 'error', message: 'Erro ao responder' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteTopic = async () => {
    await forumService.toggleVote('forumTopics', topicId, user.uid, topic.upvotedBy);
  };

  const handleVoteReply = async (reply) => {
    await forumService.toggleVote('forumReplies', reply.id, user.uid, reply.upvotedBy);
  };

  const handleMarkSolved = async (replyId) => {
    try {
      await forumService.markAsSolved(topicId, replyId, user.uid);
      notify(user.uid, { type: 'success', message: 'Marcado como resolvido!' });
    } catch (e) {
      notify(user.uid, { type: 'error', message: e.message });
    }
  };

  const handleDeleteTopic = async () => {
    if (!confirm('Excluir este tópico permanentemente?')) return;
    await forumService.deleteTopic(topicId, user.uid);
    navigate('/forum');
  };

  const quoteReply = replies.find((r) => r.id === quoteId);

  if (loading) {
    return <div className="card py-20 text-center text-gray-500">Carregando discussão...</div>;
  }

  if (!topic) {
    return (
      <div className="card py-12 text-center">
        <p className="mb-4">Tópico não encontrado</p>
        <Link to="/forum" className="btn-primary">Voltar ao fórum</Link>
      </div>
    );
  }

  const isAuthor = topic.authorId === user.uid;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Link to="/forum" className="btn-secondary inline-flex items-center gap-2 text-sm">
        <ArrowLeft size={16} /> Voltar ao fórum
      </Link>

      <article className="card">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={handleVoteTopic}
              className={`p-2 rounded-lg ${
                topic.upvotedBy?.includes(user.uid)
                  ? 'bg-primary-100 text-primary-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <ThumbsUp size={22} />
            </button>
            <span className="font-bold">{topic.upvotes || 0}</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              {topic.isPinned && <Pin size={16} className="text-yellow-500" />}
              <span className="badge bg-primary-100 dark:bg-primary-900/40 text-primary-700">{topic.category}</span>
              {topic.isSolved && (
                <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Resolvido
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{topic.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
              <Link to={`/profile/${topic.authorId}`} className="font-medium hover:text-primary-600">
                {topic.authorName}
              </Link>
              <span>Nível {topic.authorLevel}</span>
              <span className="flex items-center gap-1">
                <Clock size={14} /> {formatDate(topic.createdAt)}
              </span>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {topic.content}
              </p>
            </div>
            {isAuthor && (
              <button
                type="button"
                onClick={handleDeleteTopic}
                className="mt-4 text-sm text-red-600 flex items-center gap-1 hover:underline"
              >
                <Trash2 size={14} /> Excluir tópico
              </button>
            )}
          </div>
        </div>
      </article>

      <section className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <MessageCircle size={20} />
          {replies.length} {replies.length === 1 ? 'resposta' : 'respostas'}
        </h2>

        {replies.map((reply) => (
          <div
            key={reply.id}
            className={`card ${
              reply.isAccepted || topic.solvedReplyId === reply.id
                ? 'border-2 border-green-500 bg-green-50/30 dark:bg-green-900/10'
                : ''
            }`}
          >
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleVoteReply(reply)}
                  className={`p-1 rounded ${
                    reply.upvotedBy?.includes(user.uid) ? 'text-primary-600' : 'text-gray-400'
                  }`}
                >
                  <ThumbsUp size={16} />
                </button>
                <span className="text-xs font-bold">{reply.upvotes || 0}</span>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2 text-sm">
                  <Link to={`/profile/${reply.authorId}`} className="font-medium hover:text-primary-600">
                    {reply.authorName}
                  </Link>
                  <span className="text-gray-400">Nível {reply.authorLevel}</span>
                  <span className="text-gray-400">{formatDate(reply.createdAt)}</span>
                  {reply.isAccepted && (
                    <span className="badge bg-green-100 text-green-700 text-xs">✓ Solução</span>
                  )}
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reply.content}</p>
                <div className="flex gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteId(reply.id);
                      setReplyContent(`> ${reply.content.slice(0, 100)}...\n\n`);
                    }}
                    className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    <Quote size={12} /> Citar
                  </button>
                  {isAuthor && !topic.isSolved && topic.category === 'Dúvidas' && (
                    <button
                      type="button"
                      onClick={() => handleMarkSolved(reply.id)}
                      className="text-xs text-green-600 hover:underline flex items-center gap-1"
                    >
                      <CheckCircle2 size={12} /> Marcar como solução
                    </button>
                  )}
                  {reply.authorId === user.uid && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Excluir resposta?')) {
                          await forumService.deleteReply(reply.id, user.uid);
                        }
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={repliesEndRef} />
      </section>

      <div className="card sticky bottom-4">
        {quoteReply && (
          <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm flex justify-between">
            <span className="text-gray-500 truncate">Citando {quoteReply.authorName}</span>
            <button type="button" onClick={() => setQuoteId(null)} className="text-xs text-red-500">
              Remover
            </button>
          </div>
        )}
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          rows={4}
          className="input-field mb-3"
          placeholder="Escreva sua resposta... (suporta quebras de linha)"
        />
        <button
          type="button"
          onClick={handleReply}
          disabled={submitting || !replyContent.trim()}
          className="btn-primary flex items-center gap-2"
        >
          <Send size={18} />
          {submitting ? 'Enviando...' : 'Publicar resposta'}
        </button>
      </div>
    </div>
  );
}
