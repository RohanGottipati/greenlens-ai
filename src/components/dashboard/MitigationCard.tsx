interface MitigationCardProps {
  strategy: string
  description: string
  expectedScoreImprovement: string
  effort: string
  timeframe: string
}

export default function MitigationCard({
  strategy,
  description,
  expectedScoreImprovement,
  effort,
  timeframe,
}: MitigationCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium">{strategy}</p>
          <p className="text-gray-400 text-sm mt-1">{description}</p>
          {effort && (
            <p className="text-gray-500 text-xs mt-2">Effort: {effort}</p>
          )}
        </div>
        <div className="text-right shrink-0 ml-4">
          <span className="text-green-400 text-sm font-medium">{expectedScoreImprovement}</span>
          <p className="text-gray-500 text-xs">{timeframe}</p>
        </div>
      </div>
    </div>
  )
}
