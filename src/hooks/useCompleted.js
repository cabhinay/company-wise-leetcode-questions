import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'completedQuestions';
const EVENT = 'completed-questions-change';

function read() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function write(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  // Notify listeners in the same tab
  window.dispatchEvent(new Event(EVENT));
}

export function useCompleted() {
  const [completed, setCompleted] = useState(read);

  useEffect(() => {
    const sync = () => setCompleted(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync); // other tabs
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggle = useCallback((id) => {
    const next = read();
    if (next.has(id)) next.delete(id);
    else next.add(id);
    write(next);
    setCompleted(next);
  }, []);

  const isCompleted = useCallback((id) => completed.has(id), [completed]);

  return { completed, isCompleted, toggle, count: completed.size };
}
