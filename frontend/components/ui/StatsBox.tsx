export interface StatsBoxProps {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'up' | 'down' | 'neutral';
}

export function StatsBox({ label, value, change, changeType = 'neutral' }: StatsBoxProps) {
  const changeColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  };

  const changeIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <p className="text-gray-400 text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      {change !== undefined && (
        <p className={`text-sm mt-2 ${changeColors[changeType]}`}>
          {changeIcons[changeType]} {Math.abs(change).toFixed(2)}%
        </p>
      )}
    </div>
  );
}
