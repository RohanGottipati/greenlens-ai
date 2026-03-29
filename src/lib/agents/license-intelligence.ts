import { getMicrosoftLicenseDetails, getMicrosoftCopilotUsage } from '@/lib/integrations/microsoft'
import {
  buildAvailableSection,
  buildProviderStatus,
  buildUnavailableSection,
  buildUnsupportedProviderStatus,
  supportsProviderCapability,
  type SectionAvailability,
  type ProviderAnalysisStatus,
} from '@/lib/analysis/provider-status'
import { ensureFreshIntegration } from '@/lib/integrations/tokens'
import type { IntegrationRecord } from '@/lib/integrations/types'

interface LicenseProviderSummary {
  provider: string
  totalSeats: number
  activeSeats: number
  dormantSeats: number
  utilizationRate: number
  estimatedAnnualCost: number
  potentialSavingsAtRenewal: number
  recommendation: string
}

interface RenewalAlert {
  provider: string
  monthsToRenewal: number
  renewalDate: string
  actionRequired: string
}

interface MicrosoftCopilotUsageUser {
  hasCopilotActivity?: boolean
  copilotLastActivityDate?: string | null
  reportRefreshDate?: string
}

interface MicrosoftCopilotUsageResponse {
  value?: MicrosoftCopilotUsageUser[]
}

export interface LicenseIntelligenceResult {
  providers: LicenseProviderSummary[]
  totalLicensedSeats: number
  totalActiveSeats: number
  totalDormantSeats: number
  overallUtilizationRate: number
  estimatedAnnualLicenseCost: number
  potentialAnnualSavings: number
  renewalAlerts: RenewalAlert[]
  providerStatus: ProviderAnalysisStatus[]
  availability: SectionAvailability
}

function buildUnsupportedLicenseMessage(provider: string) {
  if (provider === 'openai') {
    return 'OpenAI is connected for usage analysis, but does not provide license-seat analysis.'
  }

  if (provider === 'google') {
    return 'Google Workspace is connected, but automated license analysis is not implemented in this build.'
  }

  return `${provider} is connected, but automated license analysis is not implemented in this build.`
}

function buildLicenseUnavailableMessage(integrations: IntegrationRecord[]) {
  if (integrations.length === 0) {
    return 'Connect Microsoft 365 to unlock license utilization reporting.'
  }

  const connectedProviders = integrations.map((integration) => integration.provider)
  const providerList = connectedProviders.join(', ')

  return `Connected providers (${providerList}) do not currently expose supported license analysis in this build. Connect Microsoft 365 to unlock license utilization reporting.`
}

export async function runLicenseIntelligence(integrations: IntegrationRecord[]): Promise<LicenseIntelligenceResult> {
  const licenseIntegrations = integrations.filter((record) =>
    supportsProviderCapability(record.provider, 'license')
  )
  const results: LicenseIntelligenceResult = {
    providers: [],
    totalLicensedSeats: 0,
    totalActiveSeats: 0,
    totalDormantSeats: 0,
    overallUtilizationRate: 0,
    estimatedAnnualLicenseCost: 0,
    potentialAnnualSavings: 0,
    renewalAlerts: [],
    providerStatus: [],
    availability: buildUnavailableSection(buildLicenseUnavailableMessage(integrations)),
  }

  for (const integration of integrations) {
    if (!supportsProviderCapability(integration.provider, 'license')) {
      results.providerStatus.push(
        buildUnsupportedProviderStatus(
          integration.provider,
          'license',
          buildUnsupportedLicenseMessage(integration.provider)
        )
      )
    }
  }

  for (const integration of licenseIntegrations) {
    try {
      const freshIntegration = await ensureFreshIntegration(integration)
      const licenseData = await getMicrosoftLicenseDetails(freshIntegration.access_token)
      const copilotUsage = await getMicrosoftCopilotUsage(
        freshIntegration.access_token
      ) as MicrosoftCopilotUsageResponse

      let activeSeats = 0
      if (copilotUsage.value) {
        activeSeats = copilotUsage.value.filter(
          (user) => user.hasCopilotActivity || Boolean(user.copilotLastActivityDate)
        ).length
      }

      const dormantSeats = Math.max(licenseData.totalSeats - activeSeats, 0)
      const utilizationRate = licenseData.totalSeats > 0
        ? Math.round((activeSeats / licenseData.totalSeats) * 100) : 0

      results.providers.push({
        provider: 'Microsoft Copilot',
        totalSeats: licenseData.totalSeats,
        activeSeats,
        dormantSeats,
        utilizationRate,
        estimatedAnnualCost: licenseData.estimatedAnnualCost,
        potentialSavingsAtRenewal: dormantSeats * 30 * 12,
        recommendation: dormantSeats > 20
          ? `Right-size from ${licenseData.totalSeats} to ${activeSeats + 10} seats at renewal. ` +
            `Estimated saving: $${((dormantSeats - 10) * 30 * 12).toLocaleString()}/year.`
          : `Utilization healthy at ${utilizationRate}%. Monitor at next renewal.`
      })

      results.totalLicensedSeats += licenseData.totalSeats
      results.totalActiveSeats += activeSeats
      results.totalDormantSeats += dormantSeats
      results.estimatedAnnualLicenseCost += licenseData.estimatedAnnualCost
      results.potentialAnnualSavings += dormantSeats * 30 * 12

      const reportRefreshDate = copilotUsage.value?.[0]?.reportRefreshDate ?? null
      results.providerStatus.push(
        buildProviderStatus({
          provider: integration.provider,
          capability: 'license',
          status: 'fresh',
          message: reportRefreshDate
            ? `Microsoft Copilot activity refreshed on ${reportRefreshDate}.`
            : 'Microsoft Copilot activity loaded successfully.',
          asOf: reportRefreshDate ?? new Date().toISOString(),
        })
      )

      const renewalDate = integration.metadata?.renewal_date
      if (renewalDate) {
        const monthsToRenewal = Math.round(
          (new Date(renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
        )
        if (monthsToRenewal <= 6) {
          results.renewalAlerts.push({
            provider: 'Microsoft',
            monthsToRenewal,
            renewalDate,
            actionRequired: `Right-sizing decision needed ${monthsToRenewal} months before renewal`
          })
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown license intelligence failure'
      throw new Error(`Microsoft license analysis failed: ${message}`)
    }
  }

  if (licenseIntegrations.length === 0) {
    return results
  }

  results.overallUtilizationRate = results.totalLicensedSeats > 0
    ? Math.round((results.totalActiveSeats / results.totalLicensedSeats) * 100) : 0
  results.availability = buildAvailableSection(
    results.totalLicensedSeats > 0
      ? 'Supported license data loaded successfully.'
      : 'Supported license data loaded successfully with no licensed seats found.'
  )

  return results
}
