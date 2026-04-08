import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Trophy, Medal, Award, Loader2 } from 'lucide-react';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'users'),
          orderBy('totalXP', 'desc'),
          limit(10)
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          rank: index + 1,
          ...doc.data(),
        }));

        setUsers(data);
      } catch (err) {
        console.error('Erro ao buscar ranking:', err);
        setError('Não foi possível carregar o ranking');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankStyle = (rank) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black";
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-400 text-black";
    if (rank === 3) return "bg-gradient-to-r from-orange-400 to-orange-500 text-black";
    return "bg-white dark:bg-gray-800 text-gray-900 dark:text-white";
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={24} className="text-yellow-600" />;
    if (rank === 2) return <Medal size={24} className="text-gray-600" />;
    if (rank === 3) return <Award size={24} className="text-orange-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Ranking Global
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Top 10 estudantes com mais XP
        </p>
      </div>

      {/* Top 3 em Destaque */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {users.slice(0, 3).map((user) => (
          <div key={user.id} className="card text-center">
            <div className="mb-4">
              {getRankIcon(user.rank)}
            </div>
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {user.displayName || 'Usuário'}
            </h3>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
              {user.totalXP?.toLocaleString() || 0} XP
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nível {user.level || 1} • {user.streak || 0} dias de streak
            </p>
          </div>
        ))}
      </div>

      {/* Lista Completa */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Classificação Completa
        </h2>
        {users.map((user) => (
          <div
            key={user.id}
            className={`flex items-center justify-between p-4 rounded-xl shadow-md transition-all hover:shadow-lg hover:scale-[1.02] ${getRankStyle(user.rank)}`}
          >
            <div className="flex items-center gap-4">
              <div className="font-bold text-2xl w-10 text-center">
                #{user.rank}
              </div>

              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.displayName?.[0]?.toUpperCase() || 'U'}
              </div>

              <div>
                <p className="font-semibold text-lg">
                  {user.displayName || 'Usuário'}
                </p>
                <p className="text-sm opacity-75">
                  Nível {user.level || 1} • {user.streak || 0} dias de streak
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-bold text-lg">
              <Trophy size={20} />
              {user.totalXP?.toLocaleString() || 0} XP
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="card text-center py-12">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">
            Nenhum usuário no ranking ainda
          </p>
        </div>
      )}
    </div>
  );
}