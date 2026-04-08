import { useState, useMemo } from 'react';
import { useQuestionIndex } from '../hooks/useQuestionIndex';
import { useCompanies } from '../hooks/useCompanies';
import DifficultyBadge from '../components/DifficultyBadge';
import CompanyTag from '../components/CompanyTag';

export default function SearchPage() {
  const { index, loading } = useQuestionIndex();
  const { companies } = useCompanies();
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('All');

  const companiesMap = useMemo(() => {
    const m = {};
    for (const c of companies) m[c.slug] = c.name;
    return m;
  }, [companies]);

  const results = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return Object.entries(index)
      .filter(([, v]) => {
        if (!v.title.toLowerCase().includes(q)) return false;
        if (diffFilter !== 'All' && v.difficulty !== diffFilter) return false;
        return true;
      })
      .map(([id, v]) => ({ id: parseInt(id), ...v }))
      .slice(0, 100);
  }, [index, search, diffFilter]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400 dark:text-gray-500">Loading question index...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Search Questions</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Search {Object.keys(index).length} unique questions across all companies.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by question title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <div className="flex gap-1">
          {['All', 'Easy', 'Medium', 'Hard'].map(d => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                diffFilter === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {!search.trim() ? (
        <p className="text-center text-gray-400 dark:text-gray-500 py-12">Type a question title to search.</p>
      ) : results.length === 0 ? (
        <p className="text-center text-gray-400 dark:text-gray-500 py-12">No questions found.</p>
      ) : (
        <div className="space-y-3">
          {results.map(q => (
            <div key={q.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-gray-400 dark:text-gray-500 text-sm mr-2">#{q.id}</span>
                  <a
                    href={q.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium hover:underline"
                  >
                    {q.title}
                  </a>
                </div>
                <DifficultyBadge difficulty={q.difficulty} />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {q.companies.map(s => (
                  <CompanyTag key={s} slug={s} name={companiesMap[s]} />
                ))}
              </div>
            </div>
          ))}
          {results.length === 100 && (
            <p className="text-center text-gray-400 dark:text-gray-500 text-sm">Showing first 100 results. Refine your search.</p>
          )}
        </div>
      )}
    </div>
  );
}
