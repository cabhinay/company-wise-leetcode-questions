import { useState, useMemo } from 'react';
import { useQuestionIndex } from '../hooks/useQuestionIndex';
import { useCompanies } from '../hooks/useCompanies';
import DifficultyBadge from '../components/DifficultyBadge';
import CompanyTag from '../components/CompanyTag';

const POPULAR_TOPICS = [
  'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math',
  'Sorting', 'Greedy', 'Depth-First Search', 'Binary Search', 'Tree',
  'Breadth-First Search', 'Two Pointers', 'Stack', 'Sliding Window',
  'Linked List', 'Graph', 'Heap (Priority Queue)', 'Matrix',
  'Backtracking', 'Bit Manipulation', 'Design', 'Trie',
  'Divide and Conquer', 'Queue', 'Union Find', 'Recursion',
  'Prefix Sum', 'Segment Tree', 'Topological Sort', 'Binary Indexed Tree',
  'Database',
];

export default function TopicsPage() {
  const { index, loading } = useQuestionIndex();
  const { companies } = useCompanies();
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [diffFilter, setDiffFilter] = useState('All');
  const [sortKey, setSortKey] = useState('companies');
  const [sortDir, setSortDir] = useState('desc');
  const [topicSearch, setTopicSearch] = useState('');

  const companiesMap = useMemo(() => {
    const m = {};
    for (const c of companies) m[c.slug] = c.name;
    return m;
  }, [companies]);

  // Build topic → count map + all topics list
  const { topicCounts, allTopics } = useMemo(() => {
    const counts = {};
    for (const [, v] of Object.entries(index)) {
      const tags = v.topicTags || [];
      for (const t of tags) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    // Sort: popular topics first in order, then others alphabetically
    const popSet = new Set(POPULAR_TOPICS);
    const others = Object.keys(counts).filter(t => !popSet.has(t)).sort();
    const ordered = [...POPULAR_TOPICS.filter(t => counts[t]), ...others];
    return { topicCounts: counts, allTopics: ordered };
  }, [index]);

  const toggleTopic = (topic) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const filteredTopics = useMemo(() => {
    if (!topicSearch.trim()) return allTopics;
    const q = topicSearch.toLowerCase();
    return allTopics.filter(t => t.toLowerCase().includes(q));
  }, [allTopics, topicSearch]);

  // Build results: questions that have ALL selected topics
  const results = useMemo(() => {
    if (selectedTopics.length === 0) return [];
    return Object.entries(index)
      .filter(([, v]) => {
        const tags = v.topicTags || [];
        if (!selectedTopics.every(t => tags.includes(t))) return false;
        if (diffFilter !== 'All' && v.difficulty !== diffFilter) return false;
        return true;
      })
      .map(([id, v]) => ({ id: parseInt(id), ...v }))
      .sort((a, b) => {
        let av, bv;
        if (sortKey === 'title') { av = a.title; bv = b.title; }
        else if (sortKey === 'id') { av = a.id; bv = b.id; }
        else if (sortKey === 'difficulty') {
          const order = { Easy: 0, Medium: 1, Hard: 2 };
          av = order[a.difficulty] ?? 1; bv = order[b.difficulty] ?? 1;
        }
        else { av = (a.companies || []).length; bv = (b.companies || []).length; }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [index, selectedTopics, diffFilter, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'title' ? 'asc' : 'desc'); }
  };

  const arrow = (key) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  if (loading) {
    return <div className="text-center py-20 text-gray-400 dark:text-gray-500">Loading question index...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Topic-wise Questions</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Select one or more topics to find questions. Questions must match <strong>all</strong> selected topics.
      </p>

      {/* Topic search */}
      <input
        type="text"
        placeholder="Search topics..."
        value={topicSearch}
        onChange={e => setTopicSearch(e.target.value)}
        className="w-full sm:w-80 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 mb-4"
      />

      {/* Topic chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filteredTopics.map(topic => {
          const active = selectedTopics.includes(topic);
          return (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                active
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              {topic}
              <span className={`ml-1.5 text-xs ${active ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-600'}`}>
                {topicCounts[topic] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected topics summary + clear */}
      {selectedTopics.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">Selected:</span>
          {selectedTopics.map(t => (
            <span key={t} className="inline-flex items-center gap-1 bg-indigo-600/20 text-indigo-300 text-xs px-2 py-1 rounded-full border border-indigo-500/30">
              {t}
              <button onClick={() => toggleTopic(t)} className="hover:text-white ml-0.5">×</button>
            </span>
          ))}
          <button
            onClick={() => setSelectedTopics([])}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-400 ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Difficulty filter + count */}
      {selectedTopics.length > 0 && (
        <div className="flex gap-1 mb-4 flex-wrap items-center">
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
          <span className="ml-auto text-sm text-gray-400 dark:text-gray-500">{results.length} questions</span>
        </div>
      )}

      {/* Results */}
      {selectedTopics.length === 0 ? (
        <p className="text-center text-gray-400 dark:text-gray-500 py-12">Select one or more topics above to see questions.</p>
      ) : results.length === 0 ? (
        <p className="text-center text-gray-400 dark:text-gray-500 py-12">No questions match the selected topics.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <Th onClick={() => handleSort('id')}>#{arrow('id')}</Th>
                <Th onClick={() => handleSort('title')} className="min-w-[200px]">Title{arrow('title')}</Th>
                <Th onClick={() => handleSort('difficulty')}>Difficulty{arrow('difficulty')}</Th>
                <th className="px-3 py-2">Topics</th>
                <Th onClick={() => handleSort('companies')}>Companies{arrow('companies')}</Th>
              </tr>
            </thead>
            <tbody>
              {results.map(q => (
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
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {(q.topicTags || []).map(t => (
                        <span
                          key={t}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            selectedTopics.includes(t)
                              ? 'bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {(q.companies || []).slice(0, 5).map(s => (
                        <CompanyTag key={s} slug={s} name={companiesMap[s]} />
                      ))}
                      {(q.companies || []).length > 5 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          +{q.companies.length - 5}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
