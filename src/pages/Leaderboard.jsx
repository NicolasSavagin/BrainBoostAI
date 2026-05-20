import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Award, Loader2, Swords, BookOpen, Star, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store';
import rankingService from '../services/rankingService';
import { RANKING_CATEGORIES, BATTLE_TIERS, getTierFromLP } from '../config/rankings';
import TierBadge from '../components/rankings/TierBadge';

function UserAvatar({ user, size = 'w-12 h-12' }) {
  if (user.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName}
        className={`${size} rounded-full object-cover ring-2 ring-white dark:ring-gray-800`}
      />
    );
  }
  return (
    <div
      className={`${size} bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold`}
    >
      {user.displayName?.[0]?.toUpperCase() || 'U'}
    </div>
  );
}

const TABS = [
  { id: 'general', label: 'Geral', icon: Trophy, desc: 'XP total na plataforma' },
  { id: 'battle', label: 'Batalha', icon: Swords, desc: 'Ligas por pontos de batalha (LP)' },
  { id: 'category', label: 'Por categoria', icon: BookOpen, desc: 'XP por área de estudo' },
];

export default function Leaderboard() {
  const { user, userProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  const [category, setCategory] = useState(RANKING_CATEGORIES[0].id);
  const [users, setUsers] = useState([]);
  const [myRanks, setMyRanks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab, category]);

  useEffect(() => {
    if (user) rankingService.getUserRanks(user.uid).then(setMyRanks);
  }, [user, activeTab, category]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      let data = [];
      if (activeTab === 'general') data = await rankingService.getGeneralLeaderboard(50);
      else if (activeTab === 'battle') data = await rankingService.getBattleLeaderboard(50);
      else data = await rankingService.getCategoryLeaderboard(category, 50);
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-black';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-black';
    return 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={24} className="text-yellow-600" />;
    if (rank === 2) return <Medal size={24} className="text-gray-600" />;
    if (rank === 3) return <Award size={24} className="text-orange-600" />;
    return null;
  };

  const myTier = getTierFromLP(userProfile?.battleLP || 0);
  const myPosition =
    activeTab === 'general'
      ? myRanks?.general
      : activeTab === 'battle'
        ? myRanks?.battle
        : myRanks?.categories?.[category];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Rankings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Classificações gerais, ligas de batalha e desempenho por matéria
        </p>
      </div>

      {userProfile && (
        <div className="card bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sua posição</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {myPosition ? `#${myPosition}` : '—'} no ranking{' '}
                {activeTab === 'general' ? 'geral' : activeTab === 'battle' ? 'de batalha' : category}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <TierBadge tierId={userProfile.battleTier} lp={userProfile.battleLP || 0} showLP />
              <span className="text-sm text-gray-500">
                {userProfile.battleWins || 0}V / {userProfile.battleLosses || 0}D
              </span>
            </div>
          </div>
          {myTier.nextTier && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Progresso para {myTier.nextTier.name}</span>
                <span>{myTier.lpToNext} LP restantes</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all"
                  style={{ width: `${myTier.progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'battle' && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Swords size={20} className="text-red-500" />
            Ligas de batalha
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {BATTLE_TIERS.map((t) => (
              <div
                key={t.id}
                className={`text-center p-2 rounded-lg border text-xs ${t.bgClass}`}
              >
                <span className="text-lg block">{t.emoji}</span>
                <span className="font-semibold">{t.name}</span>
                <span className="block opacity-70">{t.minLP}+ LP</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Vitória PvP: +25 LP • Vitória vs IA: +15 LP • Derrota: -12 LP • Empate: +5 LP
          </p>
        </div>
      )}

      {activeTab === 'category' && (
        <div className="flex flex-wrap gap-2">
          {RANKING_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                category === cat.id
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 border-2 border-primary-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500">{TABS.find((t) => t.id === activeTab)?.desc}</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          Nenhum jogador neste ranking ainda. Seja o primeiro!
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {users.slice(0, 3).map((u) => (
              <Link
                key={u.id}
                to={`/profile/${u.id}`}
                className="card text-center hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="mb-2">{getRankIcon(u.rank)}</div>
                <UserAvatar user={u} size="w-16 h-16 mx-auto mb-3" />
                <h3 className="font-semibold truncate">{u.displayName}</h3>
                {u.isBattle ? (
                  <div className="mt-2 flex justify-center">
                    <TierBadge tierId={u.battleTier?.id} lp={u.score} size="sm" />
                  </div>
                ) : (
                  <p className="text-xl font-bold text-primary-600 mt-2">
                    {u.score?.toLocaleString()} {u.scoreLabel}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">#{u.rank}</p>
              </Link>
            ))}
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Classificação completa</h2>
            {users.map((u) => (
              <Link
                key={u.id}
                to={`/profile/${u.id}`}
                className={`flex items-center justify-between p-4 rounded-xl transition-all hover:shadow-md ${getRankStyle(u.rank)}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-bold text-xl w-8">#{u.rank}</span>
                  <UserAvatar user={u} size="w-10 h-10" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{u.displayName}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs opacity-80">
                      <span>Nv. {u.level}</span>
                      {u.isBattle && (
                        <>
                          <TierBadge tierId={u.battleTier?.id} lp={u.score} size="sm" />
                          <span>
                            {u.battleWins}V {u.battleLosses}D
                          </span>
                        </>
                      )}
                      {activeTab === 'general' && (
                        <span className="flex items-center gap-1">
                          <TrendingUp size={12} /> {u.streak} streak
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-bold shrink-0 ml-2">
                  {activeTab === 'battle' ? (
                    <Swords size={18} />
                  ) : (
                    <Star size={18} className="text-yellow-500" />
                  )}
                  {u.score?.toLocaleString()} {u.scoreLabel}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {activeTab === 'battle' && (
        <div className="text-center">
          <Link to="/battle" className="btn-primary inline-flex items-center gap-2">
            <Swords size={18} />
            Ir para batalha
          </Link>
        </div>
      )}
    </div>
  );
}
