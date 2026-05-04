// src/pages/PublicProfile.jsx - PERFIL PÚBLICO COMPLETO

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Calendar,
  Trophy,
  Flame,
  Target,
  BookOpen,
  Globe,
  Github,
  Linkedin,
  Award,
  Lock,
  ArrowLeft,
  Mail,
  ExternalLink,
  Star,
  Code
} from 'lucide-react';
import profileService from '../services/profileService';

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadPublicProfile();
    }
  }, [userId]);

  const loadPublicProfile = async () => {
    try {
      setLoading(true);
      const [fullProfile, profileStats] = await Promise.all([
        profileService.getFullProfile(userId),
        profileService.getProfileStats(userId)
      ]);

      setProfile(fullProfile);
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
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile?.user) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/community')}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div className="card text-center py-12">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Perfil não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/community')}
        className="btn-secondary flex items-center gap-2"
      >
        <ArrowLeft size={18} />
        Voltar para Comunidade
      </button>

      {/* Banner + Avatar */}
      <div className="card p-0 overflow-hidden">
        {/* Banner */}
        <div className="relative h-48 bg-gradient-to-r from-primary-500 to-purple-600">
          {profile.user.bannerURL && (
            <img 
              src={profile.user.bannerURL} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-4">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                {profile.user.photoURL ? (
                  <img 
                    src={profile.user.photoURL} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.user.displayName?.[0]?.toUpperCase() || 'U'
                )}
              </div>

              {/* Name & Headline */}
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {profile.user.displayName || 'Usuário'}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                  {profile.user.headline || 'Estudante na plataforma'}
                </p>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {profile.user.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {profile.user.location}
                    </span>
                  )}
                  <span className="badge bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                    Nível {profile.user.level || 1}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats - Públicas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
              <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.user.streak || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Dias Streak</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.user.totalXP || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">XP Total</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
              <Award className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.user.achievements?.length || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Conquistas</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.user.accuracy || 0}%</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Precisão</p>
            </div>
          </div>

          {/* Social Links */}
          {(profile.user.website || profile.user.github || profile.user.linkedin) && (
            <div className="flex gap-3 mt-4">
              {profile.user.website && (
                <a 
                  href={profile.user.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Globe size={20} className="text-gray-600 dark:text-gray-300" />
                </a>
              )}
              {profile.user.github && (
                <a 
                  href={`https://github.com/${profile.user.github}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Github size={20} className="text-gray-600 dark:text-gray-300" />
                </a>
              )}
              {profile.user.linkedin && (
                <a 
                  href={`https://linkedin.com/in/${profile.user.linkedin}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Linkedin size={20} className="text-gray-600 dark:text-gray-300" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.user.bio && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Sobre
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {profile.user.bio}
          </p>
        </div>
      )}

      {/* Conquistas */}
      {profile.user.achievements && profile.user.achievements.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="text-yellow-500" size={24} />
            Conquistas ({profile.user.achievements.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {profile.user.achievements.map((achievement, idx) => (
              <span 
                key={idx} 
                className="badge bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 flex items-center gap-2 text-sm px-4 py-2"
              >
                <Award size={16} />
                {achievement.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Projetos Públicos */}
      {profile.projects && profile.projects.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Code className="text-primary-600" size={24} />
            Projetos ({profile.projects.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.projects.map((project) => (
              <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-primary-500 transition-colors">
                {project.imageUrl && (
                  <img 
                    src={project.imageUrl} 
                    alt={project.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">
                    {project.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.technologies.map((tech, idx) => (
                        <span key={idx} className="badge bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {project.url && (
                      <a 
                        href={project.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-secondary text-sm flex items-center gap-2"
                      >
                        <ExternalLink size={14} />
                        Demo
                      </a>
                    )}
                    {project.githubUrl && (
                      <a 
                        href={project.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-secondary text-sm flex items-center gap-2"
                      >
                        <Github size={14} />
                        Código
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Públicas (Limitado) */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="text-gray-400" size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Habilidades
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Algumas informações são privadas
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.skills.slice(0, 8).map((skill) => (
              <span key={skill.id} className="badge bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {skill.name}
              </span>
            ))}
            {profile.skills.length > 8 && (
              <span className="text-sm text-gray-500 font-semibold">
                +{profile.skills.length - 8} mais
              </span>
            )}
          </div>
        </div>
      )}

      {/* Informações Adicionais */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Lock className="text-blue-600 flex-shrink-0 mt-1" size={24} />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Privacidade
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Este é um perfil público. Algumas informações como experiência profissional, 
              formação acadêmica e certificações são privadas e visíveis apenas para o próprio usuário.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}