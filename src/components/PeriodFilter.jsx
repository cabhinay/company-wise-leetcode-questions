const PERIODS = [
  { key: 'all', label: 'All' },
  { key: 'thirtyDays', label: '30 Days' },
  { key: 'threeMonths', label: '3 Months' },
  { key: 'sixMonths', label: '6 Months' },
  { key: 'moreThanSixMonths', label: '6+ Months' },
];

export default function PeriodFilter({ value, onChange }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {PERIODS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === key
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
