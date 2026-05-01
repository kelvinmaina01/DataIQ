import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, Cell as RCell, LineChart, Line, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity, Radar as RadarIcon } from 'lucide-react';

const AVAILABLE_TYPES = [
  { key: 'bar', icon: BarChart3, label: 'Bar' },
  { key: 'line', icon: TrendingUp, label: 'Line' },
  { key: 'area', icon: Activity, label: 'Area' },
  { key: 'pie', icon: PieIcon, label: 'Pie' },
  { key: 'horizontal-bar', icon: BarChart3, label: 'H-Bar' },
] as const;

const CHART_COLORS = ['#0E50F6', '#10B981', '#F43F5E', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899'];

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-slate-600 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === 'number' && p.value < 1 ? p.value.toFixed(3) : p.value}
        </p>
      ))}
    </div>
  );
};

export function CellChart({ chartMeta, chartData }: { chartMeta: { id: string; type: string; title: string; sub: string }; chartData: any }) {
  const d = chartData[chartMeta.id];
  if (!d) return null;

  const [chartType, setChartType] = useState(chartMeta.type);
  const dataKey = d.data[0]?.rate !== undefined ? 'rate' : 'value';
  const colors = d.colors || CHART_COLORS;

  // Prepare pie data (needs 'name' and 'value')
  const pieData = d.data.map((item: any, i: number) => ({
    name: item.name,
    value: item[dataKey],
    fill: colors[i % colors.length],
  }));

  return (
    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 my-2">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-800 mb-1">{chartMeta.title}</h4>
          <p className="text-[11px] text-slate-500">{chartMeta.sub}</p>
        </div>
        {/* Chart type switcher */}
        <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 flex-shrink-0">
          {AVAILABLE_TYPES.map(t => {
            const Icon = t.icon;
            const isActive = chartType === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setChartType(t.key)}
                title={t.label}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#0E50F6] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${t.key === 'horizontal-bar' ? 'rotate-90' : ''}`} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[240px] mt-3">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={d.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} animationDuration={600}>
                {d.data.map((_: any, i: number) => (
                  <RCell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={d.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey={dataKey} stroke="#0E50F6" strokeWidth={2.5}
                dot={{ r: 5, fill: '#0E50F6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, fill: '#0E50F6' }}
                animationDuration={600} />
            </LineChart>
          ) : chartType === 'area' ? (
            <AreaChart data={d.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={`grad-${chartMeta.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0E50F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0E50F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey={dataKey} stroke="#0E50F6" fill={`url(#grad-${chartMeta.id})`}
                strokeWidth={2.5} animationDuration={600} />
            </AreaChart>
          ) : chartType === 'pie' ? (
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={90} innerRadius={45} paddingAngle={3} strokeWidth={2} stroke="#fff"
                animationDuration={600}
                label={({ name, value }: any) => `${name}: ${value}`}
                labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}>
                {pieData.map((entry: any, i: number) => (
                  <RCell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<Tip />} />
            </PieChart>
          ) : chartType === 'horizontal-bar' ? (
            <BarChart data={d.data} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} width={80} />
              <Tooltip content={<Tip />} />
              <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} animationDuration={600}>
                {d.data.map((_: any, i: number) => (
                  <RCell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : null}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
