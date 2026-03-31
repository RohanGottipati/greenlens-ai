import Image from 'next/image';
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

// Weekly carbon data — current vs prior month (as % of chart height)
const weekBars = [
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
  { current: 68, previous: 76 },
];

const providers = [
  { name: 'Azure OpenAI', percentage: 45, value: '381 kg', delta: '↓3%', deltaPositive: true },
  { name: 'OpenAI API',   percentage: 30, value: '254 kg', delta: '↑2%', deltaPositive: false },
  { name: 'M365 Copilot', percentage: 18, value: '152 kg', delta: '↓1%', deltaPositive: true },
  { name: 'Other',         percentage:  7, value: ' 60 kg', delta:  '—',  deltaPositive: true },
];

// ── Methodology SVG bar chart ────────────────────────────────────────────────
// Three pipeline stages: Tokens → Energy → CO₂e
// Bars are proportional to relative scale (normalised to tallest).
const methStages = [
  { label: 'Tokens In',  value: '4.2B',   unit: 'tokens',    normH: 100, fill: '#bdd9c7' },
  { label: 'Energy',     value: '2,118',  unit: 'kWh',       normH:  62, fill: '#7aad94' },
  { label: 'CO₂e Out',   value: '847',    unit: 'kg CO₂e',   normH:  38, fill: '#4C7060' },
];

