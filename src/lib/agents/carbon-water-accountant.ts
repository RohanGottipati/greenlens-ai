import { calculateCarbon } from '@/lib/calculations/carbon'
import { calculateWater } from '@/lib/calculations/water'
import {
  isFrontierModel,
  suggestSmallerModel,
} from '@/lib/analysis/model-classification'
import type { StatAnalysisResult, TaskCluster } from '@/lib/analysis/run-stat-analysis'
import type { NormalizedUsage } from './usage-analyst'

type CarbonCalculationResult = Awaited<ReturnType<typeof calculateCarbon>>

export async function runCarbonWaterAccountant(
  usageResult: { normalizedUsage: NormalizedUsage[], frontierModelPercentage: number },
  statResult: StatAnalysisResult | { error: string },
  precomputedCarbon?: CarbonCalculationResult
) {
  const carbon = precomputedCarbon ?? await calculateCarbon(usageResult.normalizedUsage)
  const primaryRegion = usageResult.normalizedUsage[0]?.region?.includes('eu')
    ? 'europe' : usageResult.normalizedUsage[0]?.region?.includes('west') ? 'us-west' : 'us-east'
  const water = calculateWater(carbon, primaryRegion)

  // Use NLP task clustering from stat analysis to identify mismatches
  // more accurately than threshold rules alone
  const taskClusters: TaskCluster[] =
    'task_clustering' in statResult ? statResult.task_clustering.clusters ?? [] : []
  const mismatchedClusters = taskClusters.filter((cluster) =>
    cluster.task_category === 'classification_routing' &&
    isFrontierModel(cluster.model)
  )

  const mismatchedRequests = usageResult.normalizedUsage
    .filter((usage) => mismatchedClusters.some((cluster) => cluster.model === usage.model))
    .reduce((s, u) => s + u.totalRequests, 0)
  const totalRequests = usageResult.normalizedUsage.reduce((s, u) => s + u.totalRequests, 0)

  return {
    totalCarbonKg: carbon.totalCarbonKg,
    carbonByModel: carbon.byModel,
    alternativeCarbonKg: carbon.alternativeCarbonKg,
    carbonSavingsKg: carbon.savingsKg,
    carbonSavingsPercentage: carbon.savingsPercentage,
    carbonMethodology: carbon.methodology,
    totalWaterLiters: water.totalWaterLiters,
    totalWaterBottles: water.totalWaterBottles,
    alternativeWaterLiters: water.alternativeWaterLiters,
    waterSavingsLiters: water.savingsLiters,
    waterMethodology: water.methodology,
    modelEfficiencyScore: carbon.modelEfficiencyScore,
    modelTaskMismatchRate: totalRequests > 0
      ? Math.round((mismatchedRequests / totalRequests) * 100) : 0,
    mismatchedModelClusters: mismatchedClusters.map((cluster) => ({
      model: cluster.model,
      taskCategory: cluster.task_category,
      suggestedAlternative: suggestSmallerModel(cluster.model)
    }))
  }
}
