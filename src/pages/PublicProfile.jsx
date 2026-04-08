import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Lock
} from 'lucide-react';
import profileService from '../services/profileService';

export default function PublicProfile() {
  const { userId } = useParams();
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
      <div className="card text-center py-12">
        <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400">Perfil não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.user.streak || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Dias Streak</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.user.totalXP || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">XP Total</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Award className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.user.achievements?.length || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Conquistas</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.user.completedExercises || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Exercícios</p>
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
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Globe size={20} className="text-gray-600 dark:text-gray-300" />
                </a>
              )}
              {profile.user.github && (
                <a 
                  href={`https://github.com/${profile.user.github}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Github size={20} className="text-gray-600 dark:text-gray-300" />
                </a>
              )}
              {profile.user.linkedin && (
                <a 
                  href={`https://linkedin.com/in/${profile.user.linkedin}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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

      {/* Projetos Públicos */}
      {profile.projects && profile.projects.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Projetos ({profile.projects.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.projects.map((project) => (
              <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors">
                {project.imageUrl && (
                  <img 
                    src={project.imageUrl} 
                    alt={project.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {project.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {project.description}
                </p>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.technologies.map((tech, idx) => (
                      <span key={idx} className="badge bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Limitadas */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="text-gray-400" size={20} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Habilidades (Limitado)
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Algumas informações são privadas
        </p>
        {profile.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.skills.slice(0, 6).map((skill) => (
              <span key={skill.id} className="badge bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {skill.name}
              </span>
            ))}
            {profile.skills.length > 6 && (
              <span className="text-sm text-gray-500">
                +{profile.skills.length - 6} mais
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}