// src/pages/Community.jsx - PÁGINA DE COMUNIDADE COMPLETA

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
  Share2,
  Filter,
  Star
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
  const [filterBy, setFilterBy] = useState('totalXP'); // totalXP, streak, level
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [filterBy]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'users'),
        orderBy(filterBy, 'desc'),
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
    u.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'users', label: 'Explorar Usuários', icon: Users },
    { id: 'top', label: 'Top da Semana', icon: TrendingUp },
  ];

  const filterOptions = [
    { value: 'totalXP', label: 'Mais XP', icon: Star },
    { value: 'streak', label: 'Maior Streak', icon: Flame },
    { value: 'level', label: 'Maior Nível', icon: Award },
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
          Comunidade 🌐
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Conecte-se com {users.length}+ estudantes e compartilhe sua jornada
        </p>
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
              placeholder="Buscar por nome, headline ou localização..."
              className="input-field pl-10"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter size={18} />
            Filtros
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Ordenar por:
            </p>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setFilterBy(option.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      filterBy === option.value
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-2 border-primary-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon size={16} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-primary-600" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Estudantes Ativos</p>
        </div>
        <div className="card text-center">
          <Flame className="w-8 h-8 mx-auto mb-2 text-orange-600" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.max(...users.map(u => u.streak || 0))}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Maior Streak</p>
        </div>
        <div className="card text-center">
          <Star className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.max(...users.map(u => u.totalXP || 0)).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Maior XP</p>
        </div>
        <div className="card text-center">
          <Award className="w-8 h-8 mx-auto mb-2 text-purple-600" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.max(...users.map(u => u.level || 0))}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Maior Nível</p>
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
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl font-bold ring-4 ring-gray-100 dark:ring-gray-800">
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
                      {/* Online indicator */}
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-primary-600 transition-colors truncate">
                        {userData.displayName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                        {userData.headline || 'Estudante na plataforma'}
                      </p>
                      {userData.location && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                          <span>📍</span> {userData.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{userData.level || 1}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Nível</p>
                    </div>
                    <div className="text-center p-2 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg">
                      <p className="text-lg font-bold text-yellow-600">{(userData.totalXP || 0) > 999 ? `${Math.floor((userData.totalXP || 0) / 1000)}k` : (userData.totalXP || 0)}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">XP</p>
                    </div>
                    <div className="text-center p-2 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
                      <p className="text-lg font-bold text-orange-600">{userData.streak || 0}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Streak</p>
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Precisão</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {userData.accuracy || 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                        style={{ width: `${userData.accuracy || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Badges */}
                  {userData.achievements && userData.achievements.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {userData.achievements.slice(0, 3).map((achievement, idx) => (
                          <span key={idx} className="badge bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs flex items-center gap-1">
                            <Award size={12} />
                            {achievement.replace('_', ' ')}
                          </span>
                        ))}
                        {userData.achievements.length > 3 && (
                          <span className="text-xs text-gray-500 font-semibold">
                            +{userData.achievements.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* View Profile Button */}
                  <button className="w-full btn-primary text-sm flex items-center justify-center gap-2 group-hover:shadow-lg transition-shadow">
                    <Eye size={16} />
                    Ver Perfil
                  </button>
                </Link>
              ))}

              {filteredUsers.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm 
                      ? 'Nenhum usuário encontrado com esse termo de busca'
                      : 'Nenhum usuário encontrado'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'top' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🏆 Top 10 da Semana
              </h3>
              
              <div className="space-y-3">
                {filteredUsers.slice(0, 10).map((userData, index) => (
                  <Link
                    key={userData.id}
                    to={`/profile/${userData.id}`}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:shadow-md"
                  >
                    {/* Rank */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                      'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      #{index + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
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

                    {/* Info */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {userData.displayName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                        {userData.headline || 'Estudante'}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">XP</p>
                        <p className="font-bold text-primary-600">{userData.totalXP || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Streak</p>
                        <p className="font-bold text-orange-600">{userData.streak || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Nível</p>
                        <p className="font-bold text-blue-600">{userData.level || 1}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}