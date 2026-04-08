import { useState, useEffect } from 'react';
import { 
  User, Mail, Calendar, Settings, Camera, MapPin, Link as LinkIcon,
  Briefcase, GraduationCap, Award, Code, Github, Linkedin, Twitter,
  Plus, Edit2, Trash2, ExternalLink, Check, X, Globe, Zap
} from 'lucide-react';
import { useAuthStore } from '../store';
import profileService from '../services/profileService';
import { motion, AnimatePresence } from 'framer-motion';
import skillProgressService from '../services/skillProgressService';


export default function Profile() {
  const { user, userProfile, setUserProfile } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [showModal, setShowModal] = useState(null);
  const [stats, setStats] = useState(null);
  const [gameSkills, setGameSkills] = useState([]);


  // Form states
  const [bioForm, setBioForm] = useState({
    bio: '',
    headline: '',
    location: '',
    website: '',
    github: '',
    linkedin: '',
    twitter: ''
  });

  const [educationForm, setEducationForm] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  });

  const [experienceForm, setExperienceForm] = useState({
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    skills: []
  });

  const [skillForm, setSkillForm] = useState({
    name: '',
    level: 'Intermediário',
    category: 'Programação'
  });

  const [certificationForm, setCertificationForm] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    expirationDate: '',
    credentialId: '',
    credentialUrl: ''
  });

  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    technologies: [],
    url: '',
    githubUrl: '',
    imageUrl: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [fullProfile, profileStats] = await Promise.all([
        profileService.getFullProfile(user.uid),
        profileService.getProfileStats(user.uid)
      ]);

      setProfile(fullProfile);
      setStats(profileStats);

      // Preencher form de bio
      if (fullProfile.user) {
        setBioForm({
          bio: fullProfile.user.bio || '',
          headline: fullProfile.user.headline || '',
          location: fullProfile.user.location || '',
          website: fullProfile.user.website || '',
          github: fullProfile.user.github || '',
          linkedin: fullProfile.user.linkedin || '',
          twitter: fullProfile.user.twitter || ''
        });
      }

    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const url = await profileService.uploadProfilePicture(user.uid, file);
      setUserProfile({ ...userProfile, photoURL: url });
      await loadProfile();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await profileService.uploadBannerImage(user.uid, file);
      await loadProfile();
    } catch (error) {
      console.error('Erro ao fazer upload do banner:', error);
    }
  };

  const saveBio = async () => {
    try {
      await profileService.updateBio(user.uid, bioForm);
      setEditing(false);
      await loadProfile();
    } catch (error) {
      console.error('Erro ao salvar bio:', error);
    }
  };

  const addEducation = async () => {
    try {
      await profileService.addEducation(user.uid, educationForm);
      setShowModal(null);
      setEducationForm({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      });
      await loadProfile();
    } catch (error) {
      console.error('Erro ao adicionar formação:', error);
    }
  };

  const addExperience = async () => {
    try {
      await profileService.addExperience(user.uid, experienceForm);
      setShowModal(null);
      setExperienceForm({
        company: '',
        position: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        skills: []
      });
      await loadProfile();
    } catch (error) {
      console.error('Erro ao adicionar experiência:', error);
    }
  };

  const addSkill = async () => {
    try {
      await profileService.addSkill(user.uid, skillForm);
      setShowModal(null);
      setSkillForm({
        name: '',
        level: 'Intermediário',
        category: 'Programação'
      });
      await loadProfile();
    } catch (error) {
      console.error('Erro ao adicionar habilidade:', error);
    }
  };

  const addCertification = async () => {
    try {
      await profileService.addCertification(user.uid, certificationForm);
      setShowModal(null);
      setCertificationForm({
        name: '',
        issuer: '',
        issueDate: '',
        expirationDate: '',
        credentialId: '',
        credentialUrl: ''
      });
      await loadProfile();
    } catch (error) {
      console.error('Erro ao adicionar certificação:', error);
    }
  };

  const addProject = async () => {
    try {
      await profileService.addProject(user.uid, projectForm);
      setShowModal(null);
      setProjectForm({
        title: '',
        description: '',
        technologies: [],
        url: '',
        githubUrl: '',
        imageUrl: '',
        startDate: '',
        endDate: ''
      });
      await loadProfile();
    } catch (error) {
      console.error('Erro ao adicionar projeto:', error);
    }
  };

  const deleteItem = async (collection, itemId) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;

    try {
      await profileService.deleteItem(collection, itemId);
      await loadProfile();
    } catch (error) {
      console.error('Erro ao deletar:', error);
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

  const tabs = [
    { id: 'game-skills', label: 'Skills do Jogo', icon: Zap },
    { id: 'about', label: 'Sobre', icon: User },
    { id: 'experience', label: 'Experiência', icon: Briefcase },
    { id: 'education', label: 'Formação', icon: GraduationCap },
    { id: 'skills', label: 'Habilidades', icon: Code },
    { id: 'certifications', label: 'Certificações', icon: Award },
    { id: 'projects', label: 'Projetos', icon: Github },
  ];


  return (
    <div className="space-y-6">
      
      {/* Banner + Avatar */}
      <div className="card p-0 overflow-hidden">
        {/* Banner */}
        <div className="relative h-48 bg-gradient-to-r from-primary-500 to-purple-600">
          {profile?.user?.bannerURL && (
            <img 
              src={profile.user.bannerURL} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
          )}
          <label className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:bg-gray-50">
            <Camera size={20} className="text-gray-600 dark:text-gray-300" />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleBannerUpload}
            />
          </label>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-4">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                  {profile?.user?.photoURL ? (
                    <img 
                      src={profile.user.photoURL} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.displayName?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg cursor-pointer hover:bg-gray-50">
                  <Camera size={16} className="text-gray-600 dark:text-gray-300" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>

              {/* Name & Headline */}
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {user?.displayName || 'Usuário'}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                  {profile?.user?.headline || 'Adicione uma descrição profissional'}
                </p>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {profile?.user?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {profile.user.location}
                    </span>
                  )}
                  {userProfile?.level && (
                    <span className="badge bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                      Nível {userProfile.level}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <button 
              onClick={() => setEditing(!editing)}
              className="btn-secondary flex items-center gap-2 mt-4 md:mt-0"
            >
              <Settings size={16} />
              {editing ? 'Cancelar' : 'Editar Perfil'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userProfile?.streak || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Dias Streak</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userProfile?.totalXP || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">XP Total</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.skillsCount || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Habilidades</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.projectsCount || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Projetos</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.certificationsCount || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Certificados</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalEndorsements || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Endossos</p>
            </div>
          </div>

          {/* Social Links */}
          {(profile?.user?.website || profile?.user?.github || profile?.user?.linkedin) && (
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
              {profile.user.twitter && (
                <a 
                  href={`https://twitter.com/${profile.user.twitter}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Twitter size={20} className="text-gray-600 dark:text-gray-300" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Bio Form */}
      {editing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Editar Informações Básicas
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Headline Profissional
              </label>
              <input
                type="text"
                value={bioForm.headline}
                onChange={(e) => setBioForm({ ...bioForm, headline: e.target.value })}
                placeholder="Ex: Desenvolvedor Full Stack | React | Node.js"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sobre Você
              </label>
              <textarea
                value={bioForm.bio}
                onChange={(e) => setBioForm({ ...bioForm, bio: e.target.value })}
                placeholder="Conte um pouco sobre você, sua jornada e objetivos..."
                rows={5}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Localização
                </label>
                <input
                  type="text"
                  value={bioForm.location}
                  onChange={(e) => setBioForm({ ...bioForm, location: e.target.value })}
                  placeholder="São Paulo, SP - Brasil"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={bioForm.website}
                  onChange={(e) => setBioForm({ ...bioForm, website: e.target.value })}
                  placeholder="https://seusite.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GitHub (username)
                </label>
                <input
                  type="text"
                  value={bioForm.github}
                  onChange={(e) => setBioForm({ ...bioForm, github: e.target.value })}
                  placeholder="seugithub"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  LinkedIn (username)
                </label>
                <input
                  type="text"
                  value={bioForm.linkedin}
                  onChange={(e) => setBioForm({ ...bioForm, linkedin: e.target.value })}
                  placeholder="seulinkedin"
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={saveBio} className="btn-primary flex items-center gap-2">
                <Check size={16} />
                Salvar Alterações
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="card p-0">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Sobre
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {profile?.user?.bio || 'Nenhuma descrição adicionada ainda.'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Informações de Contato
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Mail className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
                    </div>
                  </div>

                  {profile?.user?.location && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <MapPin className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Localização</p>
                        <p className="font-medium text-gray-900 dark:text-white">{profile.user.location}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Calendar className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Membro desde</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
            {activeTab === 'game-skills' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Skills da Plataforma
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Suas habilidades evoluem conforme você pratica exercícios!
              </p>

              {/* Agrupar por categoria */}
              {Object.entries(
                gameSkills.reduce((acc, skill) => {
                  if (!acc[skill.category]) acc[skill.category] = [];
                  acc[skill.category].push(skill);
                  return acc;
                }, {})
              ).map(([category, skills]) => (
                <div key={category} className="mb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skills.map((skill) => {
                      const rankInfo = skillProgressService.getSkillRank(skill.level);
                      const progress = skill.notStarted ? 0 : 
                        (skill.currentXP / skill.xpPerLevel) * 100;

                      return (
                        <div 
                          key={skill.skillName} 
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white">
                                {skill.skillName}
                              </h5>
                              <p className={`text-sm font-semibold ${rankInfo.color}`}>
                                {rankInfo.rank} • Nível {skill.level}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary-600">
                                {skill.level}
                              </p>
                              <p className="text-xs text-gray-500">/ {skill.maxLevel}</p>
                            </div>
                          </div>

                          {!skill.notStarted && (
                            <>
                              <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    XP: {skill.currentXP} / {skill.xpPerLevel}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {Math.round(progress)}%
                                  </span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-primary-500 to-purple-600 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>

                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Total: {skill.totalXP} XP
                              </p>
                            </>
                          )}

                          {skill.notStarted && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                              Comece a praticar para desbloquear esta skill!
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Experiência Profissional
                </h3>
                <button 
                  onClick={() => setShowModal('experience')}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>

              {profile?.experiences?.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Nenhuma experiência adicionada ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {profile?.experiences?.map((exp) => (
                    <div key={exp.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {exp.position}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">
                            {exp.company} • {exp.location}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                            {new Date(exp.startDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} - 
                            {exp.current ? ' Atual' : ` ${new Date(exp.endDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300 mb-3">
                            {exp.description}
                          </p>
                          {exp.skills && exp.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {exp.skills.map((skill, idx) => (
                                <span key={idx} className="badge bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => deleteItem('experiences', exp.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Formação Acadêmica
                </h3>
                <button 
                  onClick={() => setShowModal('education')}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>

              {profile?.education?.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Nenhuma formação adicionada ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {profile?.education?.map((edu) => (
                    <div key={edu.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {edu.institution[0]}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {edu.institution}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400">
                              {edu.degree} em {edu.fieldOfStudy}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                              {new Date(edu.startDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} - 
                              {edu.current ? ' Cursando' : ` ${new Date(edu.endDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`}
                            </p>
                            {edu.description && (
                              <p className="text-gray-700 dark:text-gray-300 mt-2">
                                {edu.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteItem('education', edu.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Habilidades & Competências
                </h3>
                <button 
                  onClick={() => setShowModal('skill')}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>

              {profile?.skills?.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Nenhuma habilidade adicionada ainda
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile?.skills?.map((skill) => (
                    <div key={skill.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {skill.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {skill.category} • {skill.level}
                          </p>
                        </div>
                        <button 
                          onClick={() => deleteItem('skills', skill.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                            style={{ 
                              width: skill.level === 'Expert' ? '100%' : 
                                     skill.level === 'Avançado' ? '75%' : 
                                     skill.level === 'Intermediário' ? '50%' : '25%' 
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {skill.endorsements || 0} endossos
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Certifications Tab */}
          {activeTab === 'certifications' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Certificações & Licenças
                </h3>
                <button 
                  onClick={() => setShowModal('certification')}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>

              {profile?.certifications?.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Nenhuma certificação adicionada ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {profile?.certifications?.map((cert) => (
                    <div key={cert.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4 flex-1">
                          <Award className="text-yellow-600 flex-shrink-0" size={40} />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {cert.name}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400">
                              {cert.issuer}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                              Emitido em {new Date(cert.issueDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                              {cert.expirationDate && ` • Expira em ${new Date(cert.expirationDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`}
                            </p>
                            {cert.credentialId && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                ID: {cert.credentialId}
                              </p>
                            )}
                            {cert.credentialUrl && (
                              <a 
                                href={cert.credentialUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-2"
                              >
                                Ver credencial <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteItem('certifications', cert.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Projetos & Portfólio
                </h3>
                <button 
                  onClick={() => setShowModal('project')}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>

              {profile?.projects?.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Nenhum projeto adicionado ainda
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile?.projects?.map((project) => (
                    <div key={project.id} className="card hover:shadow-xl transition-all hover:-translate-y-1 group">
                      {project.imageUrl && (
                        <img 
                          src={project.imageUrl} 
                          alt={project.title}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}
                      
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {project.title}
                        </h4>
                        <button 
                          onClick={() => deleteItem('projects', project.id)}
                          className="text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                        {project.description}
                      </p>
                      
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
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
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {/* Education Modal */}
        {showModal === 'education' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Adicionar Formação
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instituição *
                  </label>
                  <input
                    type="text"
                    value={educationForm.institution}
                    onChange={(e) => setEducationForm({ ...educationForm, institution: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Universidade de São Paulo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Grau *
                    </label>
                    <select
                      value={educationForm.degree}
                      onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Selecione</option>
                      <option value="Técnico">Técnico</option>
                      <option value="Tecnólogo">Tecnólogo</option>
                      <option value="Bacharelado">Bacharelado</option>
                      <option value="Licenciatura">Licenciatura</option>
                      <option value="Mestrado">Mestrado</option>
                      <option value="Doutorado">Doutorado</option>
                      <option value="MBA">MBA</option>
                      <option value="Pós-Graduação">Pós-Graduação</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Área de Estudo *
                    </label>
                    <input
                      type="text"
                      value={educationForm.fieldOfStudy}
                      onChange={(e) => setEducationForm({ ...educationForm, fieldOfStudy: e.target.value })}
                      className="input-field"
                      placeholder="Ex: Ciência da Computação"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Início *
                    </label>
                    <input
                      type="month"
                      value={educationForm.startDate}
                      onChange={(e) => setEducationForm({ ...educationForm, startDate: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Término
                    </label>
                    <input
                      type="month"
                      value={educationForm.endDate}
                      onChange={(e) => setEducationForm({ ...educationForm, endDate: e.target.value })}
                      className="input-field"
                      disabled={educationForm.current}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edu-current"
                    checked={educationForm.current}
                    onChange={(e) => setEducationForm({ ...educationForm, current: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="edu-current" className="text-sm text-gray-700 dark:text-gray-300">
                    Cursando atualmente
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={educationForm.description}
                    onChange={(e) => setEducationForm({ ...educationForm, description: e.target.value })}
                    rows={3}
                    className="input-field"
                    placeholder="Atividades, projetos, pesquisas..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={addEducation} className="btn-primary flex-1">
                    Adicionar
                  </button>
                  <button onClick={() => setShowModal(null)} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Experience Modal */}
        {showModal === 'experience' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Adicionar Experiência
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cargo *
                  </label>
                  <input
                    type="text"
                    value={experienceForm.position}
                    onChange={(e) => setExperienceForm({ ...experienceForm, position: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Desenvolvedor Full Stack"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Empresa *
                    </label>
                    <input
                      type="text"
                      value={experienceForm.company}
                      onChange={(e) => setExperienceForm({ ...experienceForm, company: e.target.value })}
                      className="input-field"
                      placeholder="Nome da empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Localização
                    </label>
                    <input
                      type="text"
                      value={experienceForm.location}
                      onChange={(e) => setExperienceForm({ ...experienceForm, location: e.target.value })}
                      className="input-field"
                      placeholder="São Paulo, SP"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Início *
                    </label>
                    <input
                      type="month"
                      value={experienceForm.startDate}
                      onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Término
                    </label>
                    <input
                      type="month"
                      value={experienceForm.endDate}
                      onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })}
                      className="input-field"
                      disabled={experienceForm.current}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="exp-current"
                    checked={experienceForm.current}
                    onChange={(e) => setExperienceForm({ ...experienceForm, current: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="exp-current" className="text-sm text-gray-700 dark:text-gray-300">
                    Trabalho aqui atualmente
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={experienceForm.description}
                    onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                    rows={4}
                    className="input-field"
                    placeholder="Responsabilidades, conquistas, projetos..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={addExperience} className="btn-primary flex-1">
                    Adicionar
                  </button>
                  <button onClick={() => setShowModal(null)} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Skill Modal */}
        {showModal === 'skill' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card max-w-md w-full"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Adicionar Habilidade
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Habilidade *
                  </label>
                  <input
                    type="text"
                    value={skillForm.name}
                    onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                    className="input-field"
                    placeholder="Ex: React, Python, Marketing Digital"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nível *
                  </label>
                  <select
                    value={skillForm.level}
                    onChange={(e) => setSkillForm({ ...skillForm, level: e.target.value })}
                    className="input-field"
                  >
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={skillForm.category}
                    onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="Programação">Programação</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Gestão">Gestão</option>
                    <option value="Idiomas">Idiomas</option>
                    <option value="Vendas">Vendas</option>
                    <option value="Análise de Dados">Análise de Dados</option>
                    <option value="Soft Skills">Soft Skills</option>
                    <option value="Outras">Outras</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={addSkill} className="btn-primary flex-1">
                    Adicionar
                  </button>
                  <button onClick={() => setShowModal(null)} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Certification Modal */}
        {showModal === 'certification' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Adicionar Certificação
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Certificação *
                  </label>
                  <input
                    type="text"
                    value={certificationForm.name}
                    onChange={(e) => setCertificationForm({ ...certificationForm, name: e.target.value })}
                    className="input-field"
                    placeholder="Ex: AWS Certified Developer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organização Emissora *
                  </label>
                  <input
                    type="text"
                    value={certificationForm.issuer}
                    onChange={(e) => setCertificationForm({ ...certificationForm, issuer: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Amazon Web Services"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Emissão *
                    </label>
                    <input
                      type="month"
                      value={certificationForm.issueDate}
                      onChange={(e) => setCertificationForm({ ...certificationForm, issueDate: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Expiração
                    </label>
                    <input
                      type="month"
                      value={certificationForm.expirationDate}
                      onChange={(e) => setCertificationForm({ ...certificationForm, expirationDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ID da Credencial
                  </label>
                  <input
                    type="text"
                    value={certificationForm.credentialId}
                    onChange={(e) => setCertificationForm({ ...certificationForm, credentialId: e.target.value })}
                    className="input-field"
                    placeholder="Ex: ABC123XYZ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL da Credencial
                  </label>
                  <input
                    type="url"
                    value={certificationForm.credentialUrl}
                    onChange={(e) => setCertificationForm({ ...certificationForm, credentialUrl: e.target.value })}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={addCertification} className="btn-primary flex-1">
                    Adicionar
                  </button>
                  <button onClick={() => setShowModal(null)} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Project Modal */}
        {showModal === 'project' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Adicionar Projeto
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título do Projeto *
                  </label>
                  <input
                    type="text"
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    className="input-field"
                    placeholder="Ex: E-commerce em React"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    rows={4}
                    className="input-field"
                    placeholder="Descreva o projeto, objetivos e resultados..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tecnologias (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={projectForm.technologies.join(', ')}
                    onChange={(e) => setProjectForm({ 
                      ...projectForm, 
                      technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    className="input-field"
                    placeholder="React, Node.js, MongoDB"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL do Projeto
                    </label>
                    <input
                      type="url"
                      value={projectForm.url}
                      onChange={(e) => setProjectForm({ ...projectForm, url: e.target.value })}
                      className="input-field"
                      placeholder="https://meu-projeto.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={projectForm.githubUrl}
                      onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                      className="input-field"
                      placeholder="https://github.com/user/repo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    value={projectForm.imageUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, imageUrl: e.target.value })}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Início
                    </label>
                    <input
                      type="month"
                      value={projectForm.startDate}
                      onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Conclusão
                    </label>
                    <input
                      type="month"
                      value={projectForm.endDate}
                      onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={addProject} className="btn-primary flex-1">
                    Adicionar
                  </button>
                  <button onClick={() => setShowModal(null)} className="btn-secondary">
                    Cancelar
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