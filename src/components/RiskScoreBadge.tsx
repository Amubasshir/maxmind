/**
 * Risk Score Badge Component
 *
 * Displays the risk score with color coding:
 * - 0-20: Green (low risk)
 * - 21-60: Amber (medium risk)
 * - 61-100: Red (high risk)
 */

interface RiskScoreBadgeProps {
  score?: number;
}

export default function RiskScoreBadge({ score }: RiskScoreBadgeProps) {
  // Determine color based on score
  let colorClass = 'text-gray-600 bg-gray-50';
  let label = 'N/A';

  if (score !== undefined && score !== null) {
    if (score >= 0 && score <= 20) {
      colorClass = 'text-green-600 bg-green-50';
      label = 'Low Risk';
    } else if (score >= 21 && score <= 60) {
      colorClass = 'text-amber-600 bg-amber-50';
      label = 'Medium Risk';
    } else if (score >= 61 && score <= 100) {
      colorClass = 'text-red-600 bg-red-50';
      label = 'High Risk';
    }
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${colorClass}`}
    >
      <span className="text-3xl font-bold">{score ?? 'N/A'}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
