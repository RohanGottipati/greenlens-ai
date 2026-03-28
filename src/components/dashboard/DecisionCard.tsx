import Link from 'next/link'

interface Decision {
  title: string
  situation: string
  impactScore: number
  urgencyTier: string
  carbonImpact?: string
  financialImpact?: string
  effort?: string
}

interface DecisionCardProps {
  decision: Decision
  index: number
}

const urgencyColors: Record<string, string> = {
  high: 'bg-red-900 text-red-300',
  medium: 'bg-yellow-900 text-yellow-300',
  low: 'bg-blue-900 text-blue-300',
}

export default function DecisionCard({ decision, index }: DecisionCardProps) {
  const tierColor = urgencyColors[decision.urgencyTier?.toLowerCase()] ?? 'bg-gray-700 text-gray-300'

  return (
    <Link href={`/dashboard/decisions/${index}`}>
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-500 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-500 text-sm font-mono">#{index}</span>
              <h3 className="text-white font-semibold truncate">{decision.title}</h3>
            </div>
            <p className="text-gray-400 text-sm line-clamp-2">{decision.situation}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              {decision.carbonImpact && (
                <span className="text-green-400 text-xs">{decision.carbonImpact}</span>
              )}
              {decision.financialImpact && (
                <span className="text-blue-400 text-xs">{decision.financialImpact}</span>
              )}
              {decision.effort && (
                <span className="text-gray-500 text-xs">Effort: {decision.effort}</span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-white font-bold text-lg">{decision.impactScore}<span className="text-gray-500 text-sm">/10</span></p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColor}`}>
              {decision.urgencyTier}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
