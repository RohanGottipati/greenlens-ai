/**
 * Demo mode — NovaTech Solutions
 *
 * When the integrations table contains these sentinel tokens, the integration
 * functions short-circuit and return this hardcoded data instead of hitting
 * real external APIs. All downstream agents (carbon math, stat analysis,
 * Backboard LLM, synthesis) run on these numbers exactly as they would on
 * real data. Real integrations with genuine tokens are completely unaffected.
 */

export const DEMO_SENTINEL_OPENAI = 'DEMO_NOVATECH_OPENAI'
export const DEMO_SENTINEL_MICROSOFT = 'DEMO_NOVATECH_MICROSOFT'

// ---------------------------------------------------------------------------
// OpenAI usage — 30-day window
// NovaTech Solutions: ~1,200-person technology company.
// Heavy gpt-4o usage (code generation, doc summarisation) drives a 62%
// frontier-model rate, which the carbon agent will flag as a mismatch
// opportunity worth optimising.
// ---------------------------------------------------------------------------

export function getFakeOpenAIUsage() {
  const normalizedUsage = [
    {
      model: 'gpt-4o-2024-08-06',
      provider: 'openai' as const,
      totalRequests: 8200,
      totalInputTokens: 4_200_000,
      totalOutputTokens: 1_600_000,
    },
    {
      model: 'gpt-4o-mini',
      provider: 'openai' as const,
      totalRequests: 7600,
      totalInputTokens: 2_800_000,
      totalOutputTokens: 900_000,
    },
    {
      model: 'gpt-3.5-turbo',
      provider: 'openai' as const,
      totalRequests: 4800,
      totalInputTokens: 1_400_000,
      totalOutputTokens: 480_000,
    },
    {
      model: 'text-embedding-ada-002',
      provider: 'openai' as const,
      totalRequests: 1400,
      totalInputTokens: 3_200_000,
      totalOutputTokens: 0,
    },
  ]

  const dailyRequestCounts = [
    778, 814,
    212, 238, 703, 739, 751, 797, 823,
    241, 264, 718, 762, 788, 830, 851,
    229, 256, 745, 808, 774, 819, 836,
    217, 243, 761, 827, 793, 848, 812,
  ]

  const today = new Date()
  const utcStartOfToday = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  ))
  const coverageEndDate = new Date(utcStartOfToday.getTime() - 24 * 60 * 60 * 1000)
  const coverageStartDate = new Date(utcStartOfToday.getTime() - 30 * 24 * 60 * 60 * 1000)

  const coverageEnd = coverageEndDate.toISOString().split('T')[0]
  const coverageStart = coverageStartDate.toISOString().split('T')[0]
  const asOf = new Date().toISOString()
  const dailyRequestSeries = dailyRequestCounts.map((requestCount, index) => {
    const date = new Date(coverageStartDate.getTime() + index * 24 * 60 * 60 * 1000)
    return {
      date: date.toISOString().split('T')[0],
      requestCount,
    }
  })

  return {
    normalizedUsage,
    dailyRequestCounts,
    dailyRequestSeries,
    coverageStart,
    coverageEnd,
    latestCompleteDay: coverageEnd,
    asOf,
  }
}

// ---------------------------------------------------------------------------
// Microsoft Copilot license data
// 500 seats licensed, 338 active (67.6% utilisation).
// Renewal in ~5 months → triggers the license agent's renewal alert.
// ---------------------------------------------------------------------------

export function getFakeMicrosoftLicenseDetails() {
  const totalSeats = 500
  const consumedSeats = 338
  return {
    totalSeats,
    consumedSeats,
    utilizationRate: Math.round((consumedSeats / totalSeats) * 100),
    licenses: [
      {
        skuPartNumber: 'MICROSOFT_365_COPILOT',
        prepaidUnits: { enabled: totalSeats },
        consumedUnits: consumedSeats,
        servicePlans: [{ servicePlanName: 'COPILOT_FOR_MICROSOFT365' }],
      },
    ],
    estimatedAnnualCost: totalSeats * 30 * 12,          // $180,000
    potentialSavingsAtRenewal: (totalSeats - consumedSeats) * 30 * 12, // $58,320
  }
}

/**
 * Returns the shape that license-intelligence.ts expects from
 * getMicrosoft365CopilotUsageUserDetail: { value: Array<{ hasCopilotActivity, ... }> }
 */
export function getFakeMicrosoftCopilotUsage() {
  const activeUsers = Array.from({ length: 338 }, (_, i) => ({
    userId: `demo-user-active-${i + 1}`,
    hasCopilotActivity: true,
    copilotLastActivityDate: new Date(
      Date.now() - Math.floor(Math.random() * 28) * 86_400_000
    ).toISOString().split('T')[0],
  }))
  const inactiveUsers = Array.from({ length: 162 }, (_, i) => ({
    userId: `demo-user-inactive-${i + 1}`,
    hasCopilotActivity: false,
    copilotLastActivityDate: null,
  }))
  return { value: [...activeUsers, ...inactiveUsers] }
}
