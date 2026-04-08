import { useState, useMemo, useEffect } from 'react';
import { useCompanies } from '../hooks/useCompanies';
import { useCompanyData } from '../hooks/useCompanyData';
import PeriodFilter from '../components/PeriodFilter';
import DifficultyBadge from '../components/DifficultyBadge';

export default function ComparePage() {
  const { companies } = useCompanies();
  const [selected, setSelected] = useState([]);
  const [period, setPeriod] = useState('all');

  const toggle = (slug) => {
    setSelected(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : prev.length < 3 ? [...prev, slug] : prev
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Compare Companies</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Select 2-3 companies to compare their common and unique questions.</p>

      {/* Company picker */}
      <div className="mb-6">
        <CompanyPicker companies={companies} selected={selected} onToggle={toggle} />
      </div>

      {selected.length >= 2 && (
        <>
          <div className="mb-6">
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>
          <ComparisonTable slugs={selected} period={period} companies={companies} />
        </>
      )}

      {selected.length < 2 && selected.length > 0 && (
        <p className="text-center text-gray-400 dark:text-gray-500 py-8">Select at least one more company.</p>
      )}
    </div>
  );
}

function CompanyPicker({ companies, selected, onToggle }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(c => c.name.toLowerCase().includes(q));
  }, [companies, search]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {selected.map(slug => {
          const c = companies.find(x => x.slug === slug);
          return (
            <button
              key={slug}
              onClick={() => onToggle(slug)}
              className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {c?.name || slug}
              <span className="text-indigo-200">×</span>
            </button>
          );
        })}
        {selected.length < 3 && (
          <span className="text-gray-400 dark:text-gray-500 text-sm py-1">
            {selected.length === 0 ? 'Pick up to 3 companies' : `${3 - selected.length} more`}
          </span>
        )}
      </div>
      <input
        type="text"
        placeholder="Search companies to add..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 mb-2"
      />
      {search.trim() && (
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {filtered.filter(c => !selected.includes(c.slug)).slice(0, 20).map(c => (
            <button
              key={c.slug}
              onClick={() => { onToggle(c.slug); setSearch(''); }}
              className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1 rounded-full text-sm"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ComparisonTable({ slugs, period, companies }) {
  const [allData, setAllData] = useState({});

  useEffect(() => {
    for (const slug of slugs) {
      if (allData[slug]) continue;
      fetch(import.meta.env.BASE_URL + `data/companies/${slug}.json`)
        .then(r => r.json())
        .then(d => setAllData(prev => ({ ...prev, [slug]: d })));
    }
  }, [slugs]);

  const ready = slugs.every(s => allData[s]);

  const analysis = useMemo(() => {
    if (!ready) return null;

    // Build question sets per company
    const sets = {};
    const qMap = {};
    for (const slug of slugs) {
      const qs = allData[slug]?.[period] || [];
      sets[slug] = new Set(qs.map(q => q.id));
      for (const q of qs) qMap[q.id] = q;
    }

    // Common = in all selected
    const common = Object.keys(qMap)
      .map(Number)
      .filter(id => slugs.every(s => sets[s].has(id)))
      .map(id => qMap[id]);

    // Unique per company
    const unique = {};
    for (const slug of slugs) {
      unique[slug] = [...sets[slug]]
        .filter(id => !slugs.some(s => s !== slug && sets[s].has(id)))
        .map(id => qMap[id]);
    }

    return { common, unique };
  }, [allData, slugs, period, ready]);

  const nameOf = (slug) => companies.find(c => c.slug === slug)?.name || slug;

  if (!ready) {
    return <div className="text-center py-8 text-gray-400 dark:text-gray-500">Loading data...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Common */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Common Questions
          <span className="text-sm text-gray-400 dark:text-gray-500 font-normal ml-2">({analysis.common.length})</span>
        </h2>
        {analysis.common.length > 0 ? (
          <QList questions={analysis.common} />
        ) : (
          <p className="text-gray-400 dark:text-gray-500">No common questions in this period.</p>
        )}
      </section>

      {/* Unique per company */}
      {slugs.map(slug => (
        <section key={slug}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Only in {nameOf(slug)}
            <span className="text-sm text-gray-400 dark:text-gray-500 font-normal ml-2">({analysis.unique[slug].length})</span>
          </h2>
          {analysis.unique[slug].length > 0 ? (
            <QList questions={analysis.unique[slug]} />
          ) : (
            <p className="text-gray-400 dark:text-gray-500">No unique questions.</p>
          )}
        </section>
      ))}
    </div>
  );
}

function QList({ questions }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Difficulty</th>
            <th className="px-3 py-2">Freq %</th>
          </tr>
        </thead>
        <tbody>
          {questions.map(q => (
            <tr key={q.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
              <td className="px-3 py-2 text-gray-400 dark:text-gray-500">{q.id}</td>
              <td className="px-3 py-2">
                <a href={q.url} target="_blank" rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline">
                  {q.title}
                </a>
              </td>
              <td className="px-3 py-2"><DifficultyBadge difficulty={q.difficulty} /></td>
              <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{q.frequency}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
