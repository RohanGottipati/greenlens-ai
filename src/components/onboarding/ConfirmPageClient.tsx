'use client'

import { useRouter } from 'next/navigation'
import { useAnalysisJob } from '@/lib/analysis/use-analysis-job'
import type { AnalysisJobState } from '@/lib/analysis/state'

interface ConfirmPageClientProps {
  company: {
    name: string
    industry: string | null
    headcount_range: string | null
  }
  integrations: { provider: string; is_active: boolean }[]
  initialJobState: AnalysisJobState | null
}

export default function ConfirmPageClient({
  company,
  integrations,
  initialJobState,
}: ConfirmPageClientProps) {
  const router = useRouter()
  const { error, jobState, loading, statusMessage, triggerAnalysis } = useAnalysisJob({
    initialJobState,
    onComplete: (nextState) => {
      if (!nextState.reportId) {
        router.push('/dashboard')
        return
      }
      router.push(`/dashboard?reportId=${encodeURIComponent(nextState.reportId)}`)
    },
  })

  const isFailed = !loading && jobState?.status === 'failed'
  const buttonLabel = loading ? 'Running analysis…' : isFailed ? 'Retry analysis' : 'Run analysis'

  return (
    <div className="hero-nature-bg min-h-screen flex flex-col">
      {/* Glass header */}
      <div className="glass-header px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(76,112,96,0.9)' }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-white font-medium text-sm tracking-tight">GreenLens AI</span>
        </div>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Step 3 of 3</span>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className="max-w-lg w-full rounded-2xl p-8 fade-in-up"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div className="mb-6">
            <h1 className="text-2xl font-medium text-white tracking-tight">Run your first analysis</h1>
            <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              GreenLens will measure your AI carbon and water footprint across all connected providers.
            </p>
          </div>

          {/* Company summary */}
          <div
            className="rounded-xl p-4 mb-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Company</p>
            <p className="text-white font-medium text-sm">{company.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {company.industry?.replace(/_/g, ' ') ?? 'Industry not set'}
              {company.headcount_range ? ` · ${company.headcount_range} employees` : ''}
            </p>
          </div>

          {/* Connected integrations */}
          {integrations.length > 0 && (
            <div
              className="rounded-xl p-4 mb-6"
              style={{ background: 'rgba(76,112,96,0.15)', border: '1px solid rgba(76,112,96,0.3)' }}
            >
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Connected integrations
              </p>
              <div className="space-y-2">
                {integrations.map((integration) => (
                  <div key={integration.provider} className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 shrink-0" style={{ color: 'rgba(134,198,167,1)' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm capitalize" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {integration.provider}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis running */}
          {loading && (
            <div
              className="rounded-xl p-4 mb-6 flex items-start gap-3"
              style={{ background: 'rgba(76,112,96,0.15)', border: '1px solid rgba(76,112,96,0.3)' }}
            >
              <div
                className="w-4 h-4 mt-0.5 border-2 border-t-transparent rounded-full animate-spin shrink-0"
                style={{ borderColor: 'rgba(134,198,167,0.8)', borderTopColor: 'transparent' }}
              />
              <div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Analysis running — this takes about a minute.
                </p>
                {statusMessage && (
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{statusMessage}</p>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="rounded-xl px-4 py-3 mb-6"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Failed (no separate error message) */}
          {isFailed && !error && (
            <div
              className="rounded-xl px-4 py-3 mb-6"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                The last analysis attempt did not finish. You can retry now.
              </p>
            </div>
          )}

          <button
            onClick={triggerAnalysis}
            disabled={loading}
            className="btn-primary w-full py-3 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
