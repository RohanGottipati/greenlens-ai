'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalysisTriggerScreen({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTrigger = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pipeline/trigger', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to start analysis')
      const { jobId: id } = await res.json()
      setJobId(id)
      pollStatus(id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setLoading(false)
    }
  }

  const pollStatus = (id: string) => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/pipeline/status?jobId=${id}`)
      const data = await res.json()
      if (data.status === 'complete') {
        clearInterval(interval)
        router.refresh()
      } else if (data.status === 'failed') {
        clearInterval(interval)
        setError(data.error_message || 'Analysis failed')
        setLoading(false)
        setJobId(null)
      }
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-green-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Ready to analyse your AI footprint</h1>
        <p className="text-gray-400 mb-8">
          GreenLens will fetch usage data from your connected integrations, calculate your carbon and
          water impact, and generate strategic recommendations. This takes about 60–90 seconds.
        </p>

        {jobId && loading && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-gray-300 text-sm">Analysis running… this takes about a minute.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950 border border-red-700 rounded-xl p-4 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleTrigger}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? 'Running analysis…' : 'Run analysis now'}
        </button>

        <p className="text-gray-600 text-xs mt-4">
          Data is sourced from admin APIs only. No individual user content is accessed.
        </p>
      </div>
    </div>
  )
}
