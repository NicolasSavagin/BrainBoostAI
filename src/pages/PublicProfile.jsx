import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User,
  MapPin,
  Trophy,
  Flame,
  Target,
  BookOpen,
  Globe,
  Github,
  Linkedin,
  Award,
  ArrowLeft,
  ExternalLink,
  Code,
  GraduationCap,
  Briefcase,
  Shield,
} from 'lucide-react';
import profileService from '../services/profileService';
import { ACHIEVEMENT_CATALOG } from '../config/achievements';
import TierBadge from '../components/rankings/TierBadge';
import { useAuthStore } from '../store';

const ACHIEVEMENT_NAMES = Object.fromEntries(
  ACHIEVEMENT_CATALOG.map((a) => [a.id, a.name])
);

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const isOwnProfile = currentUser?.uid === userId;

  useEffect(() => {
    if (userId) loadPublicProfile();
  }, [userId]);

  const loadPublicProfile = async () => {
    try {
      setLoading(true);
      const [publicProfile, profileStats] = await Promise.all([
        profileService.getPublicProfile(userId),
        profileService.getProfileStats(userId),
      ]);
      setProfile(publicProfile);
      setStats(profileStats);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile?.user) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/community')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="card text-center py-12">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Perfil não encontrado</p>
        </div>
      </div>
    );
  }

  const u = profile.user;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate('/community')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={18} /> Voltar para Comunidade
        </button>
        {isOwnProfile && (
          <Link to="/profile" className="btn-primary text-sm">
            Editar meu perfil
          </Link>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-primary-500 to-purple-600">
          {u.bannerURL && <img src={u.bannerURL} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
              {u.photoURL ? (
                <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                u.displayName?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{u.displayName || 'Usuário'}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">{u.headline || 'Estudante na plataforma'}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                {u.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={16} /> {u.location}
                  </span>
                )}
                <span className="badge bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                  Nível {u.level || 1}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { icon: Flame, val: u.streak || 0, label: 'Streak', color: 'text-orange-500' },
              { icon: Trophy, val: u.totalXP || 0, label: 'XP Total', color: 'text-yellow-500' },
              { icon: Award, val: u.achievements?.length || 0, label: 'Conquistas', color: 'text-purple-500' },
              { icon: Target, val: `${u.accuracy || 0}%`, label: 'Precisão', color: 'text-green-500' },
            ].map((s, i) => (
              <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <s.icon className={`w-8 h-8 mx-auto mb-2 ${s.color}`} />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {(u.battleLP > 0 || u.battlePlayed > 0) && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Liga de batalha</p>
              <div className="flex flex-wrap items-center gap-3">
                <TierBadge tierId={u.battleTier} lp={u.battleLP || 0} showLP />
                <span className="text-sm text-gray-600">
                  {u.battleWins || 0}V • {u.battleLosses || 0}D • {u.battlePlayed || 0} partidas
                </span>
              </div>
            </div>
          )}

          {(u.website || u.github || u.linkedin) && (
            <div className="flex gap-3 mt-4">
              {u.website && (
                <a href={u.website} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Globe size={20} />
                </a>
              )}
              {u.github && (
                <a href={`https://github.com/${u.github}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Github size={20} />
                </a>
              )}
              {u.linkedin && (
                <a href={`https://linkedin.com/in/${u.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Linkedin size={20} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Formações', n: stats.educationCount },
            { label: 'Experiências', n: stats.experiencesCount },
            { label: 'Habilidades', n: stats.skillsCount },
            { label: 'Certificações', n: stats.certificationsCount },
            { label: 'Projetos', n: stats.projectsCount },
          ].map((item) => (
            <div key={item.label} className="card text-center py-3">
              <p className="text-xl font-bold text-gray-900 dark:text-white">{item.n}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {u.bio && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sobre</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{u.bio}</p>
        </div>
      )}

      {profile.education?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <GraduationCap className="text-primary-600" size={24} />
            Formação Acadêmica ({profile.education.length})
          </h3>
          <div className="space-y-4">
            {profile.education.map((edu) => (
              <div key={edu.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white">{edu.institution}</h4>
                <p className="text-primary-600 dark:text-primary-400 text-sm">
                  {edu.degree} {edu.fieldOfStudy && `• ${edu.fieldOfStudy}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {edu.startDate} — {edu.current ? 'Atual' : edu.endDate || '—'}
                </p>
                {edu.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.experiences?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase className="text-blue-600" size={24} />
            Experiência Profissional ({profile.experiences.length})
          </h3>
          <div className="space-y-4">
            {profile.experiences.map((exp) => (
              <div key={exp.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white">{exp.position}</h4>
                <p className="text-gray-600 dark:text-gray-400">{exp.company}</p>
                {exp.location && <p className="text-xs text-gray-500">{exp.location}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  {exp.startDate} — {exp.current ? 'Atual' : exp.endDate || '—'}
                </p>
                {exp.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.certifications?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="text-green-600" size={24} />
            Certificações ({profile.certifications.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.certifications.map((cert) => (
              <div key={cert.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white">{cert.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{cert.issuer}</p>
                <p className="text-xs text-gray-500 mt-1">Emitido em {cert.issueDate}</p>
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 mt-2 inline-flex items-center gap-1"
                  >
                    Ver credencial <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {u.achievements?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="text-yellow-500" size={24} />
            Conquistas na plataforma
          </h3>
          <div className="flex flex-wrap gap-2">
            {u.achievements.map((id) => (
              <span
                key={id}
                className="badge bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
              >
                {ACHIEVEMENT_NAMES[id] || id.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.projects?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Code className="text-primary-600" size={24} />
            Projetos ({profile.projects.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.projects.map((project) => (
              <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {project.imageUrl && (
                  <img src={project.imageUrl} alt={project.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{project.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{project.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.skills?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="text-blue-600" size={24} />
            Habilidades ({profile.skills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill.id}
                className="badge bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                title={skill.level ? `Nível: ${skill.level}` : undefined}
              >
                {skill.name}
                {skill.level && ` • ${skill.level}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {!profile.education?.length &&
        !profile.experiences?.length &&
        !profile.projects?.length &&
        !profile.skills?.length && (
          <div className="card text-center py-8 text-gray-500">
            Este usuário ainda não preencheu formação ou portfólio público.
          </div>
        )}
    </div>
  );
}
