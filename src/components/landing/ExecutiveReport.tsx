import { BarChart3, Droplets, Zap, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Trend {
  value: string;
  direction: 'up' | 'down' | 'warning';
  tone?: 'red' | 'green' | 'amber';
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  trend?: Trend;
}

const trendClass = (trend: Trend) => {
  if (trend.tone === 'amber' || trend.direction === 'warning') return 'text-amber-600';
  if (trend.tone === 'green') return 'text-[#2d6a4f]';
  if (trend.tone === 'red') return 'text-red-500';
  return 'text-red-500';
};

const MetricCard = ({ icon, label, value, unit, trend }: MetricCardProps) => (
  <div className="bg-[#f7f7f7] rounded-md p-2.5 border border-[#e8e8e8]">
    <div className="flex items-center gap-1.5 text-[#666] mb-1.5">
      <span className="text-[#4C7060] [&>svg]:w-3 [&>svg]:h-3">{icon}</span>
      <span className="text-[10px] uppercase tracking-wide leading-tight">{label}</span>
    </div>
    <div className="flex items-baseline gap-1 mb-0.5">
      <span className="text-lg font-semibold text-[#1a1a1a] tabular-nums">{value}</span>
      <span className="text-[11px] text-[#666]">{unit}</span>
    </div>
    {trend && (
      <div className={`flex items-center gap-0.5 text-[10px] font-medium leading-tight ${trendClass(trend)}`}>
        {trend.direction === 'down' && <TrendingDown className="w-2.5 h-2.5 shrink-0" />}
        {trend.direction === 'up' && <TrendingUp className="w-2.5 h-2.5 shrink-0" />}
        {trend.direction === 'warning' && <AlertTriangle className="w-2.5 h-2.5 shrink-0" />}
        <span>{trend.value}</span>
      </div>
    )}
  </div>
);

const ExecutiveReport = () => {
  return (
    <div className="bg-white p-3 sm:p-4 text-[13px] leading-snug">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-[#e5e5e5]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded bg-[#4C7060] flex items-center justify-center shrink-0">
              <BarChart3 className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            </div>
            <span className="font-medium text-sm text-[#1a1a1a]">GreenLens AI</span>
          </div>
          <h2 className="text-sm font-semibold text-[#1a1a1a] leading-tight">Monthly AI impact briefing</h2>
          <p className="text-[11px] text-[#888] mt-0.5">Nov 2023 · Acme Corporation</p>
        </div>
        <div className="hidden sm:block text-right shrink-0">
          <p className="text-[10px] text-[#888] uppercase tracking-wide">Reporting period</p>
          <p className="text-[11px] text-[#333] font-medium whitespace-nowrap">Nov 1–30, 2023</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <MetricCard
          icon={<BarChart3 strokeWidth={1.5} />}
          label="Carbon"
          value="847"
          unit="kg CO₂e"
          trend={{ value: '↑ 12% vs prior month', direction: 'up', tone: 'red' }}
        />
        <MetricCard
          icon={<Droplets strokeWidth={1.5} />}
          label="Water"
          value="12.4K"
          unit="L"
          trend={{ value: '↑ 8% vs prior month', direction: 'up', tone: 'red' }}
        />
        <MetricCard
          icon={<Zap strokeWidth={1.5} />}
          label="Licenses"
          value="67%"
          unit="in use"
          trend={{ value: '↑ 6% vs prior month', direction: 'up', tone: 'green' }}
        />
        <MetricCard
          icon={<AlertTriangle strokeWidth={1.5} />}
          label="Cost exposure"
          value="$48K"
          unit="/ yr"
          trend={{ value: 'Renewal in 4 days', direction: 'warning' }}
        />
      </div>

      {/* Charts — single row, compact */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-3">
        <div className="sm:col-span-3 bg-[#f7f7f7] rounded-md p-2.5 border border-[#e8e8e8]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[11px] font-medium text-[#1a1a1a]">Emissions trend</p>
            <div className="flex items-center gap-2 text-[9px] text-[#666]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4C7060]" />
                This month
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ccc]" />
                Last month
              </span>
            </div>
          </div>
          <div className="h-[4.5rem] flex items-end gap-1.5">
            {[
              { current: 72, previous: 78 },
              { current: 65, previous: 70 },
              { current: 80, previous: 85 },
              { current: 58, previous: 68 }
            ].map((data, i) => (
              <div key={i} className="flex-1 flex gap-0.5 min-w-0">
                <div
                  className="flex-1 bg-[#ccc] rounded-t-sm"
                  style={{ height: `${data.previous}%` }}
                />
                <div
                  className="flex-1 bg-[#4C7060] rounded-t-sm"
                  style={{ height: `${data.current}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5 text-[9px] text-[#888]">
            <span>W1</span>
            <span>W2</span>
            <span>W3</span>
            <span>W4</span>
          </div>
        </div>

        <div className="sm:col-span-2 bg-[#f7f7f7] rounded-md p-2.5 border border-[#e8e8e8]">
          <p className="text-[11px] font-medium mb-2 text-[#1a1a1a]">By provider (CO₂e)</p>
          <div className="space-y-1.5">
            {[
              { name: 'Azure OpenAI', percentage: 45, value: '381 kg' },
              { name: 'OpenAI API', percentage: 30, value: '254 kg' },
              { name: 'M365 Copilot', percentage: 18, value: '152 kg' },
              { name: 'Other', percentage: 7, value: '60 kg' }
            ].map((provider, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-[10px] mb-0.5 gap-1">
                  <span className="text-[#333] truncate">{provider.name}</span>
                  <span className="text-[#666] tabular-nums shrink-0">{provider.value}</span>
                </div>
                <div className="w-full h-1 bg-[#e5e5e5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4C7060] rounded-full"
                    style={{ width: `${provider.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions — one compact row */}
      <div className="bg-[#f7f7f7] rounded-md p-2.5 border border-[#e8e8e8]">
        <div className="flex items-center gap-1.5 mb-2">
          <CheckCircle2 className="w-3 h-3 text-[#4C7060]" strokeWidth={1.5} />
          <p className="text-[11px] font-medium text-[#1a1a1a]">Suggested next steps</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {[
            {
              priority: 'High',
              action: 'Consolidate Azure regions',
              impact: '~18% lower emissions',
              savings: '~$1.2K/yr'
            },
            {
              priority: 'Medium',
              action: 'Right-size Copilot seats',
              impact: '~22% unused capacity',
              savings: '~$3K/yr'
            },
            {
              priority: 'Low',
              action: 'Move batch jobs off-peak',
              impact: '~15% less water use',
              savings: 'Sustainability'
            }
          ].map((rec, i) => (
            <div key={i} className="bg-white rounded border border-[#e8e8e8] p-2">
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium inline-block mb-1 ${
                rec.priority === 'High' ? 'bg-[#e8f5e9] text-[#2d6a4f]' :
                rec.priority === 'Medium' ? 'bg-amber-50 text-amber-800' :
                'bg-sky-50 text-sky-800'
              }`}>
                {rec.priority}
              </span>
              <p className="text-[10px] font-medium text-[#1a1a1a] leading-tight mb-0.5">{rec.action}</p>
              <p className="text-[9px] text-[#666] leading-tight">{rec.impact}</p>
              <p className={`text-[9px] font-medium mt-0.5 ${
                rec.savings === 'Sustainability' ? 'text-sky-800' : 'text-[#4C7060]'
              }`}>{rec.savings}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveReport;
