const TIER_LABELS = {
  faang: 'FAANG / Big Tech',
  'top-tech': 'Top Listed Tech',
  unicorn: 'High-Pay Unicorns',
  'indian-tech': 'Indian Top Tech',
};

export function tierLabel(tier) {
  return TIER_LABELS[tier] || tier;
}

export function tierColor(tier) {
  const colors = {
    faang: 'bg-purple-600',
    'top-tech': 'bg-blue-600',
    unicorn: 'bg-emerald-600',
    'indian-tech': 'bg-orange-600',
  };
  return colors[tier] || 'bg-gray-600';
}

export function difficultyColor(d) {
  if (d === 'Easy') return 'text-green-400';
  if (d === 'Medium') return 'text-yellow-400';
  if (d === 'Hard') return 'text-red-400';
  return 'text-gray-400';
}
