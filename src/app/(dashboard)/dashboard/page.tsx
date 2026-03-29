import { createClient } from '@/lib/supabase/server'
import MetricCard from '@/components/dashboard/MetricCard'
import DecisionCard from '@/components/dashboard/DecisionCard'
import AnalysisTriggerScreen from '@/components/dashboard/AnalysisTriggerScreen'
import RerunAnalysisButton from '@/components/dashboard/RerunAnalysisButton'
import { getCompanyAnalysisState } from '@/lib/analysis/get-company-analysis-state'
import { getPreferredReport } from '@/lib/reports/get-preferred-report'
import {
  getReportFreshness,
  getSectionAvailability,
} from '@/lib/reports/report-availability'

interface DashboardPageProps {
  searchParams?: Promise<{ reportId?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const requestedReportId = (await searchParams)?.reportId ?? null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase.from('companies').select('id, name')
    .eq('supabase_user_id', user!.id).single()
  const report = await getPreferredReport(supabase, company!.id, requestedReportId)
  const { analysisJob } = await getCompanyAnalysisState(supabase, company!.id)

  if (!report) return <AnalysisTriggerScreen companyId={company!.id} initialJobState={analysisJob} />

  const sectionAvailability = getSectionAvailability(report)
  const freshness = getReportFreshness(report)
  const carbonWaterAvailable = sectionAvailability.carbon_water.status === 'available'
  const modelEfficiencyAvailable = sectionAvailability.model_efficiency.status === 'available'
  const benchmarkAvailable = sectionAvailability.benchmark.status === 'available'
  const licenseAvailable = sectionAvailability.license.status === 'available'
  const anomalyDetected = benchmarkAvailable
    ? report.anomaly_detected ?? report.stat_analysis?.anomaly_detection?.anomaly_detected ?? false
    : false
  const carbonPercentile = benchmarkAvailable
    ? report.carbon_percentile ?? report.stat_analysis?.carbon_percentile?.percentile ?? null
    : null
  const trendDirection = benchmarkAvailable
    ? report.trend_direction ?? report.stat_analysis?.usage_trend?.trend_direction ?? null
    : null
  const mitigationStrategies = report.mitigation_strategies?.strategies
    ?? report.executive_summary?.mitigation_strategies
    ?? []
  const latestCompleteDay = freshness?.latest_complete_day ?? freshness?.coverage_end ?? null

  const carbonDelta = carbonWaterAvailable && report.prev_carbon_kg && report.carbon_kg != null
    ? Math.round(((report.carbon_kg - report.prev_carbon_kg) / report.prev_carbon_kg) * 100) : null
  const scoreDelta = modelEfficiencyAvailable && report.prev_model_efficiency_score && report.model_efficiency_score != null
    ? report.model_efficiency_score - report.prev_model_efficiency_score : null

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Intelligence Brief</h1>
          <p className="text-gray-400 mt-1">
            {company!.name} · {report.reporting_period}
            {latestCompleteDay ? ` · Data through ${latestCompleteDay}` : ''}
          </p>
        </div>
        <RerunAnalysisButton initialJobState={analysisJob} />
      </div>

      {/* Anomaly alert */}
      {anomalyDetected && (
        <div className="bg-yellow-950 border border-yellow-700 rounded-xl p-4 mb-6">
          <p className="text-yellow-300 text-sm font-medium">
            Unusual activity detected this period. Your AI usage spiked significantly above baseline.
            See the model analysis page for details.
          </p>
        </div>
      )}

      {/* Top line metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Monthly AI Carbon"
          value={carbonWaterAvailable && report.carbon_kg != null ? `${Math.round(report.carbon_kg)} kg` : '—'}
          unit={carbonWaterAvailable ? 'CO2e' : undefined}
          delta={carbonDelta}
        />
        <MetricCard label="Monthly AI Water"
          value={carbonWaterAvailable && report.water_liters != null
            ? `${Math.round(report.water_liters / 1000)}k L`
            : '—'}
          unit={carbonWaterAvailable && report.executive_summary?.water_bottles != null
            ? `~${Math.round(report.executive_summary.water_bottles / 1000)}k bottles`
            : undefined}
        />
        <MetricCard
          label="Model Efficiency"
          value={modelEfficiencyAvailable && report.model_efficiency_score != null
            ? `${report.model_efficiency_score}/100`
            : '—'}
          delta={scoreDelta}
          status={modelEfficiencyAvailable && report.model_efficiency_score != null
            ? (report.model_efficiency_score > 60 ? 'good' : 'warning')
            : undefined}
        />
        <MetricCard label="License Utilization"
          value={licenseAvailable && report.license_utilization_rate != null
            ? `${Math.round(report.license_utilization_rate)}%`
            : '—'}
          status={licenseAvailable && report.license_utilization_rate != null
            ? (report.license_utilization_rate > 75 ? 'good' : 'warning')
            : undefined}
        />
      </div>

      {/* Sector percentile + trend */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Sector Position</p>
          <p className="text-white font-semibold">
            {carbonPercentile != null ? `${carbonPercentile.toFixed(0)}th percentile for carbon intensity` : 'Sector percentile unavailable'}
          </p>
          <p className="text-gray-400 text-sm">
            {benchmarkAvailable
              ? report.benchmark_data?.carbon_percentile?.relative_position ?? 'Benchmark context unavailable.'
              : sectionAvailability.benchmark.message}
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Usage Trend</p>
          <p className="text-white font-semibold capitalize">{trendDirection ?? 'Unavailable'}</p>
          <p className="text-gray-400 text-sm">
            {benchmarkAvailable
              ? `Projected 30-day: ${report.stat_analysis?.usage_trend?.projected_30d_requests?.toLocaleString() ?? '—'} requests`
              : sectionAvailability.benchmark.message}
          </p>
        </div>
      </div>

      {/* Executive narrative */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-8">
        <p className="text-gray-300 leading-relaxed">{report.executive_summary?.narrative}</p>
        {report.executive_summary?.hype_cycle_context && (
          <p className="text-gray-400 text-sm mt-3 pt-3 border-t border-gray-700">
            {report.executive_summary.hype_cycle_context}
          </p>
        )}
      </div>

      {/* Decisions */}
      <h2 className="text-xl font-semibold text-white mb-4">Decisions This Quarter</h2>
      <div className="space-y-4 mb-8">
        {report.strategic_decisions?.decisions
          ?.sort((a: { impactScore: number }, b: { impactScore: number }) => b.impactScore - a.impactScore)
          .slice(0, 3)
          .map((decision: { title: string; situation: string; impactScore: number; urgencyTier: string; carbonImpact?: string; financialImpact?: string; effort?: string }, i: number) => (
            <DecisionCard key={i} decision={decision} index={i + 1} />
          ))}
      </div>

      {/* Mitigation strategies if score is low */}
      {modelEfficiencyAvailable && report.model_efficiency_score != null && report.model_efficiency_score < 60 && (
        <>
          <h2 className="text-xl font-semibold text-white mb-4">
            Improving Your Score ({report.model_efficiency_score}/100)
          </h2>
          <div className="space-y-3 mb-8">
            {mitigationStrategies.map((s: { strategy: string; description: string; expectedScoreImprovement: string; timeframe: string }, i: number) => (
              <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">{s.strategy}</p>
                    <p className="text-gray-400 text-sm mt-1">{s.description}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-green-400 text-sm font-medium">{s.expectedScoreImprovement}</span>
                    <p className="text-gray-500 text-xs">{s.timeframe}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Incentives teaser */}
      {report.incentives_and_benefits?.incentives?.length > 0 && (
        <div className="bg-blue-950 border border-blue-800 rounded-xl p-4">
          <p className="text-blue-300 text-sm font-medium mb-1">Financial and Regulatory Incentives Available</p>
          <p className="text-blue-400 text-sm">
            Based on your organization&apos;s profile and regions, {report.incentives_and_benefits.incentives.length} incentives
            or compliance obligations are relevant to your AI usage. View the full incentives report.
          </p>
        </div>
      )}
    </div>
  )
}
