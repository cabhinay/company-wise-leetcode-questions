import { difficultyColor } from '../utils/formatters';

export default function DifficultyBadge({ difficulty }) {
  return (
    <span className={`text-sm font-medium ${difficultyColor(difficulty)}`}>
      {difficulty}
    </span>
  );
}
