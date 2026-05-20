import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Swords,
  Users,
  Bot,
  Trophy,
  Clock,
  Zap,
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '../store';
import battleService, { BATTLE_TOPICS } from '../services/battleService';
import achievementService from '../services/achievementService';
import authService from '../services/authService';
import { notify } from '../services/notificationService';
import rankingService from '../services/rankingService';
import TierBadge from '../components/rankings/TierBadge';
import { getTierFromLP, BATTLE_TIERS } from '../config/rankings';

const ROUND_TIME = 20;

export default function Battle() {
  const { battleId: paramBattleId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile, setUserProfile } = useAuthStore();

  const [phase, setPhase] = useState(paramBattleId ? 'playing' : 'lobby');
  const [topic, setTopic] = useState(BATTLE_TOPICS[0]);
  const [difficulty, setDifficulty] = useState(3);
  const [onlineCount, setOnlineCount] = useState(0);
  const [battle, setBattle] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [matchingMsg, setMatchingMsg] = useState('Procurando oponente...');
  const [loading, setLoading] = useState(false);
  const [resultsApplied, setResultsApplied] = useState(false);

  const startTimeRef = useRef(Date.now());
  const unsubRef = useRef(null);

  useEffect(() => {
    battleService.setPresence(user.uid, true);
    battleService.getOnlineCount().then(setOnlineCount);
    const interval = setInterval(() => {
      battleService.getOnlineCount().then(setOnlineCount);
    }, 10000);

    return () => {
      clearInterval(interval);
      battleService.setPresence(user.uid, false);
      battleService.cancelQueue(user.uid);
      unsubRef.current?.();
    };
  }, [user.uid]);

  useEffect(() => {
    if (paramBattleId) {
      setPhase('playing');
      subscribeToBattle(paramBattleId);
    }
  }, [paramBattleId]);

  const subscribeToBattle = useCallback((id) => {
    unsubRef.current?.();
    unsubRef.current = battleService.subscribeBattle(id, (data) => {
      setBattle(data);
      if (data.status === 'finished') setPhase('results');
    });
  }, []);

  useEffect(() => {
    if (!battle || battle.status !== 'playing') return;

    const deadline = battle.roundDeadline || Date.now() + ROUND_TIME * 1000;
    startTimeRef.current = battle.roundStartedAt || Date.now();

    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(left);

      if (left === 0) {
        battleService.forceTimeout(battle.id, user.uid);
      }
    };

    tick();
    const interval = setInterval(tick, 500);
    setSelectedAnswer('');
    return () => clearInterval(interval);
  }, [battle?.currentRound, battle?.roundDeadline, battle?.status, battle?.id, user.uid]);

  useEffect(() => {
    if (phase !== 'results' || !battle || resultsApplied) return;

    const applyResults = async () => {
      setResultsApplied(true);
      const myKey = battleService.getMyPlayerKey(battle, user.uid);
      const won = battle.winnerId === user.uid;
      const draw = battle.isDraw;

      let xp = 0;
      if (draw) xp = 30;
      else if (won) xp = battle.player2?.isBot ? 40 : 75;
      else xp = 15;

      const profile = await authService.getUserProfile(user.uid);
      const updated = {
        ...profile,
        completedExercises: (profile.completedExercises || 0) + 5,
      };

      await achievementService.awardXp(
        user.uid,
        xp,
        draw ? 'Batalha empatada' : won ? 'Vitória na batalha!' : 'Participação na batalha'
      );
      await authService.updateUserProfile(user.uid, {
        completedExercises: updated.completedExercises,
      });
      await achievementService.checkChallengeRewards(user.uid);

      const rankResult = await rankingService.applyBattleResult(user.uid, {
        won,
        draw,
        vsBot: battle.player2?.isBot,
      });

      const fresh = await achievementService.refreshUserProfile(user.uid);
      if (fresh) setUserProfile(fresh);

      let rankMsg = rankResult
        ? ` ${rankResult.lpChange >= 0 ? '+' : ''}${rankResult.lpChange} LP`
        : '';
      if (rankResult?.promoted) {
        rankMsg += ` — Promovido para ${rankResult.tierInfo.name}! ${rankResult.tierInfo.emoji}`;
      }

      notify(user.uid, {
        type: won ? 'success' : 'info',
        title: draw ? 'Empate!' : won ? 'Vitória!' : 'Derrota',
        message: `+${xp} XP na batalha${rankMsg}`,
      });
    };

    applyResults();
  }, [phase, battle, resultsApplied, user.uid, setUserProfile]);

  const startMatchmaking = async () => {
    setLoading(true);
    setPhase('matching');
    setMatchingMsg('Procurando jogador online...');

    try {
      const battleId = await battleService.joinQueue(user.uid, userProfile, topic, difficulty);
      navigate(`/battle/${battleId}`, { replace: true });
      subscribeToBattle(battleId);
      setPhase('playing');
    } catch (e) {
      console.error(e);
      notify(user.uid, { type: 'error', message: 'Erro ao iniciar batalha. Tente novamente.' });
      setPhase('lobby');
    } finally {
      setLoading(false);
    }
  };

  const cancelMatchmaking = async () => {
    await battleService.cancelQueue(user.uid);
    setPhase('lobby');
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !battle) return;
    const timeMs = Date.now() - startTimeRef.current;
    await battleService.submitAnswer(battle.id, user.uid, selectedAnswer, timeMs);
    setSelectedAnswer('');
  };

  const myKey = battle ? battleService.getMyPlayerKey(battle, user.uid) : null;
  const opponentKey = myKey ? battleService.getOpponentKey(myKey) : null;
  const me = myKey ? battle[myKey] : null;
  const opponent = opponentKey ? battle[opponentKey] : null;
  const currentQ = battle?.questions?.[battle.currentRound];
  const myAnswered = me?.answers?.some((a) => a.round === battle?.currentRound);
  const oppAnswered = opponent?.answers?.some((a) => a.round === battle?.currentRound);

  const myBattleTier = getTierFromLP(userProfile?.battleLP || 0);

  if (phase === 'lobby') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex p-4 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl mb-4">
            <Swords className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Batalha de Conhecimento</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Duelo em tempo real — jogue contra outros estudantes ou contra a IA
          </p>
        </div>

        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Sua liga de batalha</p>
              <TierBadge tierId={userProfile?.battleTier} lp={userProfile?.battleLP || 0} size="lg" showLP />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>{userProfile?.battleWins || 0} vitórias • {userProfile?.battleLosses || 0} derrotas</p>
              {myBattleTier.nextTier && (
                <p className="text-xs mt-1">
                  Faltam {myBattleTier.lpToNext} LP para {myBattleTier.nextTier.emoji} {myBattleTier.nextTier.name}
                </p>
              )}
            </div>
          </div>
          <Link to="/leaderboard" className="text-sm text-primary-600 hover:underline mt-3 inline-block">
            Ver ranking de batalha →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center">
            <Users className="mx-auto text-green-500 mb-2" size={28} />
            <p className="text-2xl font-bold">{onlineCount}</p>
            <p className="text-xs text-gray-500">Online agora</p>
          </div>
          <div className="card text-center">
            <Bot className="mx-auto text-purple-500 mb-2" size={28} />
            <p className="text-sm font-medium">Bot automático</p>
            <p className="text-xs text-gray-500">Se ninguém estiver na fila em 8s</p>
          </div>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tópico da batalha</label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)} className="input-field">
              {BATTLE_TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Dificuldade: {difficulty}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <button
            type="button"
            onClick={startMatchmaking}
            disabled={loading}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
          >
            <Swords size={22} />
            Entrar na batalha
          </button>
        </div>

        <div className="card bg-blue-50 dark:bg-blue-900/20 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium text-gray-900 dark:text-white mb-2">Como funciona</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>5 perguntas de múltipla escolha</li>
            <li>20 segundos por rodada — resposta rápida = mais pontos</li>
            <li>Vitória contra jogador: +75 XP | Bot: +40 XP</li>
            <li>LP: PvP +25 / Bot +15 / Derrota -12 / Empate +5</li>
          </ul>
          <div className="flex flex-wrap gap-1 mt-3">
            {BATTLE_TIERS.slice(0, 6).map((t) => (
              <span key={t.id} className="text-xs opacity-80">
                {t.emoji} {t.name}
              </span>
            ))}
            <span className="text-xs">...</span>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'matching') {
    return (
      <div className="max-w-md mx-auto card py-16 text-center">
        <Loader2 className="w-14 h-14 animate-spin text-primary-600 mx-auto mb-6" />
        <h2 className="text-xl font-bold mb-2">{matchingMsg}</h2>
        <p className="text-gray-500 text-sm mb-6">
          Aguardando oponente no tópico <strong>{topic}</strong>...
        </p>
        <button type="button" onClick={cancelMatchmaking} className="btn-secondary">
          Cancelar
        </button>
      </div>
    );
  }

  if (phase === 'playing' && battle && currentQ) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              Rodada {battle.currentRound + 1}/{battle.totalRounds}
            </span>
            <span className={`flex items-center gap-1 font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-primary-600'}`}>
              <Clock size={18} /> {timeLeft}s
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`p-3 rounded-lg border-2 ${myAnswered ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-primary-500'}`}>
              <p className="text-xs text-gray-500">Você</p>
              <p className="font-bold truncate">{me?.displayName}</p>
              <p className="text-2xl font-bold text-primary-600">{me?.score || 0}</p>
            </div>
            <div className={`p-3 rounded-lg border-2 ${oppAnswered ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300'}`}>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                {opponent?.isBot && <Bot size={12} />}
                Oponente
              </p>
              <p className="font-bold truncate">{opponent?.displayName}</p>
              <p className="text-2xl font-bold text-orange-600">{opponent?.score || 0}</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{currentQ.question}</h2>

          <div className="space-y-2">
            {currentQ.options?.map((opt, i) => (
              <button
                key={i}
                type="button"
                disabled={myAnswered}
                onClick={() => setSelectedAnswer(opt)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === opt
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                } ${myAnswered ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {opt}
              </button>
            ))}
          </div>

          {!myAnswered && (
            <button
              type="button"
              onClick={submitAnswer}
              disabled={!selectedAnswer}
              className="btn-primary w-full mt-4"
            >
              Confirmar resposta
            </button>
          )}

          {myAnswered && !oppAnswered && (
            <p className="text-center text-gray-500 mt-4 animate-pulse">
              Aguardando oponente{opponent?.isBot ? ' (IA)' : ''}...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'playing' && !currentQ) {
    return (
      <div className="card py-20 text-center max-w-md mx-auto">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary-600" />
        <p>Gerando perguntas com IA...</p>
      </div>
    );
  }

  if (phase === 'results' && battle) {
    const won = battle.winnerId === user.uid;
    const draw = battle.isDraw;

    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className={`card text-center py-10 ${won ? 'bg-green-50 dark:bg-green-900/20' : draw ? '' : 'bg-red-50 dark:bg-red-900/20'}`}>
          {draw ? (
            <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          ) : won ? (
            <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          ) : (
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          )}
          <h1 className="text-3xl font-bold mb-2">
            {draw ? 'Empate!' : won ? 'Vitória!' : 'Derrota'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {me?.score} x {opponent?.score} pontos
          </p>
          {opponent?.isBot && (
            <p className="text-sm text-purple-600 mt-2 flex items-center justify-center gap-1">
              <Bot size={14} /> Você jogou contra a IA
            </p>
          )}
          {userProfile && (
            <div className="mt-4 flex justify-center">
              <TierBadge tierId={userProfile.battleTier} lp={userProfile.battleLP || 0} showLP />
            </div>
          )}
        </div>

        <div className="card space-y-2">
          <h3 className="font-semibold mb-3">Resumo das rodadas</h3>
          {battle.roundResults?.map((r, i) => (
            <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-800">
              <span>Rodada {r.round + 1}</span>
              <span>
                {r.player1Points} - {r.player2Points} pts
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/battle')} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Swords size={18} /> Nova batalha
          </button>
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex items-center gap-2">
            <ArrowLeft size={18} /> Início
          </button>
        </div>
      </div>
    );
  }

  return null;
}
