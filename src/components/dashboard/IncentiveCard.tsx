interface IncentiveCardProps {
  title: string
  description: string
  region: string
  estimated_value: string
  action_required?: string
}

export default function IncentiveCard({
  title,
  description,
  region,
  estimated_value,
  action_required,
}: IncentiveCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold">{title}</h3>
          <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full mt-1 inline-block">{region}</span>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-green-400 font-semibold text-sm">{estimated_value}</p>
          <p className="text-gray-500 text-xs">estimated value</p>
        </div>
      </div>
      <p className="text-gray-400 text-sm">{description}</p>
      {action_required && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-gray-300 text-xs font-medium">Action required</p>
          <p className="text-gray-400 text-xs mt-0.5">{action_required}</p>
        </div>
      )}
    </div>
  )
}
