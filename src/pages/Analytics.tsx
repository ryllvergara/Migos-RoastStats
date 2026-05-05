import { useState, useEffect, useMemo } from 'react';
import { AppConfig } from '@/patterns/index';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  ChevronLeft, ChevronRight, TrendingUp, 
  Eye, EyeOff, DollarSign, ShoppingBag, MapPin 
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import logoImage from '@/assets/logoImage.png';

const COLORS = ['#E02020', '#FFA500', '#F26522', '#000000', '#D3D3D3', '#FFCC00',];

interface ProductChartData {
  name: string;
  value: number;
  revenue: number;
  units: number;
}

export function Analytics() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState<any>(null);
  const [viewType, setViewType] = useState<'revenue' | 'quantity'>('revenue');
  const [showLogs, setShowLogs] = useState(false);
  const [loading, setLoading] = useState(true);
  const config = AppConfig.getInstance();

  const start = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const end = endOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetch(`${config.baseUrl}/analytics/dashboard?weekOffset=${weekOffset}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    };
    fetchData();
  }, [weekOffset]);

  // Aggregate Data for Branch Bar Chart
  const branchChartData = useMemo(() => {
    if (!data?.logs) return [];

    const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const sortedBranchNames = Array.from(
      new Set(data.logs.map((r: any) => r.branches?.branch_name))
    )
      .filter((name): name is string => Boolean(name))
      .sort((a: string, b: string) => a.localeCompare(b));

    interface DayData {
      day: string;
      [key: string]: string | number;
    }

    const groups: Record<string, DayData> = daysOrder.reduce((acc, day) => {
      acc[day] = { day };
      sortedBranchNames.forEach(b => { acc[day][b] = 0; });
      return acc;
    }, {} as Record<string, DayData>);

    data.logs.forEach((r: any) => {
      const day = format(new Date(r.audited_at), 'EEE');
      const bName = r.branches?.branch_name;
      
      if (bName && groups[day]) {
        (groups[day][bName] as number) += r.expected_revenue;
      }
    });

    return daysOrder.map(day => groups[day]);
  }, [data]);

  // Aggregate Data for Product Pie Chart
  const productPieData = useMemo(() => {
    if (!data?.reports) return [];
    const groups = data.reports.reduce((acc: any, r: any) => {
      const key = r.product_name;
      if (!acc[key]) {
        acc[key] = { name: key, revenue: 0, units: 0 };
      }
      acc[key].revenue += r.product_revenue;
      acc[key].units += r.quantity_sold;
      return acc;
    }, {});

    const sortedData = Object.values(groups).sort((a: any, b: any) => {
      if (viewType === 'revenue') {
        // Primary: Revenue
        if (b.revenue !== a.revenue) return b.revenue - a.revenue;
        // Secondary: Units Sold
        if (b.units !== a.units) return b.units - a.units;
      } else {
        // Primary: Units Sold
        if (b.units !== a.units) return b.units - a.units;
        // Secondary: Revenue
        if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      }
      // Tertiary: Alphabetical
      return a.name.localeCompare(b.name);
    });

    // Map to the format needed for the chart
    return sortedData.map((p: any) => ({
      name: p.name,
      value: viewType === 'revenue' ? p.revenue : p.units,
      revenue: p.revenue,
      units: p.units
    }));
  }, [data, viewType]);

  const topBranch = useMemo(() => {
    if (!data?.logs || data.logs.length === 0) return 'N/A';

    const totals = data.logs.reduce((acc: Record<string, number>, log: any) => {
      const name = log.branches?.branch_name || 'Unknown';
      acc[name] = (acc[name] || 0) + Number(log.expected_revenue);
      return acc;
    }, {});

    // Sort by revenue descending and pick the first one
    const sorted = (Object.entries(totals) as [string, number][]).sort(
      (a, b) => b[1] - a[1]
    );
    return sorted.length > 0 ? sorted[0][0] : 'N/A';
  }, [data]);

  if (loading) return <div className="p-10 text-center font-bold">Loading Analytics...</div>;

  return (
    <div className="mx-auto space-y-8 bg-gray-50 min-h-screen p-8 md:p-6">
      {/* Header & Date Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <img src={logoImage} alt="Migo's Lechon" className="h-16 w-16 rounded-full shadow-md" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 font-medium">View and analyze sales data and performance</p>
          </div>
        </div>
        <div className="flex items-center bg-white border-2 border-gray-100 rounded-2xl p-1 shadow-sm">
          <button onClick={() => setWeekOffset(v => v + 1)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <ChevronLeft className="h-5 w-5 text-gray-400" />
          </button>
          <div className="px-4 text-center min-w-[200px]">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Selected Week</p>
            <p className="text-sm font-bold">{format(start, 'MMM dd, yyyy')} - {format(end, 'MMM dd, yyyy')}</p>
          </div>
          <button onClick={() => setWeekOffset(v => v - 1)} disabled={weekOffset === 0} className="p-2 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-20">
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard 
          label="Gross Sales Revenue" 
          value={`₱${data.summary.totalRevenue.toLocaleString()}`} 
          trend={`${data.summary.growth}%`}
          isPositive={Number(data.summary.growth) >= 0}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard 
          label="Reconciled Sales Revenue" 
          value={`₱${data.summary.reconciledRevenue.toLocaleString()}`} 
          trend="Actual Cash Collected"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard 
          label="Daily Average" 
          value={`₱${data.summary.dailyAverage.toLocaleString(undefined, {maximumFractionDigits: 0})}`} 
          trend="Past 7 days"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard 
          label="Top Branch" 
          value={topBranch} 
          trend="Highest Revenue"
          icon={<MapPin className="h-4 w-4" />}
        />
        <StatCard 
          label="Top Product" 

           value={(productPieData as ProductChartData[])[0]?.name || 'N/A'}
           trend={viewType === 'revenue' ? 'By Revenue' : 'By Quantity Sold'}
           icon={<ShoppingBag className="h-4 w-4" />}
        />
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Branch Performance - Bar Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-8">Branch Performance Breakdown</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                {branchChartData.length > 0 && 
                  Object.keys(branchChartData[0])
                    .filter(key => key !== 'day')
                    .map((branchName, i) => (
                      <Bar 
                        key={branchName} 
                        dataKey={branchName} 
                        fill={COLORS[i % COLORS.length]} 
                        radius={[4, 4, 0, 0]} 
                      />
                    ))
                }
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Performance - Pie Chart */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Product Share</h3>
            <select 
              value={viewType} 
              onChange={(e) => setViewType(e.target.value as any)}
              className="bg-gray-50 border-none text-xs font-bold rounded-lg px-2 py-1 outline-none"
            >
              <option value="revenue">By Revenue</option>
              <option value="quantity">By Quantity Sold</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={productPieData} 
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={8} 
                  dataKey="value"
                >
                  {productPieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {(productPieData as ProductChartData[]).map((p, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                  <span className="text-gray-600 font-medium">{p.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  {/* Primary Value */}
                  <span className="font-bold text-gray-900">
                    {viewType === 'revenue' ? `₱${p.revenue.toLocaleString()}` : `${p.units} units`}
                  </span>
                  {/* Secondary Value */}
                  <span className="text-[10px] text-gray-400">
                    {viewType === 'revenue' ? `${p.units} units` : `₱${p.revenue.toLocaleString()}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <button 
          onClick={() => setShowLogs(!showLogs)}
          className="w-full flex items-center justify-between p-8 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-xl text-gray-500">
              {showLogs ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </div>
            <span className="font-black text-gray-900 tracking-tight">Audit Logs for the Week</span>
          </div>
          <span className="text-xs font-bold text-[#D32F2F] uppercase tracking-widest">{data.logs.length} Total Logs</span>
        </button>
        
        {showLogs && (
          <div className="px-8 pb-8 space-y-4">
            {data.logs.map((log: any, i: number) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-4">
                <div>
                  <p className="font-bold text-gray-900">{log.branches?.branch_name ?? 'Unknown'}</p>                  <p className="text-xs text-gray-500 font-medium">{format(new Date(log.audited_at), 'PPPP p')}</p>
                </div>
                <div className="flex gap-8">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-gray-400">Expected</p>
                    <p className="font-bold">₱{log.expected_revenue.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-gray-400">Actual</p>
                    <p className="font-bold">₱{log.actual_cash.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-gray-400">Variance</p>
                    <p className={`font-black ${log.variance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {log.variance < 0 ? '-' : '+'}₱{Math.abs(log.variance).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

