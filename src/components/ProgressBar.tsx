
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  color?: string;
  height?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = true,
  color = 'bg-umbc-gold',
  height = 'h-2',
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-gray-400">{label}</span>}
          {showPercent && (
            <span className="text-sm font-semibold text-umbc-gold ml-auto">
              {Math.round(percent)}%
            </span>
          )}
        </div>
      )}
      <div className={`progress-bar ${height}`}>
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
