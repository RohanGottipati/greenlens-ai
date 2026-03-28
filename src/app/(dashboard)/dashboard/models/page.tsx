import { createClient } from '@/lib/supabase/server'
import AnalysisTriggerScreen from '@/components/dashboard/AnalysisTriggerScreen'
import MitigationCard from '@/components/dashboard/MitigationCard'

const clusterLabels: Record<string, { label: string; color: string; description: string }> = {
  classification_routing: {
    label: 'Classification & Routing',
    color: 'bg-blue-900 text-blue-300',
    description: 'High volume, low tokens — small models appropriate',
  },
  generation_drafting: {
    label: 'Generation & Drafting',
    color: 'bg-purple-900 text-purple-300',
    description: 'Medium volume, medium tokens — mid-tier models',
  },
  analysis_reasoning: {
    label: 'Analysis & Reasoning',
    color: 'bg-orange-900 text-orange-300',
    description: 'Low volume, high tokens — frontier models justified',
  },
}

export default async function ModelsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase.from('companies').select('id, name')
    .eq('supabase_user_id', user!.id).single()
  const { data: report } = await supabase.from('reports').select('*')
    .eq('company_id', company!.id).order('created_at', { ascending: false }).limit(1).single()

  if (!report) return <AnalysisTriggerScreen companyId={company!.id} />

  const modelAnalysis = report.model_efficiency_analysis
  const statAnalysis = report.stat_analysis

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Model Efficiency</h1>
        <p className="text-gray-400 mt-1">{company!.name} · {report.reporting_period}</p>
      </div>

      {/* Efficiency score */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Efficiency Score</p>
          <p className="text-3xl font-bold text-white mt-1">{report.model_efficiency_score}<span className="text-gray-500 text-lg">/100</span></p>
          <p className="text-gray-500 text-xs mt-1">Weighted model fitness score</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Frontier Model Usage</p>
          <p className="text-3xl font-bold text-white mt-1">
            {modelAnalysis?.frontier_model_percentage?.toFixed(0) ?? '—'}%
          </p>
          <p className="text-gray-500 text-xs mt-1">of requests use frontier models</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Anomaly Status</p>
          <p className={`text-lg font-bold mt-1 ${report.anomaly_detected ? 'text-yellow-400' : 'text-green-400'}`}>
            {report.anomaly_detected ? 'Spike detected' : 'Normal'}
          </p>
          {statAnalysis?.anomaly_detection?.spike_dates?.length > 0 && (
            <p className="text-gray-500 text-xs mt-1">
              {statAnalysis.anomaly_detection.spike_dates.slice(0, 2).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Task clusters */}
      {modelAnalysis?.task_clusters && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Task Clustering</h2>
          <p className="text-gray-400 text-sm mb-4">
            GreenLens classifies your usage patterns into task types to identify model-task mismatches.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(modelAnalysis.task_clusters as Record<string, { count: number; avg_tokens: number }>).map(([cluster, data]) => {
              const info = clusterLabels[cluster] ?? { label: cluster, color: 'bg-gray-700 text-gray-300', description: '' }
              return (
                <div key={cluster} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${info.color}`}>
                    {info.label}
                  </span>
                  <p className="text-white font-semibold text-lg mt-2">{data.count?.toLocaleString()} requests</p>
                  <p className="text-gray-500 text-xs mt-1">Avg {data.avg_tokens?.toLocaleString()} tokens</p>
                  <p className="text-gray-400 text-xs mt-2">{info.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Model inventory */}
      {modelAnalysis?.models && modelAnalysis.models.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Model Inventory</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 font-medium px-4 py-3">Model</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3">Provider</th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3">Requests</th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3">Tokens</th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {modelAnalysis.models.map((m: { model: string; provider: string; requests: number; total_tokens: number; efficiency_score: number }, i: number) => (
                  <tr key={i} className="border-b border-gray-700 last:border-0">
                    <td className="px-4 py-3 text-white font-mono text-xs">{m.model}</td>
                    <td className="px-4 py-3 text-gray-400">{m.provider}</td>
                    <td className="px-4 py-3 text-gray-300 text-right">{m.requests?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-300 text-right">{m.total_tokens?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${m.efficiency_score > 60 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {m.efficiency_score}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mitigation strategies */}
      {report.model_efficiency_score < 60 && report.mitigation_strategies?.strategies?.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-white mb-4">Improvement Strategies</h2>
          <div className="space-y-3">
            {report.mitigation_strategies.strategies.map((s: { strategy: string; description: string; expectedScoreImprovement: string; effort: string; timeframe: string }, i: number) => (
              <MitigationCard key={i} {...s} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
