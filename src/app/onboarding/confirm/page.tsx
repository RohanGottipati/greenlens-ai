'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmPage() {
  const router = useRouter()
  const supabase = createClient()
  const [company, setCompany] = useState<{ name: string; industry: string; headcount_range: string } | null>(null)
  const [integrations, setIntegrations] = useState<{ provider: string; is_active: boolean }[]>([])
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: co } = await supabase.from('companies').select('id, name, industry, headcount_range')
        .eq('supabase_user_id', user.id).single()
      if (!co) return
      setCompany(co)
      const { data: ints } = await supabase.from('integrations')
        .select('provider, is_active').eq('company_id', co.id)
      setIntegrations(ints ?? [])
    }
    load()
  }, [supabase])

  const handleRun = async () => {
    setLoading(true)
    const res = await fetch('/api/pipeline/trigger', { method: 'POST' })
    if (!res.ok) { setLoading(false); return }
    const { jobId: id } = await res.json()
    setJobId(id)
    const interval = setInterval(async () => {
      const r = await fetch(`/api/pipeline/status?jobId=${id}`)
      const data = await r.json()
      if (data.status === 'complete') {
        clearInterval(interval)
        router.push('/dashboard')
      } else if (data.status === 'failed') {
        clearInterval(interval)
        setLoading(false)
        setJobId(null)
      }
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <h1 className="text-2xl font-bold text-white mb-2">Ready to run your first analysis</h1>
        <p className="text-gray-400 mb-8">Step 3 of 3</p>

        {company && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-4">
            <p className="text-gray-400 text-sm mb-2">Company</p>
            <p className="text-white font-medium">{company.name}</p>
            <p className="text-gray-400 text-sm">{company.industry?.replace(/_/g, ' ')} · {company.headcount_range} employees</p>
          </div>
        )}

        {integrations.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6">
            <p className="text-gray-400 text-sm mb-2">Connected integrations</p>
            <div className="space-y-1">
              {integrations.map(i => (
                <div key={i.provider} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  <span className="text-white text-sm capitalize">{i.provider}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {jobId && loading && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-gray-300 text-sm">Analysis running… this takes about a minute.</p>
          </div>
        )}

        <button onClick={handleRun} disabled={loading}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors">
          {loading ? 'Running analysis…' : 'Run analysis'}
        </button>
      </div>
    </div>
  )
}
