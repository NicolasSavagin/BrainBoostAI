/**
 * Ligas de batalha (LP) e categorias de ranking de estudo.
 */
export const BATTLE_TIERS = [
  { id: 'madeira', name: 'Madeira', minLP: 0, emoji: '🪵', color: '#8B6914', bgClass: 'bg-amber-900/30 text-amber-200 border-amber-800' },
  { id: 'ferro', name: 'Ferro', minLP: 100, emoji: '⚙️', color: '#6B7280', bgClass: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-400' },
  { id: 'bronze', name: 'Bronze', minLP: 250, emoji: '🥉', color: '#CD7F32', bgClass: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border-orange-400' },
  { id: 'prata', name: 'Prata', minLP: 500, emoji: '🥈', color: '#9CA3AF', bgClass: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-400' },
  { id: 'ouro', name: 'Ouro', minLP: 800, emoji: '🥇', color: '#EAB308', bgClass: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 border-yellow-500' },
  { id: 'platina', name: 'Platina', minLP: 1200, emoji: '💎', color: '#22D3EE', bgClass: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200 border-cyan-500' },
  { id: 'diamante', name: 'Diamante', minLP: 1700, emoji: '💠', color: '#818CF8', bgClass: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 border-indigo-500' },
  { id: 'mestre', name: 'Mestre', minLP: 2300, emoji: '👑', color: '#A855F7', bgClass: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 border-purple-500' },
  { id: 'lenda', name: 'Lenda', minLP: 3000, emoji: '🌟', color: '#F43F5E', bgClass: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border-rose-500' },
];

export const RANKING_CATEGORIES = [
  { id: 'Programação', label: 'Programação', emoji: '💻' },
  { id: 'Matemática', label: 'Matemática', emoji: '📐' },
  { id: 'Inglês', label: 'Inglês', emoji: '🇬🇧' },
  { id: 'Geral', label: 'Geral', emoji: '📚' },
];

export function getTierById(tierId) {
  return BATTLE_TIERS.find((t) => t.id === tierId) || BATTLE_TIERS[0];
}

export function getTierFromLP(lp) {
  const points = Math.max(0, lp || 0);
  let tier = BATTLE_TIERS[0];
  for (const t of BATTLE_TIERS) {
    if (points >= t.minLP) tier = t;
  }
  const currentIndex = BATTLE_TIERS.findIndex((t) => t.id === tier.id);
  const nextTier = BATTLE_TIERS[currentIndex + 1] || null;
  return {
    ...tier,
    lp: points,
    nextTier,
    lpToNext: nextTier ? nextTier.minLP - points : 0,
    progressPercent: nextTier
      ? Math.min(100, Math.round(((points - tier.minLP) / (nextTier.minLP - tier.minLP)) * 100))
      : 100,
  };
}

export function topicToCategory(topic) {
  if (!topic) return 'Geral';
  if (topic.startsWith('Programação')) return 'Programação';
  if (topic.startsWith('Matemática')) return 'Matemática';
  if (topic.startsWith('Inglês')) return 'Inglês';
  return 'Geral';
}

export function getLPChange({ won, draw, vsBot }) {
  if (draw) return 5;
  if (won) return vsBot ? 15 : 25;
  return -12;
}
