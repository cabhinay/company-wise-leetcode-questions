import { useState, useMemo } from 'react';
import DifficultyBadge from './DifficultyBadge';

export default function QuestionTable({ questions, showCompanyTags, questionIndex, companiesMap }) {
  const [sortKey, setSortKey] = useState('frequency');
  const [sortDir, setSortDir] = useState('desc');
  const [diffFilter, setDiffFilter] = useState('All');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'title' ? 'asc' : 'desc'); }
  };

  const sorted = useMemo(() => {
    let list = questions;
    if (diffFilter !== 'All') list = list.filter(q => q.difficulty === diffFilter);
    return [...list].sort((a, b) => {
      let av, bv;
      if (sortKey === 'title') { av = a.title; bv = b.title; }
      else if (sortKey === 'id') { av = a.id; bv = b.id; }
      else if (sortKey === 'difficulty') {
        const order = { Easy: 0, Medium: 1, Hard: 2 };
        av = order[a.difficulty] ?? 1; bv = order[b.difficulty] ?? 1;
      }
      else if (sortKey === 'acceptance') { av = parseFloat(a.acceptance); bv = parseFloat(b.acceptance); }
      else { av = parseFloat(a.frequency); bv = parseFloat(b.frequency); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [questions, sortKey, sortDir, diffFilter]);

  const arrow = (key) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div>
      <div className="flex gap-1 mb-3 flex-wrap">
        {['All', 'Easy', 'Medium', 'Hard'].map(d => (
          <button
            key={d}
            onClick={() => setDiffFilter(d)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              diffFilter === d ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {d}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">{sorted.length} questions</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <Th onClick={() => handleSort('id')}>#{ arrow('id')}</Th>
              <Th onClick={() => handleSort('title')} className="min-w-[200px]">Title{arrow('title')}</Th>
              <Th onClick={() => handleSort('difficulty')}>Difficulty{arrow('difficulty')}</Th>
              <Th onClick={() => handleSort('acceptance')}>Accept %{arrow('acceptance')}</Th>
              <Th onClick={() => handleSort('frequency')}>Freq %{arrow('frequency')}</Th>
              {showCompanyTags && <th className="px-3 py-2">Companies</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map(q => (
              <tr key={q.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-3 py-2 text-gray-500">{q.id}</td>
                <td className="px-3 py-2">
                  <a
                    href={q.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    {q.title}
                  </a>
                </td>
                <td className="px-3 py-2"><DifficultyBadge difficulty={q.difficulty} /></td>
                <td className="px-3 py-2 text-gray-300">{q.acceptance}%</td>
                <td className="px-3 py-2 text-gray-300">{q.frequency}%</td>
                {showCompanyTags && questionIndex && (
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {(questionIndex[q.id]?.companies || []).slice(0, 5).map(s => (
                        <span key={s} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                          {companiesMap?.[s] || s}
                        </span>
                      ))}
                      {(questionIndex[q.id]?.companies || []).length > 5 && (
                        <span className="text-xs text-gray-500">
                          +{questionIndex[q.id].companies.length - 5}
                        </span>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
        <p className="text-center text-gray-500 py-8">No questions found.</p>
      )}
    </div>
  );
}

function Th({ children, onClick, className = '' }) {
  return (
    <th
      className={`px-3 py-2 cursor-pointer hover:text-white select-none whitespace-nowrap ${className}`}
      onClick={onClick}
    >
      {children}
    </th>
  );
}
