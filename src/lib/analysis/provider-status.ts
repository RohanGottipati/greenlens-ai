export type ProviderAnalysisStatusKind = 'fresh' | 'failed' | 'unsupported'

export interface ProviderAnalysisStatus {
  provider: string
  status: ProviderAnalysisStatusKind
  message: string | null
  coverageStart: string | null
  coverageEnd: string | null
  latestCompleteDay: string | null
  asOf: string | null
}

export interface DataFreshness {
  coverageStart: string | null
  coverageEnd: string | null
  latestCompleteDay: string | null
  asOf: string | null
}

interface BuildProviderStatusOptions {
  provider: string
  status: ProviderAnalysisStatusKind
  message?: string | null
  coverageStart?: string | null
  coverageEnd?: string | null
  latestCompleteDay?: string | null
  asOf?: string | null
}

function minIso(left: string | null, right: string | null) {
  if (!left) return right
  if (!right) return left
  return left < right ? left : right
}

function maxIso(left: string | null, right: string | null) {
  if (!left) return right
  if (!right) return left
  return left > right ? left : right
}

export function buildProviderStatus({
  provider,
  status,
  message = null,
  coverageStart = null,
  coverageEnd = null,
  latestCompleteDay = coverageEnd,
  asOf = null,
}: BuildProviderStatusOptions): ProviderAnalysisStatus {
  return {
    provider,
    status,
    message,
    coverageStart,
    coverageEnd,
    latestCompleteDay,
    asOf,
  }
}

export function deriveDataFreshness(statuses: ProviderAnalysisStatus[]): DataFreshness {
  const freshStatuses = statuses.filter((status) => status.status === 'fresh')

  return freshStatuses.reduce<DataFreshness>(
    (accumulator, status) => ({
      coverageStart: minIso(accumulator.coverageStart, status.coverageStart),
      coverageEnd: maxIso(accumulator.coverageEnd, status.coverageEnd),
      latestCompleteDay: maxIso(accumulator.latestCompleteDay, status.latestCompleteDay),
      asOf: maxIso(accumulator.asOf, status.asOf),
    }),
    {
      coverageStart: null,
      coverageEnd: null,
      latestCompleteDay: null,
      asOf: null,
    }
  )
}

export function buildUnsupportedProviderStatus(provider: string, message: string) {
  return buildProviderStatus({
    provider,
    status: 'unsupported',
    message,
    asOf: new Date().toISOString(),
  })
}