const MethodologyChart = () => {
  // SVG coordinate space
  const W = 300;
  const chartH = 80; // height of the bar area
  const barW = 56;
  const gap = (W - methStages.length * barW) / (methStages.length + 1);

  const bx = (i: number) => gap + i * (barW + gap);       // bar left-x
  const by = (normH: number) => chartH - (normH / 100) * chartH; // bar top-y
  const mx = (i: number) => bx(i) + barW / 2;             // bar mid-x

  return (
    <svg
      viewBox={`0 0 ${W} ${chartH + 32}`}
      width="100%"
      aria-label="Carbon calculation pipeline chart"
    >
      {/* Horizontal gridlines */}
      {[0, 0.5, 1].map((f) => (
        <line
          key={f}
          x1={0} x2={W}
          y1={chartH - f * chartH} y2={chartH - f * chartH}
          stroke="#e5e5e5" strokeWidth={1}
          strokeDasharray={f === 0 ? undefined : '3 3'}
        />
      ))}

      {/* Bars */}
      {methStages.map((s, i) => (
        <rect
          key={i}
          x={bx(i)} y={by(s.normH)}
          width={barW} height={(s.normH / 100) * chartH}
          rx={3} fill={s.fill}
        />
      ))}

      {/* Dashed flow lines connecting bar tops */}
      {methStages.slice(0, -1).map((s, i) => (
        <line
          key={`fl-${i}`}
          x1={bx(i) + barW} y1={by(s.normH) + 2}
          x2={bx(i + 1)}    y2={by(methStages[i + 1].normH) + 2}
          stroke="#4C7060" strokeWidth={1.2}
          strokeDasharray="4 3" strokeOpacity={0.55}
        />
      ))}

      {/* Arrow tips */}
      {methStages.slice(0, -1).map((_, i) => {
        const ax = bx(i + 1);
        const ay = by(methStages[i + 1].normH) + 2;
        return (
          <polygon
            key={`ar-${i}`}
            points={`${ax},${ay - 3} ${ax + 5},${ay} ${ax},${ay + 3}`}
            fill="#4C7060" fillOpacity={0.55}
          />
        );
      })}

      {/* Value labels above bars */}
      {methStages.map((s, i) => (
        <g key={`vl-${i}`}>
          <text
            x={mx(i)} y={by(s.normH) - 10}
            textAnchor="middle" fontSize={9} fontWeight={700} fill="#1a1a1a"
          >
            {s.value}
          </text>
          <text
            x={mx(i)} y={by(s.normH) - 2}
            textAnchor="middle" fontSize={7.5} fill="#666"
          >
            {s.unit}
          </text>
        </g>
      ))}

      {/* Stage labels below baseline */}
      {methStages.map((s, i) => (
        <text
          key={`sl-${i}`}
          x={mx(i)} y={chartH + 14}
          textAnchor="middle" fontSize={8} fill="#555" fontWeight={600}
        >
          {s.label}
        </text>
      ))}
    </svg>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const ExecutiveReport = () => {
  const n = weekBars.length;

  // Build SVG polyline points for the trend-line overlay.
  // Viewbox is 0–100 × 0–100. Each bar group is 1/n wide;
  // the "current" bar sits in the right half of its group.
  const trendPoints = weekBars
    .map((d, i) => `${((i + 0.75) / n) * 100},${100 - d.current}`)
    .join(' ');

  return (
    <div className="bg-white px-2.5 py-2 lg:px-3 lg:py-2.5">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-3 border-b border-[#e5e5e5] pb-2.5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-6 w-6 shrink-0 rounded-full bg-[#7bdc93] overflow-hidden shadow-sm">
              <Image src="/greenlens-logo.png" alt="GreenLens AI" fill className="object-cover" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-[#1a1a1a] lg:text-base">GreenLens AI</span>
              <span className="text-[11px] text-[#888]">Monthly AI Briefing — Nov 2025 · Acme Corp</span>
            </div>
          </div>
        </div>

        {/* KPI pill row — single-glance consulting summary */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: '847 kg CO₂e',    cls: 'bg-[#f0f5f3] text-[#4C7060] border-[#c8ddd5]' },
            { label: '↓ 12% MoM',      cls: 'bg-[#f0f5f3] text-[#4C7060] border-[#c8ddd5]' },
            { label: 'Azure 45% share', cls: 'bg-[#f5f5f5] text-[#555]    border-[#e5e5e5]' },
            { label: '$48K at risk',    cls: 'bg-amber-50  text-amber-700  border-amber-200' },
            { label: '67% utilization', cls: 'bg-[#f5f5f5] text-[#555]    border-[#e5e5e5]' },
          ].map((p) => (
            <span key={p.label}
              className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium ${p.cls}`}>
              {p.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Key Metrics ────────────────────────────────────────── */}
      <div className="mb-3 grid grid-cols-2 gap-1.5 lg:grid-cols-4">
        <MetricCard icon={<BarChart3 className="w-4 h-4" strokeWidth={1.5} />}
          label="Carbon Footprint" value="847" unit="kg CO₂e"
          trend={{ value: '12% vs last month', direction: 'down', positive: true }} />
        <MetricCard icon={<Droplets className="w-4 h-4" strokeWidth={1.5} />}
          label="Water Usage" value="12.4K" unit="liters"
          trend={{ value: '8% vs last month', direction: 'up', positive: false }} />
        <MetricCard icon={<Zap className="w-4 h-4" strokeWidth={1.5} />}
          label="License Utilization" value="67%" unit="active"
          trend={{ value: '5% vs last month', direction: 'up', positive: true }} />
        <MetricCard icon={<AlertTriangle className="w-4 h-4" strokeWidth={1.5} />}
          label="Cost at Risk" value="$48K" unit="annual"
          trend={{ value: 'renewal in 47 days', direction: 'warning' }} />
      </div>

      {/* ── Charts Row ─────────────────────────────────────────── */}
      <div className="mb-3 grid gap-2 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">

        {/* Carbon Trend — bars + line overlay */}
        <div className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-2.5 lg:p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-[#1a1a1a] lg:text-sm">Carbon Emissions Trend</p>
            <div className="flex items-center gap-2.5 text-[11px] text-[#666]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#4C7060]" />This month
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#d4d4d4]" />Last month
              </span>
              <span className="flex items-center gap-1">
                <svg width="14" height="6" className="inline"><line x1="0" y1="3" x2="14" y2="3" stroke="#4C7060" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                Trend
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Y-axis ticks */}
            <div className="flex flex-col justify-between text-right text-[9px] text-[#aaa] pr-1 shrink-0" style={{ height: '5rem' }}>
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>

            {/* Bar area + overlay */}
            <div className="relative flex-1" style={{ height: '5rem' }}>
              {/* Dashed target line at 80% */}
              <div className="absolute inset-x-0 border-t border-dashed border-amber-400 z-10 pointer-events-none"
                style={{ bottom: '80%' }} />

              {/* Bar columns */}
              <div className="flex h-full items-end gap-0.5">
                {weekBars.map((d, i) => (
                  <div key={i} className="flex-1 flex gap-px items-end h-full">
                    <div className="flex-1 bg-[#d4d4d4] rounded-t-sm transition-all" style={{ height: `${d.previous}%` }} />
                    <div className="flex-1 bg-[#4C7060] rounded-t-sm transition-all" style={{ height: `${d.current}%` }} />
                  </div>
                ))}
              </div>

              {/* Trend polyline SVG overlay */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                <polyline points={trendPoints} fill="none"
                  stroke="#4C7060" strokeWidth="1.8"
                  strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                {weekBars.map((d, i) => (
                  <circle key={i}
                    cx={((i + 0.75) / n) * 100} cy={100 - d.current}
                    r="1.6" fill="#4C7060" vectorEffect="non-scaling-stroke" />
                ))}
              </svg>
            </div>
          </div>

          <div className="mt-1 flex justify-around pl-8 text-[10px] text-[#888]">
            {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((w) => <span key={w}>{w}</span>)}
          </div>
          <div className="mt-0.5 flex items-center gap-1 pl-8 text-[9px] text-amber-600">
            <span className="w-3 border-t border-dashed border-amber-400 inline-block" />
            <span>80 kg/wk target</span>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-2.5 lg:p-3">
          <p className="mb-2 text-xs font-medium text-[#1a1a1a] lg:text-sm">By Provider</p>
          <div className="space-y-2">
            {providers.map((p, i) => (
              <div key={i}>
                <div className="mb-0.5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1">
                    <span className="text-[#333]">{p.name}</span>
                    <span className="bg-[#f0f5f3] text-[#4C7060] text-[10px] px-1 rounded font-medium">{p.percentage}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-medium ${p.deltaPositive ? 'text-[#4C7060]' : 'text-red-500'}`}>{p.delta}</span>
                    <span className="text-[#666]">{p.value}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-[#e5e5e5] rounded-full overflow-hidden">
                  <div className="h-full bg-[#4C7060] rounded-full transition-all" style={{ width: `${p.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-[#e5e5e5] pt-1.5 text-[11px]">
            <span className="text-[#666]">Total</span>
            <span className="font-semibold text-[#1a1a1a]">847 kg CO₂e</span>
          </div>
        </div>
      </div>

      {/* ── Methodology Graph ──────────────────────────────────── */}
      <div className="mb-3 rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-2.5 lg:p-3">
        <p className="mb-1.5 text-xs font-medium text-[#1a1a1a] lg:text-sm">Carbon Calculation Pipeline</p>
        <MethodologyChart />
        <p className="mt-1 border-t border-[#e5e5e5] pt-1 text-[9px] text-[#888] lg:text-[10px]">
          <span className="font-medium text-[#555]">Methodology:</span>{' '}
          CO₂e (kg) = Tokens × 0.0000005 kWh/token × 0.400 kg CO₂/kWh — IPCC AR6 &amp; IEA 2024 regional grid factors applied per provider datacenter location.
        </p>
      </div>

      {/* ── Recommended Actions ────────────────────────────────── */}
      <div className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-2.5">
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#4C7060]" strokeWidth={1.5} />
          <p className="text-xs font-medium text-[#1a1a1a] lg:text-sm">Recommended Actions</p>
        </div>
        <div className="grid gap-1.5 md:grid-cols-3 lg:gap-2">
          {[
            { priority: 'High',   action: 'Consolidate Azure regions',     impact: 'Reduce carbon footprint by 18%', savings: '$12K/year' },
            { priority: 'Medium', action: 'Right-size Copilot licenses',   impact: 'Recover 33% unused capacity',    savings: '$36K/year' },
            { priority: 'Low',    action: 'Shift batch jobs to off-peak',  impact: 'Lower water usage by 15%',       savings: 'Environmental' },
          ].map((rec, i) => (
            <div key={i} className="rounded-lg border border-[#e5e5e5] bg-white p-2">
              <div className="mb-1">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  rec.priority === 'High'   ? 'bg-[#f0f5f3] text-[#4C7060]' :
                  rec.priority === 'Medium' ? 'bg-amber-50 text-amber-600'   :
                  'bg-[#f5f5f5] text-[#666]'
                }`}>{rec.priority}</span>
              </div>
              <p className="mb-0.5 text-[11px] font-medium text-[#1a1a1a] lg:text-xs">{rec.action}</p>
              <p className="mb-1 text-[10px] text-[#666] lg:text-[11px]">{rec.impact}</p>
              <p className="text-xs font-medium text-[#4C7060]">{rec.savings}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ExecutiveReport;
