import { useState, useMemo, useRef, useEffect } from 'react';
import DifficultyBadge from './DifficultyBadge';

export default function QuestionTable({ questions, showCompanyTags, questionIndex, companiesMap }) {
  const [sortKey, setSortKey] = useState('frequency');
  const [sortDir, setSortDir] = useState('desc');
  const [diffFilter, setDiffFilter] = useState('All');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setTopicDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allTopics = useMemo(() => {
    const topics = new Set();
    for (const q of questions) {
      const tags = q.topicTags || (q.topic ? [q.topic] : []);
      for (const t of tags) topics.add(t);
    }
    return Array.from(topics).sort();
  }, [questions]);

  const toggleTopic = (topic) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'title' ? 'asc' : 'desc'); }
  };

  const sorted = useMemo(() => {
    let list = questions;
    if (diffFilter !== 'All') list = list.filter(q => q.difficulty === diffFilter);
    if (selectedTopics.length > 0) {
      list = list.filter(q => {
        const tags = q.topicTags || (q.topic ? [q.topic] : []);
        return selectedTopics.some(t => tags.includes(t));
      });
    }
    return [...list].sort((a, b) => {
      let av, bv;
      if (sortKey === 'title') { av = a.title; bv = b.title; }
      else if (sortKey === 'id') { av = a.id; bv = b.id; }
      else if (sortKey === 'difficulty') {
        const order = { Easy: 0, Medium: 1, Hard: 2 };
        av = order[a.difficulty] ?? 1; bv = order[b.difficulty] ?? 1;
      }
      else if (sortKey === 'topic') { av = a.topic || ''; bv = b.topic || ''; }
      else if (sortKey === 'acceptance') { av = parseFloat(a.acceptance); bv = parseFloat(b.acceptance); }
      else { av = parseFloat(a.frequency); bv = parseFloat(b.frequency); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [questions, sortKey, sortDir, diffFilter, selectedTopics]);

  const arrow = (key) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div>
      <div className="flex gap-1 mb-3 flex-wrap items-center">
        {['All', 'Easy', 'Medium', 'Hard'].map(d => (
          <button
            key={d}
            onClick={() => setDiffFilter(d)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              diffFilter === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {d}
          </button>
        ))}

        {/* Topic multi-select */}
        <div className="relative ml-4" ref={dropdownRef}>
          <button
            onClick={() => setTopicDropdownOpen(o => !o)}
            className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 transition-colors"
          >
            Topics {selectedTopics.length > 0 && `(${selectedTopics.length})`} ▾
          </button>
          {topicDropdownOpen && (
            <div className="absolute z-50 mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto w-72">
              {allTopics.map(t => (
                <label
                  key={t}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(t)}
                    onChange={() => toggleTopic(t)}
                    className="rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className={selectedTopics.includes(t) ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}>{t}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {selectedTopics.map(t => (
          <span key={t} className="inline-flex items-center gap-1 bg-indigo-600/20 text-indigo-300 text-xs px-2 py-1 rounded-full border border-indigo-500/30">
            {t}
            <button onClick={() => toggleTopic(t)} className="hover:text-white">×</button>
          </span>
        ))}
        {selectedTopics.length > 0 && (
          <button onClick={() => setSelectedTopics([])} className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-400">Clear</button>
        )}

        <span className="ml-auto text-sm text-gray-400 dark:text-gray-500">{sorted.length} questions</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <Th onClick={() => handleSort('id')}>#{ arrow('id')}</Th>
              <Th onClick={() => handleSort('title')} className="min-w-[200px]">Title{arrow('title')}</Th>
              <Th onClick={() => handleSort('difficulty')}>Difficulty{arrow('difficulty')}</Th>
              <Th onClick={() => handleSort('acceptance')}>Accept %{arrow('acceptance')}</Th>
              <Th onClick={() => handleSort('frequency')}>Freq %{arrow('frequency')}</Th>
              <Th onClick={() => handleSort('topic')}>Topic{arrow('topic')}</Th>
              {showCompanyTags && <th className="px-3 py-2">Companies</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map(q => (
              <tr key={q.id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="px-3 py-2 text-gray-400 dark:text-gray-500">{q.id}</td>
                <td className="px-3 py-2">
                  <a
                    href={q.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline"
                  >
                    {q.title}
                  </a>
                </td>
                <td className="px-3 py-2"><DifficultyBadge difficulty={q.difficulty} /></td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{q.acceptance}%</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{q.frequency}%</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1 flex-wrap">
                    {(q.topicTags || (q.topic ? [q.topic] : ['Other'])).map(t => (
                      <span key={t} className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedTopics.includes(t)
                          ? 'bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>{t}</span>
                    ))}
                  </div>
                </td>
                {showCompanyTags && questionIndex && (
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {(questionIndex[q.id]?.companies || []).slice(0, 5).map(s => (
                        <span key={s} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                          {companiesMap?.[s] || s}
                        </span>
                      ))}
                      {(questionIndex[q.id]?.companies || []).length > 5 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
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
        <p className="text-center text-gray-400 dark:text-gray-500 py-8">No questions found.</p>
      )}
    </div>
  );
}

function Th({ children, onClick, className = '' }) {
  return (
    <th
      className={`px-3 py-2 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none whitespace-nowrap ${className}`}
      onClick={onClick}
    >
      {children}
    </th>
  );
}
