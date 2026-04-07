import { useState, useEffect } from 'react';

let cache = null;

export function useCompanies() {
  const [companies, setCompanies] = useState(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    fetch(import.meta.env.BASE_URL + 'data/companies.json')
      .then(r => r.json())
      .then(data => {
        cache = data;
        setCompanies(data);
        setLoading(false);
      });
  }, []);

  return { companies: companies || [], loading };
}
