import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCompanyData } from '../hooks/useCompanyData';
import { useCompanies } from '../hooks/useCompanies';
import { useQuestionIndex } from '../hooks/useQuestionIndex';
import QuestionTable from '../components/QuestionTable';
import PeriodFilter from '../components/PeriodFilter';
import { tierLabel, tierColor } from '../utils/formatters';

export default function CompanyPage() {
  const { slug } = useParams();
  const { data, loading } = useCompanyData(slug);
  const { companies } = useCompanies();
  const { index: questionIndex } = useQuestionIndex();
  const [period, setPeriod] = useState('all');

  const company = useMemo(() => companies.find(c => c.slug === slug), [companies, slug]);
  const companiesMap = useMemo(() => {
    const m = {};
    for (const c of companies) m[c.slug] = c.name;
    return m;
  }, [companies]);

  const questions = data?.[period] || [];

  if (loading) {
    return <div className="text-center py-20 text-gray-400 dark:text-gray-500">Loading questions...</div>;
  }

  return (
    <div>
      <Link to="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 inline-block">
        ← Back to companies
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{company?.name || slug}</h1>
        {company && (
          <span className={`text-xs px-2 py-1 rounded-full text-white font-medium ${tierColor(company.tier)}`}>
            {tierLabel(company.tier)}
          </span>
        )}
      </div>

      <div className="mb-6">
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <QuestionTable
        questions={questions}
        showCompanyTags
        questionIndex={questionIndex}
        companiesMap={companiesMap}
      />
    </div>
  );
}
