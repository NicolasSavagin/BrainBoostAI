import { getTierFromLP, getTierById } from '../../config/rankings';

export default function TierBadge({ tierId, lp, size = 'md', showLP = false }) {
  const tier = tierId
    ? { ...getTierById(tierId), lp: lp ?? 0 }
    : getTierFromLP(lp ?? 0);

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${tier.bgClass} ${sizes[size]}`}
      title={`${tier.name} — ${lp ?? tier.lp ?? 0} LP`}
    >
      <span>{tier.emoji}</span>
      <span>{tier.name}</span>
      {showLP && <span className="opacity-80">({lp ?? tier.lp ?? 0} LP)</span>}
    </span>
  );
}
