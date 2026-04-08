import { Link } from 'react-router-dom';
import { tierColor } from '../utils/formatters';

export default function CompanyCard({ slug, name, tier, count }) {
  return (
    <Link
      to={`/company/${slug}`}
      className="group block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-indigo-500 transition-colors min-w-[160px]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
          {name}
        </h3>
        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium ${tierColor(tier)}`}>
          {tier === 'faang' ? 'FAANG' : tier === 'top-tech' ? 'Tech' : tier === 'unicorn' ? '🦄' : '🇮🇳'}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{count} questions</p>
    </Link>
  );
}
