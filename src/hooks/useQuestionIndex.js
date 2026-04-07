import { useState, useEffect } from 'react';

let cache = null;

export function useQuestionIndex() {
  const [index, setIndex] = useState(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    fetch(import.meta.env.BASE_URL + 'data/question-index.json')
      .then(r => r.json())
      .then(data => {
        cache = data;
        setIndex(data);
        setLoading(false);
      });
  }, []);

  return { index: index || {}, loading };
}
