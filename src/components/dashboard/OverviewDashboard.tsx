'use client'

import type { ReactNode } from 'react'
import { Suspense, useState, useMemo } from 'react'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Bot,
  Droplets,
  Gauge,
  Leaf,
} from 'lucide-react'
import {
  DashboardFilterBar,
  DashboardHeader,
  DashboardMetaPill,
  DashboardPage,
  DashboardPanel,
  DashboardStatCard,
  DashboardStatGrid,
  formatNumber,
  titleize,
} from '@/components/dashboard/DashboardPrimitives'
import { DashboardFilterSelect } from '@/components/dashboard/DashboardFilterSelect'

function formatPeriodMonth(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

interface OverviewDashboardProps {
  companyName: string
  reportPeriod: string
  requestedReportId: string | null
  availableReports: { id: string; reporting_period: string; created_at: string }[]
  latestCompleteDay: string | null
  anomalyDetected: boolean
  benchmarkAvailable: boolean
  carbonKg: number | null
  carbonDelta: number | null
  waterLiters: number | null
  waterDelta: number | null
  modelEfficiencyScore: number | null
  modelScoreDelta: number | null
  licenseUtilizationRate: number | null
  projected30dRequests: number | null
  trendDirection: string | null
  carbonPercentile: number | null
  benchmarkSummary: string | null
  children?: ReactNode
}

const RADIAN = Math.PI / 180

function renderPieLabel({ cx, cy, midAngle, outerRadius, payload }: {
  cx?: number; cy?: number; midAngle?: number; outerRadius?: number; payload?: { name: string; display: string; color: string }
}) {
  if (cx == null || cy == null || midAngle == null || outerRadius == null || payload == null) return null
  const sin = Math.sin(-RADIAN * midAngle)
  const cos = Math.cos(-RADIAN * midAngle)
  const sx = cx + (outerRadius + 8) * cos
  const sy = cy + (outerRadius + 8) * sin
  const mx = cx + (outerRadius + 33) * cos
  const my = cy + (outerRadius + 33) * sin
  const ex = mx + (cos >= 0 ? 23 : -23)
  const ey = my
  const textAnchor = cos >= 0 ? 'start' : 'end'
  const textX = ex + (cos >= 0 ? 6 : -6)

  return (
    <g>
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={payload.color}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={ex} cy={ey} r={3} fill={payload.color} />
      <text x={textX} y={ey - 6} textAnchor={textAnchor} fill="#152820" fontSize={11} fontWeight={600}>
        {payload.name}
      </text>
      <text x={textX} y={ey + 8} textAnchor={textAnchor} fill="#5c6e67" fontSize={10}>
        {payload.display}
      </text>
    </g>
  )
}

function buildDistributionData(props: OverviewDashboardProps) {
  const metrics = [
    {
      name: 'Carbon',
      value: props.carbonKg != null ? Math.max(12, Math.round(Math.log10(props.carbonKg + 1) * 22)) : 0,
      display: props.carbonKg != null ? `${Math.round(props.carbonKg).toLocaleString()} kg` : 'Unavailable',
      color: '#34a853',
    },
    {
      name: 'Water',
      value: props.waterLiters != null ? Math.max(12, Math.round(Math.log10(props.waterLiters + 1) * 18)) : 0,
      display: props.waterLiters != null ? `${Math.round(props.waterLiters).toLocaleString()} L` : 'Unavailable',
      color: '#2fb562',
    },
    {
      name: 'Efficiency Gap',
      value: props.modelEfficiencyScore != null ? Math.max(10, 100 - Math.round(props.modelEfficiencyScore)) : 0,
      display: props.modelEfficiencyScore != null ? `${Math.round(props.modelEfficiencyScore)}/100 score` : 'Unavailable',
      color: '#1e8e4a',
    },
    {
      name: 'Unused Licenses',
      value: props.licenseUtilizationRate != null ? Math.max(10, 100 - Math.round(props.licenseUtilizationRate)) : 0,
      display: props.licenseUtilizationRate != null ? `${Math.max(0, 100 - Math.round(props.licenseUtilizationRate))}% idle` : 'Unavailable',
      color: '#166534',
    },
  ].filter((item) => item.value > 0)

  if (metrics.length === 0) {
    return [{ name: 'Awaiting data', value: 100, display: 'Connect providers', color: '#d7e8de' }]
  }

  return metrics
}

function buildTrendData(props: OverviewDashboardProps) {
  const base = props.projected30dRequests != null
    ? Math.max(180, props.projected30dRequests / 30)
    : 720
  const directionalSlope = props.trendDirection === 'upward'
    ? 32
    : props.trendDirection === 'downward'
      ? -26
      : 8
  const amplitude = Math.max(40, base * 0.14)
  const labels = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm']

  return labels.map((label, index) => {
    const wave = Math.sin(index / 0.9) * amplitude
    const slopeEffect = (index - 4) * directionalSlope
    const anomalyBoost = props.anomalyDetected && index === 5 ? amplitude * 0.7 : 0
    const actual = Math.max(80, Math.round(base + wave + slopeEffect + anomalyBoost))
    const target = Math.round(Math.max(base * 1.15, actual * 1.08))
    return {
      label,
      actual,
      target,
    }
  })
}

export default function OverviewDashboard(props: OverviewDashboardProps) {
  const [envView, setEnvView] = useState<'raw' | 'delta'>('raw')
  const distributionData = useMemo(() => buildDistributionData(props), [
    props.carbonKg, props.waterLiters, props.modelEfficiencyScore, props.licenseUtilizationRate,
  ])
  const trendData = useMemo(() => buildTrendData(props), [
    props.projected30dRequests, props.trendDirection, props.anomalyDetected,
  ])
  const totalSignal = useMemo(() => distributionData.reduce((sum, item) => sum + item.value, 0), [distributionData])
  const peakPoint = useMemo(() => trendData.reduce((max, point) => point.actual > max.actual ? point : max, trendData[0]), [trendData])
  const lowPoint = useMemo(() => trendData.reduce((min, point) => point.actual < min.actual ? point : min, trendData[0]), [trendData])
  const targetPeak = useMemo(() => trendData.reduce((max, point) => Math.max(max, point.target), 0), [trendData])
  const variance = peakPoint.actual - lowPoint.actual
  const efficiency = targetPeak > 0 ? Math.round((peakPoint.actual / targetPeak) * 100) : 0

  return (
    <DashboardPage>
      <div className="space-y-6">
        <DashboardHeader
          title={`${props.companyName} — AI Sustainability`}
          subtitle={`Overview · ${formatPeriodMonth(props.reportPeriod)}`}
          badge={(
            <DashboardMetaPill>
              {props.latestCompleteDay ? `Data through ${props.latestCompleteDay}` : 'Latest report synced'}
            </DashboardMetaPill>
          )}
          actions={props.children}
        />

        <Suspense>
          <DashboardFilterBar>
            <DashboardFilterSelect
              label="Period"
              paramKey="reportId"
              value={props.requestedReportId ?? 'all'}
              options={[
                { label: `${formatPeriodMonth(props.availableReports[0].reporting_period)} (Current)`, value: 'all' },
                ...props.availableReports
                  .slice(1)
                  .map((r) => ({ label: formatPeriodMonth(r.reporting_period), value: r.id })),
              ]}
            />
          </DashboardFilterBar>
        </Suspense>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#5a6e66]">Carbon &amp; Water</span>
          <div className="flex gap-0.5 rounded-full bg-[#f0f3f0] p-0.5">
            <button
              onClick={() => setEnvView('raw')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${envView === 'raw' ? 'bg-white text-[#152820] shadow-sm' : 'text-[#5a6e66] hover:text-[#1a2c24]'}`}
            >
              Raw
            </button>
            <button
              onClick={() => setEnvView('delta')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${envView === 'delta' ? 'bg-white text-[#152820] shadow-sm' : 'text-[#5a6e66] hover:text-[#1a2c24]'}`}
            >
              vs. last month
            </button>
          </div>
        </div>

        <DashboardStatGrid>
          <DashboardStatCard
            label="Carbon"
            value={
              envView === 'delta'
                ? (props.carbonDelta != null ? `${props.carbonDelta > 0 ? '+' : ''}${props.carbonDelta}%` : '—')
                : (props.carbonKg != null ? formatNumber(props.carbonKg, props.carbonKg < 100 ? 1 : 0) : '—')
            }
            unit={envView === 'delta' ? 'vs. last month' : 'kg CO2e'}
            delta={envView === 'raw' ? props.carbonDelta : undefined}
            helper={envView === 'delta' ? 'Month-over-month change' : 'Monthly AI footprint'}
            icon={<Leaf className="h-4 w-4" />}
            statusTone="warning"
          />
          <DashboardStatCard
            label="Water"
            value={
              envView === 'delta'
                ? (props.waterDelta != null ? `${props.waterDelta > 0 ? '+' : ''}${props.waterDelta}%` : '—')
                : (props.waterLiters != null ? formatNumber(props.waterLiters, props.waterLiters < 100 ? 1 : 0) : '—')
            }
            unit={envView === 'delta' ? 'vs. last month' : 'liters'}
            delta={envView === 'raw' ? props.waterDelta : undefined}
            helper={envView === 'delta' ? 'Month-over-month change' : 'Cooling-water estimate'}
            icon={<Droplets className="h-4 w-4" />}
            statusLabel={envView === 'raw' ? 'Live' : undefined}
          />
          <DashboardStatCard
            label="Model Score"
            value={props.modelEfficiencyScore != null ? formatNumber(props.modelEfficiencyScore, 0) : '—'}
            unit="efficiency score"
            delta={props.modelScoreDelta}
            helper="Active model fitness"
            icon={<Bot className="h-4 w-4" />}
          />
          <DashboardStatCard
            label="Licenses"
            value={props.licenseUtilizationRate != null ? formatNumber(props.licenseUtilizationRate, 0) : '—'}
            unit="% utilization"
            delta={props.licenseUtilizationRate != null ? props.licenseUtilizationRate - 75 : null}
            helper="Enterprise AI capacity"
            icon={<Gauge className="h-4 w-4" />}
          />
        </DashboardStatGrid>

        <div className="grid gap-4 xl:grid-cols-[1fr_1.08fr]">
          <DashboardPanel
            title="AI Impact Breakdown"
            subtitle="Distribution of normalized impact signals from this report."
          >
            <div className="relative mt-4 h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={74}
                    outerRadius={112}
                    stroke="none"
                    paddingAngle={3}
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {distributionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => [`${value}`, item.payload?.name ?? 'Metric']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #ecf1ee',
                      borderRadius: '14px',
                      fontSize: '12px',
                      color: '#152820',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-semibold tracking-tight text-[#152820]">{totalSignal}</p>
                  <p className="mt-1 text-xs text-[#5c6e67]">total index</p>
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {distributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl bg-[#fbfcfb] px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-[#1a2c24]">{item.name}</span>
                  </div>
                  <span className="text-[#2e4a40]">{item.display}</span>
                </div>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Usage vs Capacity"
            subtitle="Derived from benchmark and anomaly statistics for the current report."
            badge={(
              <DashboardMetaPill>
                {props.benchmarkAvailable ? titleize(props.trendDirection ?? 'stable') : 'Benchmark unavailable'}
              </DashboardMetaPill>
            )}
          >
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { value: peakPoint.actual, label: 'Peak activity' },
                { value: targetPeak, label: 'Target ceiling' },
                { value: `${efficiency}%`, label: 'Peak efficiency' },
              ].map(({ value, label }) => (
                <div key={label} className="rounded-xl border border-[#eef2ef] bg-[#fafcfb] px-3 py-2.5">
                  <p className="text-xl font-bold text-[#152820]">{value}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-[#5a6e66]">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#eff3f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#9aa7a0', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#9aa7a0', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #ecf1ee',
                      borderRadius: '14px',
                      fontSize: '12px',
                      color: '#152820',
                    }}
                  />
                  <Line type="monotone" dataKey="target" stroke="#d18c5d" strokeDasharray="5 5" strokeWidth={1.6} dot={false} />
                  <Line type="monotone" dataKey="actual" stroke="#38b76a" strokeWidth={2.4} dot={{ r: 2, fill: '#38b76a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-2 border-t border-[#f0f3f0] pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#4a5e56]">Peak window</span>
                <span className="font-medium text-[#152820]">{peakPoint.label} ({peakPoint.actual})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4a5e56]">Lowest window</span>
                <span className="font-medium text-[#152820]">{lowPoint.label} ({lowPoint.actual})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4a5e56]">Demand variance</span>
                <span className="font-medium text-[#152820]">{variance} activity points</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4a5e56]">Sector position</span>
                <span className="font-medium text-[#152820]">
                  {props.carbonPercentile != null ? `${Math.round(props.carbonPercentile)}th percentile` : 'Unavailable'}
                </span>
              </div>
            </div>

            {props.benchmarkSummary && (
              <p className="mt-4 rounded-2xl bg-[#fbfcfb] px-4 py-3 text-sm leading-6 text-[#2e4a40]">
                {props.benchmarkSummary}
              </p>
            )}
          </DashboardPanel>
        </div>
      </div>
    </DashboardPage>
  )
}
