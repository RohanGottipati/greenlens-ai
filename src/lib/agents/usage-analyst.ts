import { getOpenAIUsage } from '@/lib/integrations/openai'
import { isFrontierModel } from '@/lib/analysis/model-classification'
import {
  buildProviderStatus,
  type ProviderAnalysisStatus,
} from '@/lib/analysis/provider-status'
import { ensureFreshIntegration } from '@/lib/integrations/tokens'
import type { IntegrationRecord } from '@/lib/integrations/types'

export interface NormalizedUsage {
  model: string
  provider: string
  totalInputTokens: number
  totalOutputTokens: number
  totalRequests: number
  region?: string
  behaviorCluster: 'high_frequency_low_token' | 'low_frequency_high_token' | 'uniform'
}

export interface UsageAnalysisResult {
  normalizedUsage: NormalizedUsage[]
  dailyRequestCounts: number[]
  totalRequests: number
  totalInputTokens: number
  totalOutputTokens: number
  modelCount: number
  frontierModelPercentage: number
  dominantProvider: string
  coverageStart: string | null
  coverageEnd: string | null
  latestCompleteDay: string | null
  asOf: string | null
  providerStatus: ProviderAnalysisStatus[]
}

type RawUsageRecord = Omit<NormalizedUsage, 'behaviorCluster'>

interface UsageAnalystOptions {
  demoRunIndex?: number
}

function minDate(left: string | null, right: string | null) {
  if (!left) return right
  if (!right) return left
  return left < right ? left : right
}

function maxDate(left: string | null, right: string | null) {
  if (!left) return right
  if (!right) return left
  return left > right ? left : right
}

export async function runUsageAnalyst(
  integrations: IntegrationRecord[],
  { demoRunIndex = 1 }: UsageAnalystOptions = {}
): Promise<UsageAnalysisResult> {
  const allUsage: NormalizedUsage[] = []
  const providerStatus: ProviderAnalysisStatus[] = []
  const dailyRequestMap = new Map<string, number>()
  let coverageStart: string | null = null
  let coverageEnd: string | null = null
  let latestCompleteDay: string | null = null
  let asOf: string | null = null

  for (const integration of integrations.filter((record) => record.provider === 'openai')) {
    try {
      const freshIntegration = await ensureFreshIntegration(integration)
      const usage = await getOpenAIUsage(freshIntegration.access_token, 30, demoRunIndex)

      allUsage.push(
        ...usage.normalizedUsage.map((record: RawUsageRecord) => ({
          ...record,
          behaviorCluster: classifyBehavior(record),
        }))
      )

      for (const point of usage.dailyRequestSeries) {
        dailyRequestMap.set(point.date, (dailyRequestMap.get(point.date) ?? 0) + point.requestCount)
      }

      coverageStart = minDate(coverageStart, usage.coverageStart)
      coverageEnd = maxDate(coverageEnd, usage.coverageEnd)
      latestCompleteDay = maxDate(latestCompleteDay, usage.latestCompleteDay)
      asOf = maxDate(asOf, usage.asOf)

      providerStatus.push(
        buildProviderStatus({
          provider: integration.provider,
          status: 'fresh',
          message: `OpenAI usage data loaded through ${usage.latestCompleteDay}.`,
          coverageStart: usage.coverageStart,
          coverageEnd: usage.coverageEnd,
          latestCompleteDay: usage.latestCompleteDay,
          asOf: usage.asOf,
        })
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown OpenAI usage failure'
      throw new Error(`OpenAI usage collection failed: ${message}`)
    }
  }

  const dailyRequestCounts = [...dailyRequestMap.entries()]
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([, requestCount]) => requestCount)

  const totalRequests = allUsage.reduce((s, u) => s + u.totalRequests, 0)
  const totalInputTokens = allUsage.reduce((s, u) => s + u.totalInputTokens, 0)
  const totalOutputTokens = allUsage.reduce((s, u) => s + u.totalOutputTokens, 0)
  const frontierRequests = allUsage
    .filter((usage) => isFrontierModel(usage.model))
    .reduce((s, u) => s + u.totalRequests, 0)

  const byProvider = allUsage.reduce((acc, u) => {
    acc[u.provider] = (acc[u.provider] || 0) + u.totalRequests
    return acc
  }, {} as Record<string, number>)

  return {
    normalizedUsage: allUsage,
    dailyRequestCounts,
    totalRequests,
    totalInputTokens,
    totalOutputTokens,
    modelCount: allUsage.length,
    frontierModelPercentage: totalRequests > 0
      ? Math.round((frontierRequests / totalRequests) * 100) : 0,
    dominantProvider: Object.entries(byProvider).sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown',
    coverageStart,
    coverageEnd,
    latestCompleteDay,
    asOf,
    providerStatus,
  }
}

function classifyBehavior(usage: RawUsageRecord): NormalizedUsage['behaviorCluster'] {
  if (usage.totalRequests === 0) return 'uniform'
  const avgInput = usage.totalInputTokens / usage.totalRequests
  if (usage.totalRequests > 1000 && avgInput < 500) return 'high_frequency_low_token'
  if (avgInput > 2000 || (usage.totalOutputTokens / usage.totalRequests) > 1000) return 'low_frequency_high_token'
  return 'uniform'
}
