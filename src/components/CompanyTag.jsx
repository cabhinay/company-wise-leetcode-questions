import { Link } from 'react-router-dom';

export default function CompanyTag({ slug, name }) {
  return (
    <Link
      to={`/company/${slug}`}
      className="inline-block text-xs bg-gray-800 text-gray-300 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded-full transition-colors"
    >
      {name || slug}
    </Link>
  );
}
