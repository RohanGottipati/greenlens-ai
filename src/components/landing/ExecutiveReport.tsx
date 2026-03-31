import { BarChart3, Droplets, Zap, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Trend {
  value: string;
  direction: 'up' | 'down' | 'warning';
  positive?: boolean;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  trend?: Trend;
}

const MetricCard = ({ icon, label, value, unit, trend }: MetricCardProps) => (
  <div className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-2 lg:p-2.5">
    <div className="mb-1.5 flex items-center gap-2 text-[#666]">
      {icon}
      <span className="text-xs uppercase tracking-wide">{label}</span>
    </div>
    <div className="mb-1 flex items-baseline gap-1.5">
      <span className="text-base font-medium text-[#4C7060] lg:text-lg">{value}</span>
      <span className="text-xs text-[#666] lg:text-sm">{unit}</span>
    </div>
    {trend && (
      <div className={`flex items-center gap-1 text-[11px] lg:text-xs ${
        trend.direction === 'warning' ? 'text-amber-600' :
        trend.positive ? 'text-[#4C7060]' : 'text-red-500'
      }`}>
        {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
        {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
        {trend.direction === 'warning' && <AlertTriangle className="w-3 h-3" />}
        <span>{trend.value}</span>
      </div>
    )}
  </div>
);

const ExecutiveReport = () => {
  return (
    <div className="bg-white px-2.5 py-2 lg:px-3 lg:py-2.5">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b border-[#e5e5e5] pb-2.5">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#4C7060]">
              <BarChart3 className="h-4 w-4 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-[#1a1a1a] lg:text-base">GreenLens AI</span>
          </div>
          <h2 className="text-sm font-medium text-[#1a1a1a] lg:text-base">Monthly AI Impact Briefing</h2>
          <p className="mt-1 text-xs text-[#666] lg:text-sm">November 2025 | Acme Corporation</p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="mb-1 text-xs uppercase tracking-wide text-[#888]">Report Period</p>
          <p className="text-xs text-[#333] lg:text-sm">Nov 1 - Nov 30, 2025</p>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="mb-3 grid grid-cols-2 gap-1.5 lg:grid-cols-4 lg:gap-1.5">
        <MetricCard
          icon={<BarChart3 className="w-4 h-4" strokeWidth={1.5} />}
          label="Carbon Footprint"
          value="847"
          unit="kg CO₂e"
          trend={{ value: '12% vs last month', direction: 'down', positive: true }}
        />
        <MetricCard
          icon={<Droplets className="w-4 h-4" strokeWidth={1.5} />}
          label="Water Usage"
          value="12.4K"
          unit="liters"
          trend={{ value: '8% vs last month', direction: 'up', positive: false }}
        />
        <MetricCard
          icon={<Zap className="w-4 h-4" strokeWidth={1.5} />}
          label="License Utilization"
          value="67%"
          unit="active"
          trend={{ value: '5% vs last month', direction: 'up', positive: true }}
        />
        <MetricCard
          icon={<AlertTriangle className="w-4 h-4" strokeWidth={1.5} />}
          label="Cost at Risk"
          value="$48K"
          unit="annual"
          trend={{ value: 'renewal in 47 days', direction: 'warning' }}
        />
      </div>

      {/* Charts Row */}
      <div className="mb-3 grid gap-2 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {/* Carbon Trend Chart */}
        <div className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-2.5 lg:p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-[#1a1a1a] lg:text-sm">Carbon Emissions Trend</p>
            <div className="flex items-center gap-3 text-[11px] text-[#666] lg:text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4C7060]" />
                This month
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#d4d4d4]" />
                Last month
              </span>
            </div>
          </div>
          <div className="flex h-[4rem] items-end gap-1 lg:h-[4.5rem]">
            {[
              { current: 65, previous: 70 },
              { current: 72, previous: 75 },
              { current: 58, previous: 68 },
              { current: 80, previous: 85 },
              { current: 75, previous: 90 },
              { current: 68, previous: 78 },
              { current: 82, previous: 88 },
              { current: 70, previous: 82 },
              { current: 65, previous: 75 },
              { current: 78, previous: 85 },
              { current: 72, previous: 80 },
              { current: 68, previous: 76 }
            ].map((data, i) => (
              <div key={i} className="flex-1 flex gap-0.5">
                <div
                  className="flex-1 bg-[#d4d4d4] rounded-t-sm transition-all hover:bg-[#b3b3b3]"
                  style={{ height: `${data.previous}%` }}
                />
                <div
                  className="flex-1 bg-[#4C7060] rounded-t-sm transition-all hover:bg-[#3d5a4d]"
                  style={{ height: `${data.current}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-[#888] sm:text-[11px]">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-2.5 lg:p-3">
          <p className="mb-2 text-xs font-medium text-[#1a1a1a] lg:text-sm">By Provider</p>
          <div className="space-y-2">
            {[
              { name: 'Azure OpenAI', percentage: 45, value: '381 kg' },
              { name: 'OpenAI API', percentage: 30, value: '254 kg' },
              { name: 'M365 Copilot', percentage: 18, value: '152 kg' },
              { name: 'Other', percentage: 7, value: '60 kg' }
            ].map((provider, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between text-[11px] lg:text-sm">
                  <span className="text-[#333]">{provider.name}</span>
                  <span className="text-[#666]">{provider.value}</span>
                </div>
                <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4C7060] rounded-full transition-all"
                    style={{ width: `${provider.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-2.5">
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#4C7060]" strokeWidth={1.5} />
          <p className="text-xs font-medium text-[#1a1a1a] lg:text-sm">Recommended Actions</p>
        </div>
        <div className="grid gap-1.5 md:grid-cols-3 lg:gap-2">
          {[
            {
              priority: 'High',
              action: 'Consolidate Azure regions',
              impact: 'Reduce carbon footprint by 18%',
              savings: '$12K/year'
            },
            {
              priority: 'Medium',
              action: 'Right-size Copilot licenses',
              impact: 'Recover 33% unused capacity',
              savings: '$36K/year'
            },
            {
              priority: 'Low',
              action: 'Shift batch jobs to off-peak',
              impact: 'Lower water usage by 15%',
              savings: 'Environmental'
            }
          ].map((rec, i) => (
            <div key={i} className="rounded-lg border border-[#e5e5e5] bg-white p-2">
              <div className="mb-1 flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  rec.priority === 'High' ? 'bg-[#f0f5f3] text-[#4C7060]' :
                  rec.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                  'bg-[#f5f5f5] text-[#666]'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <p className="mb-0.5 text-[11px] font-medium text-[#1a1a1a] sm:text-xs lg:text-sm">{rec.action}</p>
              <p className="mb-1 text-[10px] text-[#666] sm:text-[11px] lg:text-xs">{rec.impact}</p>
              <p className="text-xs text-[#4C7060]">{rec.savings}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveReport;
