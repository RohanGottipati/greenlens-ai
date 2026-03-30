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
  <div className="bg-[#fafafa] rounded-lg p-4 border border-[#e5e5e5]">
    <div className="flex items-center gap-2 text-[#666] mb-3">
      {icon}
      <span className="text-xs uppercase tracking-wide">{label}</span>
    </div>
    <div className="flex items-baseline gap-2 mb-1">
      <span className="text-2xl lg:text-3xl font-medium text-[#4C7060]">{value}</span>
      <span className="text-sm text-[#666]">{unit}</span>
    </div>
    {trend && (
      <div className={`flex items-center gap-1 text-xs ${
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
    <div className="bg-white p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#e5e5e5]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-[#4C7060] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="font-medium text-lg text-[#1a1a1a]">GreenLens AI</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-medium text-[#1a1a1a]">Monthly AI Impact Briefing</h2>
          <p className="text-[#666] text-sm mt-1">November 2025 | Acme Corporation</p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-[#888] text-xs uppercase tracking-wide mb-1">Report Period</p>
          <p className="text-sm text-[#333]">Nov 1 - Nov 30, 2025</p>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Carbon Trend Chart */}
        <div className="lg:col-span-2 bg-[#fafafa] rounded-lg p-5 border border-[#e5e5e5]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#1a1a1a]">Carbon Emissions Trend</p>
            <div className="flex items-center gap-4 text-xs text-[#666]">
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
          <div className="h-32 flex items-end gap-2">
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
          <div className="flex justify-between mt-2 text-xs text-[#888]">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="bg-[#fafafa] rounded-lg p-5 border border-[#e5e5e5]">
          <p className="text-sm font-medium mb-4 text-[#1a1a1a]">By Provider</p>
          <div className="space-y-4">
            {[
              { name: 'Azure OpenAI', percentage: 45, value: '381 kg' },
              { name: 'OpenAI API', percentage: 30, value: '254 kg' },
              { name: 'M365 Copilot', percentage: 18, value: '152 kg' },
              { name: 'Other', percentage: 7, value: '60 kg' }
            ].map((provider, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1.5">
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
      <div className="bg-[#fafafa] rounded-lg p-5 border border-[#e5e5e5]">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-[#4C7060]" strokeWidth={1.5} />
          <p className="text-sm font-medium text-[#1a1a1a]">Recommended Actions</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
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
            <div key={i} className="bg-white rounded-lg p-4 border border-[#e5e5e5]">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  rec.priority === 'High' ? 'bg-[#f0f5f3] text-[#4C7060]' :
                  rec.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                  'bg-[#f5f5f5] text-[#666]'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm font-medium mb-1 text-[#1a1a1a]">{rec.action}</p>
              <p className="text-xs text-[#666] mb-2">{rec.impact}</p>
              <p className="text-xs text-[#4C7060]">{rec.savings}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveReport;
