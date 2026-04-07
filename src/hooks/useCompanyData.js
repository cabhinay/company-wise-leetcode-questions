import { useState, useEffect } from 'react';

const cache = {};

export function useCompanyData(slug) {
  const [data, setData] = useState(cache[slug] || null);
  const [loading, setLoading] = useState(!cache[slug]);

  useEffect(() => {
    if (cache[slug]) {
      setData(cache[slug]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(import.meta.env.BASE_URL + `data/companies/${slug}.json`)
      .then(r => r.json())
      .then(d => {
        cache[slug] = d;
        setData(d);
        setLoading(false);
      });
  }, [slug]);

  return { data, loading };
}
