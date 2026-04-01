export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import AnalysisTriggerScreen from '@/components/dashboard/AnalysisTriggerScreen'
import {
  DashboardBadge,
  DashboardBarRow,
  DashboardEmptyState,
  DashboardHeader,
  DashboardMetaPill,
  DashboardMiniStat,
  DashboardPage,
  DashboardPanel,
  DashboardStatCard,
  DashboardStatGrid,
  formatCompactNumber,
  formatNumber,
  formatPercent,
  titleize,
} from '@/components/dashboard/DashboardPrimitives'
import { DashboardFilterSelect } from '@/components/dashboard/DashboardFilterSelect'
import MitigationCard from '@/components/dashboard/MitigationCard'
import RerunAnalysisButton from '@/components/dashboard/RerunAnalysisButton'
import SectionAvailabilityNotice from '@/components/dashboard/SectionAvailabilityNotice'
import { getCompanyAnalysisState } from '@/lib/analysis/get-company-analysis-state'
import { getPreferredReport } from '@/lib/reports/get-preferred-report'
import { getCompanyReports } from '@/lib/reports/get-company-reports'
import { getSectionAvailability } from '@/lib/reports/report-availability'
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Gauge,
} from 'lucide-react'

const clusterLabels: Record<string, { label: string; tone: 'blue' | 'amber' | 'green' | 'slate'; description: string }> = {
  // current values (from classifyBehavior in usage-analyst.ts)
  high_frequency_low_token: {
    label: 'Classification & Routing',
    tone: 'blue',
    description: 'High volume, low tokens — small models appropriate',
  },
  uniform: {
    label: 'Generation & Drafting',
    tone: 'green',
    description: 'Medium volume, medium tokens — mid-tier models',
  },
  low_frequency_high_token: {
    label: 'Analysis & Reasoning',
    tone: 'amber',
    description: 'Low volume, high tokens — frontier models justified',
  },
  // legacy fallback (older task-clustering naming convention)
  classification_routing: {
    label: 'Classification & Routing',
    tone: 'blue',
    description: 'High volume, low tokens — small models appropriate',
  },
  generation_drafting: {
    label: 'Generation & Drafting',
    tone: 'green',
    description: 'Medium volume, medium tokens — mid-tier models',
  },
  analysis_reasoning: {
    label: 'Analysis & Reasoning',
    tone: 'amber',
    description: 'Low volume, high tokens — frontier models justified',
  },
}

function formatPeriodMonth(period: string): string {
  const [year, month] = period.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" })
}

interface ModelsPageProps {
  searchParams?: Promise<{ reportId?: string; provider?: string; cluster?: string }>
}

