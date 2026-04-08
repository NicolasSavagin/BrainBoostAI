import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  MessageCircle,
  TrendingUp,
  Award,
  Flame,
  Eye,
  ThumbsUp,
  Share2
} from 'lucide-react';
import { useAuthStore } from '../store';
import { Link } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  where 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export default function Community() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'users'),
        orderBy('totalXP', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const usersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== user.uid); // Remover usuário atual

      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.headline?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'users', label: 'Explorar Usuários', icon: Users },
    { id: 'feed', label: 'Feed de Atividades', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando comunidade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Comunidade
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Conecte-se com outros estudantes e compartilhe sua jornada
        </p>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar usuários por nome ou headline..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-0">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
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
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((userData) => (
                <Link
                  key={userData.id}
                  to={`/profile/${userData.id}`}
                  className="card hover:shadow-xl transition-all hover:-translate-y-1 group"
                >
                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
                      {userData.photoURL ? (
                        <img 
                          src={userData.photoURL} 
                          alt={userData.displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        userData.displayName?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-primary-600 transition-colors">
                        {userData.displayName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                        {userData.headline || 'Estudante na plataforma'}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-lg font-bold text-primary-600">{userData.level || 1}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Nível</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-lg font-bold text-yellow-600">{userData.totalXP || 0}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">XP</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-lg font-bold text-orange-600">{userData.streak || 0}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Streak</p>
                    </div>
                  </div>

                  {/* Badges */}
                  {userData.achievements && userData.achievements.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {userData.achievements.slice(0, 3).map((achievement, idx) => (
                        <span key={idx} className="badge bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs">
                          <Award size={12} className="inline mr-1" />
                          {achievement}
                        </span>
                      ))}
                      {userData.achievements.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{userData.achievements.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* View Profile Button */}
                  <button className="w-full mt-4 btn-primary text-sm flex items-center justify-center gap-2">
                    <Eye size={16} />
                    Ver Perfil
                  </button>
                </Link>
              ))}

              {filteredUsers.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhum usuário encontrado
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'feed' && (
            <div className="space-y-4">
              <p className="text-center text-gray-600 dark:text-gray-400 py-12">
                Feed de atividades em desenvolvimento! 🚧
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}