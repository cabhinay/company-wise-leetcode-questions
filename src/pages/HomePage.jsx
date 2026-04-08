import { useState, useMemo } from 'react';
import { useCompanies } from '../hooks/useCompanies';
import CompanyCard from '../components/CompanyCard';
import { tierLabel } from '../utils/formatters';

const TIER_ORDER = ['faang', 'top-tech', 'unicorn', 'indian-tech'];

export default function HomePage() {
  const { companies, loading } = useCompanies();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = companies;
    if (tierFilter !== 'all') list = list.filter(c => c.tier === tierFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [companies, search, tierFilter]);

  const grouped = useMemo(() => {
    const map = {};
    for (const t of TIER_ORDER) map[t] = [];
    for (const c of filtered) {
      if (map[c.tier]) map[c.tier].push(c);
    }
    return map;
  }, [filtered]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400 dark:text-gray-500">Loading companies...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">LeetCode Company Questions</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Browse interview questions from {companies.length} top companies, curated by tier.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Tiers</option>
          {TIER_ORDER.map(t => (
            <option key={t} value={t}>{tierLabel(t)}</option>
          ))}
        </select>
      </div>

      {/* Tier Sections */}
      {TIER_ORDER.map(tier => {
        const list = grouped[tier];
        if (!list || list.length === 0) return null;
        return (
          <section key={tier} className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              {tierLabel(tier)}
              <span className="text-sm text-gray-400 dark:text-gray-500 font-normal">({list.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {list.map(c => (
                <CompanyCard
                  key={c.slug}
                  slug={c.slug}
                  name={c.name}
                  tier={c.tier}
                  count={c.counts.all}
                />
              ))}
            </div>
          </section>
        );
      })}

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 dark:text-gray-500 py-12">No companies match your search.</p>
      )}
    </div>
  );
}
