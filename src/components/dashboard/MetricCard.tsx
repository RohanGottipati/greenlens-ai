interface MetricCardProps {
  label: string
  value: string
  unit?: string
  delta?: number | null
  status?: 'good' | 'warning'
}

export default function MetricCard({ label, value, unit, delta, status }: MetricCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {unit && <p className="text-gray-500 text-sm mt-0.5">{unit}</p>}
      <div className="flex items-center gap-2 mt-2">
        {delta !== null && delta !== undefined && (
          <span className={`text-sm font-medium ${delta < 0 ? 'text-green-400' : 'text-red-400'}`}>
            {delta > 0 ? '+' : ''}{delta}%
          </span>
        )}
        {status && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            status === 'good'
              ? 'bg-green-900 text-green-300'
              : 'bg-yellow-900 text-yellow-300'
          }`}>
            {status === 'good' ? 'On track' : 'Needs attention'}
          </span>
        )}
      </div>
    </div>
  )
}
