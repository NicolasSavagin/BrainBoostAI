/**
 * Utilitários compartilhados de XP e nível.
 */
export function xpForLevel(level) {
  return (level || 1) * 100;
}

export function applyXpToProfile(profile, xpGain) {
  const updated = {
    ...profile,
    totalXP: (profile?.totalXP || 0) + xpGain,
    xp: (profile?.xp || 0) + xpGain,
  };

  let level = profile?.level || 1;
  let xp = updated.xp;
  const levelUps = [];

  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
    levelUps.push(level);
  }

  updated.level = level;
  updated.xp = xp;

  return { profile: updated, levelUps };
}

export function getLevelProgress(profile) {
  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const xpForNextLevel = xpForLevel(level);
  const percent = Math.min(Math.round((xp / xpForNextLevel) * 100), 100);

  return {
    level,
    xp,
    xpForNextLevel,
    xpToNext: xpForNextLevel - xp,
    percent,
  };
}
