import { useState, useEffect, useMemo } from 'react';
import { AppConfig } from '@/patterns/index';
import { 
  TrendingUp, DollarSign, ShoppingBag, MapPin 
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

// Component Imports
import { StatCard } from '@/components/analytics/StatCard';
import { WeekNavigator } from '@/components/analytics/WeekNavigator';
import { BranchBarChart } from '@/components/analytics/BranchBarChart';
import { ProductPieChart, ProductChartData } from '@/components/analytics/ProductPieChart';
import { AuditLogsSection } from '@/components/analytics/AuditLogsSection';

import logoImage from '@/assets/logoImage.png';

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
        if (b.revenue !== a.revenue) return b.revenue - a.revenue;
        if (b.units !== a.units) return b.units - a.units;
      } else {
        if (b.units !== a.units) return b.units - a.units;
        if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      }
      return a.name.localeCompare(b.name);
    });

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
        
        <WeekNavigator 
          start={start}
          end={end}
          weekOffset={weekOffset}
          onPrevWeek={() => setWeekOffset(v => v + 1)}
          onNextWeek={() => setWeekOffset(v => v - 1)}
        />
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
        <BranchBarChart data={branchChartData} />
        
        <ProductPieChart 
          data={productPieData as ProductChartData[]}
          viewType={viewType}
          onViewTypeChange={(v) => setViewType(v)}
        />
      </div>

      {/* Audit Logs Section */}
      <AuditLogsSection 
        logs={data.logs}
        showLogs={showLogs}
        onToggle={() => setShowLogs(!showLogs)}
      />
    </div>
  );
}