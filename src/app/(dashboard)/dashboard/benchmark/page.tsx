import { createClient } from '@/lib/supabase/server'
import AnalysisTriggerScreen from '@/components/dashboard/AnalysisTriggerScreen'

export default async function BenchmarkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase.from('companies').select('id, name, industry')
    .eq('supabase_user_id', user!.id).single()
  const { data: report } = await supabase.from('reports').select('*')
    .eq('company_id', company!.id).order('created_at', { ascending: false }).limit(1).single()

  if (!report) return <AnalysisTriggerScreen companyId={company!.id} />

  const benchmark = report.benchmark_data
  const stat = report.stat_analysis

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Industry Benchmark</h1>
        <p className="text-gray-400 mt-1">{company!.name} · {company!.industry?.replace(/_/g, ' ')}</p>
      </div>

      {/* Percentile cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-1">Carbon Intensity Percentile</p>
          <div className="flex items-end gap-2">
            <p className="text-5xl font-bold text-white">{report.carbon_percentile?.toFixed(0)}</p>
            <p className="text-gray-400 text-xl mb-1">th</p>
          </div>
          <p className="text-gray-400 text-sm mt-2">{benchmark?.carbon_percentile?.relative_position}</p>
          <div className="mt-4 bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${Math.min(100, report.carbon_percentile ?? 0)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Lowest carbon</span>
            <span>Highest carbon</span>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-1">Usage Trend</p>
          <p className="text-3xl font-bold text-white capitalize mt-1">{report.trend_direction}</p>
          <p className="text-gray-400 text-sm mt-2">
            Slope: {stat?.usage_trend?.slope?.toFixed(1)} requests/day
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Projected 30-day total: {stat?.usage_trend?.projected_30d_requests?.toLocaleString()} requests
          </p>
        </div>
      </div>

      {/* Hype cycle context */}
      {report.executive_summary?.hype_cycle_context && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Gartner Hype Cycle Context</h2>
          <p className="text-gray-300 leading-relaxed">{report.executive_summary.hype_cycle_context}</p>
        </div>
      )}

      {/* Industry context */}
      {benchmark?.industry_context && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Industry Context</h2>
          <p className="text-gray-300 leading-relaxed">{benchmark.industry_context}</p>
          {benchmark?.peer_comparison && (
            <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-xs">Sector median carbon/request</p>
                <p className="text-white font-semibold">{benchmark.peer_comparison.median_carbon_per_request} g CO2e</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Your carbon/request</p>
                <p className="text-white font-semibold">{benchmark.peer_comparison.your_carbon_per_request} g CO2e</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