export default async function ModelsPage({ searchParams }: ModelsPageProps) {
  const params = await searchParams
  const requestedReportId = params?.reportId ?? null
  const providerFilter = params?.provider ?? 'all'
  const clusterFilter = params?.cluster ?? 'all'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase.from('companies').select('id, name')
    .eq('supabase_user_id', user!.id).single()
  const [report, availableReports] = await Promise.all([
    getPreferredReport(supabase, company!.id, requestedReportId),
    getCompanyReports(supabase, company!.id),
  ])
  const { analysisJob } = await getCompanyAnalysisState(supabase, company!.id)

  if (!report) return <AnalysisTriggerScreen companyId={company!.id} initialJobState={analysisJob} />

  const sectionAvailability = getSectionAvailability(report)
  const modelEfficiencyAvailable = sectionAvailability.model_efficiency.status === 'available'
  const modelAnalysis = report.model_efficiency_analysis
  const statAnalysis = report.stat_analysis
  const anomalyDetected = report.anomaly_detected ?? statAnalysis?.anomaly_detection?.anomaly_detected ?? false
  const mitigationStrategies = report.mitigation_strategies?.strategies
    ?? report.executive_summary?.mitigation_strategies
    ?? []

  // model_inventory is an array of NormalizedUsage objects from the usage analyst
  // Normalize behaviorCluster to 'uniform' if missing (older reports may not have this field)
  const modelInventory: {
    model: string; provider: string; totalInputTokens: number;
    totalOutputTokens: number; totalRequests: number; behaviorCluster: string
  }[] = (modelAnalysis?.model_inventory ?? []).map((item: {
    model: string; provider: string; totalInputTokens: number;
    totalOutputTokens: number; totalRequests: number; behaviorCluster?: string
  }) => ({
    ...item,
    behaviorCluster: item.behaviorCluster ?? 'uniform',
  }))

  // task_clustering comes from the stat analysis module
  const taskClusters: { model: string; task_category: string; appropriate_model_class: string }[] =
    modelAnalysis?.task_clustering?.clusters ?? []

  // Group clusters for the card display
  const clusterCounts = taskClusters.reduce((acc, c) => {
    acc[c.task_category] = (acc[c.task_category] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const anomalyIndices: number[] = statAnalysis?.anomaly_detection?.anomaly_day_indices ?? []
  const mismatchRate: number = modelAnalysis?.mismatch_rate ?? 0
  const efficiencyScore = report.model_efficiency_score ?? null
  const previousEfficiencyScore = report.prev_model_efficiency_score ?? null
  const scoreDelta = efficiencyScore != null && previousEfficiencyScore != null
    ? efficiencyScore - previousEfficiencyScore
    : null
  const totalRequests = modelInventory.reduce((sum, item) => sum + (item.totalRequests ?? 0), 0)
  const totalTokens = modelInventory.reduce((sum, item) => sum + (item.totalInputTokens ?? 0) + (item.totalOutputTokens ?? 0), 0)
  const avgTokensPerRequest = totalRequests > 0 ? totalTokens / totalRequests : null
  const providerSummary = Object.values(modelInventory.reduce((acc, item) => {
    const key = item.provider || 'Unknown'
    if (!acc[key]) {
      acc[key] = {
        provider: key,
        requests: 0,
        models: new Set<string>(),
        totalTokens: 0,
      }
    }
    acc[key].requests += item.totalRequests ?? 0
    acc[key].totalTokens += (item.totalInputTokens ?? 0) + (item.totalOutputTokens ?? 0)
    acc[key].models.add(item.model)
    return acc
  }, {} as Record<string, { provider: string; requests: number; models: Set<string>; totalTokens: number }>))
    .map((item) => ({
      provider: item.provider,
      requests: item.requests,
      totalTokens: item.totalTokens,
      modelCount: item.models.size,
      requestShare: totalRequests > 0 ? (item.requests / totalRequests) * 100 : 0,
    }))
    .sort((a, b) => b.requests - a.requests)
  const uniqueClusters = [...new Set(modelInventory.map((m) => m.behaviorCluster))]
  const topModels = [...modelInventory]
    .map((item) => ({
      ...item,
      totalTokens: (item.totalInputTokens ?? 0) + (item.totalOutputTokens ?? 0),
      avgTokensPerRequest: item.totalRequests > 0
        ? ((item.totalInputTokens ?? 0) + (item.totalOutputTokens ?? 0)) / item.totalRequests
        : 0,
    }))
    .sort((a, b) => b.totalRequests - a.totalRequests)
    .slice(0, 6)
  const filteredTopModels = [...modelInventory]
    .map((item) => ({
      ...item,
      totalTokens: (item.totalInputTokens ?? 0) + (item.totalOutputTokens ?? 0),
      avgTokensPerRequest: item.totalRequests > 0
        ? ((item.totalInputTokens ?? 0) + (item.totalOutputTokens ?? 0)) / item.totalRequests
        : 0,
    }))
    .filter((m) => providerFilter === 'all' || m.provider === providerFilter)
    .filter((m) => clusterFilter === 'all' || m.behaviorCluster === clusterFilter)
    .sort((a, b) => b.totalRequests - a.totalRequests)
    .slice(0, 6)
  const filteredModelInventory = modelInventory
    .filter((m) => providerFilter === 'all' || m.provider === providerFilter)
    .filter((m) => clusterFilter === 'all' || m.behaviorCluster === clusterFilter)
  const highestIntensityModel = [...topModels].sort((a, b) => b.avgTokensPerRequest - a.avgTokensPerRequest)[0] ?? null
  const rightSizeCandidates: {
    model: string
    taskCategory: string
    suggestedAlternative: string
  }[] = modelAnalysis?.mismatched_clusters ?? []
  const clusterSummary = Object.entries(clusterCounts)
    .map(([cluster, count]) => {
      const profile = clusterLabels[cluster] ?? { label: titleize(cluster), tone: 'slate' as const, description: 'Unclassified workload segment.' }
      return {
        cluster,
        count,
        label: profile.label,
        tone: profile.tone,
        description: profile.description,
        share: taskClusters.length > 0 ? (count / taskClusters.length) * 100 : 0,
        recommendedClass: taskClusters.find((item) => item.task_category === cluster)?.appropriate_model_class ?? 'mixed',
      }
    })
    .sort((a, b) => b.count - a.count)
  const optimizationPressure = mismatchRate > 30
    ? 'High optimization pressure'
    : mismatchRate > 15
      ? 'Moderate optimization pressure'
      : 'Model portfolio looks contained'
  const anomalySummary = anomalyIndices.length > 0
    ? `${anomalyIndices.length} anomalous day${anomalyIndices.length > 1 ? 's' : ''}`
    : 'No unusual spikes detected'

  return (
    <DashboardPage>
      <div className="space-y-5">
        <DashboardHeader
          title="Model efficiency studio"
          subtitle={`${company!.name} · ${formatPeriodMonth(report.reporting_period)}. Audit model fit, frontier dependence, and right-sizing opportunities.`}
          badge={<DashboardMetaPill>{modelInventory.length} models analyzed</DashboardMetaPill>}
          actions={<RerunAnalysisButton initialJobState={analysisJob} />}
        />

        <Suspense>
          <div className="grid gap-3 md:grid-cols-3">
            <DashboardFilterSelect
              label="Provider"
              paramKey="provider"
              value={providerFilter}
              options={[
                { label: 'All Providers', value: 'all' },
                ...providerSummary.map((p) => ({ label: p.provider, value: p.provider })),
              ]}
            />
            <DashboardFilterSelect
              label="Cluster"
              paramKey="cluster"
              value={clusterFilter}
              options={[
                { label: 'All Clusters', value: 'all' },
                ...uniqueClusters.map((c) => ({
                  label: clusterLabels[c]?.label ?? titleize(c),
                  value: c,
                })),
              ]}
            />
            <DashboardFilterSelect
              label="Period"
              paramKey="reportId"
              value={requestedReportId ?? 'all'}
              options={[
                { label: `${formatPeriodMonth(availableReports[0].reporting_period)} (Current)`, value: 'all' },
                ...availableReports.slice(1).map((r) => ({ label: formatPeriodMonth(r.reporting_period), value: r.id })),
              ]}
            />
          </div>
        </Suspense>

        {!modelEfficiencyAvailable && (
          <SectionAvailabilityNotice
            title="Model efficiency analysis unavailable"
            message={sectionAvailability.model_efficiency.message ?? 'Connect OpenAI and rerun analysis to populate this section.'}
          />
        )}

        <DashboardStatGrid>
          <DashboardStatCard
            label="Efficiency Score"
            value={efficiencyScore != null ? formatNumber(efficiencyScore, 0) : '—'}
            unit="/100 weighted score"
            helper="Overall model fit"
            icon={<Gauge className="h-4 w-4" />}
            delta={scoreDelta}
            deltaSuffix=" pts"
            statusLabel={efficiencyScore == null ? 'Unavailable' : undefined}
            statusTone={efficiencyScore != null && efficiencyScore < 60 ? 'warning' : 'good'}
          />
          <DashboardStatCard
            label="Frontier Usage"
            value={modelAnalysis?.frontier_percentage != null ? formatNumber(modelAnalysis.frontier_percentage, 0) : '—'}
            unit="% of requests"
            helper="High-capability model share"
            icon={<Bot className="h-4 w-4" />}
            statusLabel={modelAnalysis?.frontier_percentage != null && modelAnalysis.frontier_percentage > 50 ? 'High reliance' : 'Contained'}
            statusTone={modelAnalysis?.frontier_percentage != null && modelAnalysis.frontier_percentage > 50 ? 'warning' : 'good'}
          />
          <DashboardStatCard
            label="Mismatch Rate"
            value={formatNumber(mismatchRate, 0)}
            unit="% of requests"
            helper="Tasks likely over-modeled"
            icon={<AlertTriangle className="h-4 w-4" />}
            statusLabel={optimizationPressure}
            statusTone={mismatchRate > 20 ? 'warning' : 'good'}
          />
          <DashboardStatCard
            label="Anomaly Watch"
            value={anomalyIndices.length > 0 ? formatNumber(anomalyIndices.length, 0) : '0'}
            unit="flagged days"
            helper="Usage stability check"
            icon={<BarChart3 className="h-4 w-4" />}
            statusLabel={anomalySummary}
            statusTone={anomalyDetected ? 'warning' : 'good'}
          />
        </DashboardStatGrid>

        {modelInventory.length === 0 && taskClusters.length === 0 ? (
          <DashboardEmptyState
            title="No model usage data available yet"
            message="Connect an OpenAI integration and run analysis to unlock model routing, inventory, and optimization insights."
          />
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <DashboardPanel
                title="Optimization pressure map"
                subtitle="A quick read on where the portfolio is concentrated and how much headroom remains."
                badge={<DashboardBadge tone={mismatchRate > 20 ? 'amber' : 'green'}>{optimizationPressure}</DashboardBadge>}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <DashboardMiniStat
                    label="Active providers"
                    value={formatNumber(providerSummary.length, 0)}
                    hint={providerSummary.length > 0 ? providerSummary.map((item) => item.provider).join(', ') : 'No provider coverage yet'}
                  />
                  <DashboardMiniStat
                    label="Models inventoried"
                    value={formatNumber(modelInventory.length, 0)}
                    hint={highestIntensityModel ? `${highestIntensityModel.model} has the highest token intensity.` : 'Awaiting model inventory'}
                  />
                  <DashboardMiniStat
                    label="Avg tokens / request"
                    value={avgTokensPerRequest != null ? formatCompactNumber(avgTokensPerRequest, 1) : '—'}
                    hint="Input plus output tokens blended across the portfolio."
                  />
                  <DashboardMiniStat
                    label="Right-size candidates"
                    value={formatNumber(rightSizeCandidates.length, 0)}
                    hint={rightSizeCandidates.length > 0 ? 'Potential downgrade paths identified.' : 'No immediate mismatches surfaced.'}
                    tone={rightSizeCandidates.length > 0 ? 'warning' : 'good'}
                  />
                </div>

                {providerSummary.length > 0 && (
                  <>
                    <p className="mt-5 mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[#8fa098]">By provider</p>
                    <div className="space-y-3">
                      {providerSummary.slice(0, 4).map((provider) => (
                        <DashboardBarRow
                          key={provider.provider}
                          label={provider.provider}
                          value={`${formatCompactNumber(provider.requests, 1)} requests`}
                          percentage={provider.requestShare}
                          hint={`${provider.modelCount} models · ${formatCompactNumber(provider.totalTokens, 1)} tokens`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {filteredModelInventory.length > 0 && (
                  <>
                    <p className="mt-5 mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[#8fa098]">Highest-load models</p>
                    <div className="space-y-2">
                      {[...filteredModelInventory]
                        .sort((a, b) => b.totalRequests - a.totalRequests)
                        .map((model) => {
                          const avgTok = model.totalRequests > 0
                            ? ((model.totalInputTokens ?? 0) + (model.totalOutputTokens ?? 0)) / model.totalRequests
                            : 0
                          const clusterProfile = clusterLabels[model.behaviorCluster]
                          return (
                            <div key={model.model} className="rounded-2xl bg-[#fbfcfb] px-4 py-3 transition-colors hover:bg-[#f5f8f5]">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-[#1a2c24]">{model.model}</p>
                                  <p className="mt-0.5 text-xs text-[#4a5e56]">{model.provider} · {formatCompactNumber(avgTok, 1)} tok/req</p>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1.5">
                                  <span className="text-sm font-semibold text-[#152820]">{formatCompactNumber(model.totalRequests, 1)} req</span>
                                  <DashboardBadge tone={clusterProfile?.tone ?? 'slate'}>
                                    {clusterProfile?.label ?? titleize(model.behaviorCluster)}
                                  </DashboardBadge>
                                </div>
                              </div>
                              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#e4ece7]">
                                <div
                                  className="h-full rounded-full bg-[#38b76a]"
                                  style={{ width: `${totalRequests > 0 ? (model.totalRequests / totalRequests) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </>
                )}
              </DashboardPanel>

              <DashboardPanel
                title="Task cluster intelligence"
                subtitle="GreenLens classifies behavior patterns to judge whether each workload is using the right model class."
                badge={<DashboardMetaPill>{taskClusters.length > 0 ? `${taskClusters.length} classified workloads` : 'No clusters yet'}</DashboardMetaPill>}
                fillHeight
                className="h-full"
              >
                {clusterSummary.length > 0 ? (
                  <div className="space-y-3">
                    {clusterSummary.map((cluster) => (
                      <div key={cluster.cluster} className="rounded-2xl bg-[#fbfcfb] px-4 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <DashboardBadge tone={cluster.tone}>{cluster.label}</DashboardBadge>
                            <p className="mt-3 text-sm leading-6 text-[#2e4a40]">{cluster.description}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xl font-semibold text-[#152820]">{cluster.count}</p>
                            <p className="text-xs font-medium text-[#5a6e66]">{formatPercent(cluster.share, 0)} of classified models</p>
                          </div>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e4ece7]">
                          <div className="h-full rounded-full bg-[#38b76a]" style={{ width: `${Math.max(8, cluster.share)}%` }} />
                        </div>
                        <p className="mt-2 text-xs font-medium text-[#4a5e56]">
                          Recommended model class: {titleize(cluster.recommendedClass)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DashboardEmptyState
                    title="Task clustering is not available"
                    message="Cluster-level routing insight will appear once enough model usage has been classified for the reporting period."
                  />
                )}

                <div className="mt-auto pt-5 border-t border-[#f0f3f0]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#8fa098]">Right-size candidates</p>
                    <DashboardBadge tone={rightSizeCandidates.length > 0 ? 'amber' : 'green'}>
                      {rightSizeCandidates.length > 0 ? 'Review needed' : 'No urgent downgrades'}
                    </DashboardBadge>
                  </div>
                  {rightSizeCandidates.length > 0 ? (
                    <div className="space-y-2">
                      {rightSizeCandidates.slice(0, 4).map((candidate, index) => {
                        const backingModel = modelInventory.find((item) => item.model === candidate.model)
                        return (
                          <div key={`${candidate.model}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-[#fbfcfb] px-3 py-2.5">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#152820]">{candidate.model}</p>
                              <p className="text-xs text-[#5a6e66]">→ {candidate.suggestedAlternative}</p>
                            </div>
                            {backingModel && (
                              <span className="shrink-0 text-xs font-medium text-[#4a5e56]">
                                {formatCompactNumber(backingModel.totalRequests, 1)} req
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-[#5a6e66]">No immediate downgrades identified for this period.</p>
                  )}
                </div>
              </DashboardPanel>
            </div>


{mitigationStrategies.length > 0 && (
              <DashboardPanel
                title="Optimization playbook"
                subtitle="Recommended next steps to improve portfolio fit and reduce unnecessary frontier usage."
                badge={<DashboardBadge tone={(efficiencyScore ?? 100) < 60 ? 'amber' : 'green'}>{(efficiencyScore ?? 100) < 60 ? 'Action recommended' : 'Keep monitoring'}</DashboardBadge>}
              >
                <div className="space-y-3">
                  {mitigationStrategies.map((strategy: {
                    strategy: string
                    description: string
                    expectedScoreImprovement: string
                    effort: string
                    timeframe: string
                  }, index: number) => (
                    <MitigationCard key={index} {...strategy} />
                  ))}
                </div>
              </DashboardPanel>
            )}
          </>
        )}
      </div>
    </DashboardPage>
  )
}
