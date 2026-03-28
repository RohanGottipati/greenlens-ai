import { createClient } from '@/lib/supabase/server'
import AnalysisTriggerScreen from '@/components/dashboard/AnalysisTriggerScreen'

export default async function LicensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase.from('companies').select('id, name')
    .eq('supabase_user_id', user!.id).single()
  const { data: report } = await supabase.from('reports').select('*')
    .eq('company_id', company!.id).order('created_at', { ascending: false }).limit(1).single()

  if (!report) return <AnalysisTriggerScreen companyId={company!.id} />

  const license = report.license_intelligence

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">License Intelligence</h1>
        <p className="text-gray-400 mt-1">{company!.name} · {report.reporting_period}</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Utilization Rate</p>
          <p className="text-3xl font-bold text-white mt-1">{Math.round(report.license_utilization_rate)}%</p>
          <p className={`text-xs mt-1 ${report.license_utilization_rate > 75 ? 'text-green-400' : 'text-yellow-400'}`}>
            {report.license_utilization_rate > 75 ? 'Healthy' : 'Below target'}
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total Seats</p>
          <p className="text-3xl font-bold text-white mt-1">{license?.total_seats?.toLocaleString() ?? '—'}</p>
          <p className="text-gray-500 text-xs mt-1">Licensed</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Dormant Seats</p>
          <p className="text-3xl font-bold text-yellow-400 mt-1">{license?.dormant_seats?.toLocaleString() ?? '—'}</p>
          <p className="text-gray-500 text-xs mt-1">No activity in 30 days</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Annual Savings Potential</p>
          <p className="text-3xl font-bold text-green-400 mt-1">
            {license?.potential_savings ? `$${Math.round(license.potential_savings / 1000)}k` : '—'}
          </p>
          <p className="text-gray-500 text-xs mt-1">at renewal with right-sizing</p>
        </div>
      </div>

      {/* Renewal alerts */}
      {license?.renewal_alerts?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Upcoming Renewals</h2>
          <div className="space-y-3">
            {license.renewal_alerts.map((alert: { product: string; renewal_date: string; seats: number; annual_cost: number; recommendation: string }, i: number) => (
              <div key={i} className="bg-gray-800 border border-yellow-700 rounded-xl p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-white font-medium">{alert.product}</p>
                    <p className="text-gray-400 text-sm mt-1">{alert.recommendation}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {alert.seats} seats · ${alert.annual_cost?.toLocaleString()}/yr
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="bg-yellow-900 text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">
                      {alert.renewal_date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost analysis */}
      {license?.annual_cost && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">Cost Analysis</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Current annual spend</p>
              <p className="text-white text-lg font-semibold">${license.annual_cost?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Optimised annual spend</p>
              <p className="text-green-400 text-lg font-semibold">
                ${(license.annual_cost - (license.potential_savings ?? 0))?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
