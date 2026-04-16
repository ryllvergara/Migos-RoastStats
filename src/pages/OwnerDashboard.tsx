import { useState, useEffect } from 'react';
import { Clock, AlertCircle, Package, TrendingUp, Loader2 } from 'lucide-react';
import logoImage from '@/assets/logoImage.png';

const BASE_URL = `http://localhost:3000/api/dashboard`;

interface GrillingProduct {
  product_name: string;
  current_count: number;
}

interface BranchData {
  name: string;
  revenue: number;
  grillingItems: GrillingProduct[];
  lastUpdate: Date;
  lowStock: string[];
  auditStatus: string;
}

export function OwnerDashboard() {
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch(`${BASE_URL}/overview`);
      const data = await res.json();
      const formattedData = data.map((b: any) => ({
        ...b,
        lastUpdate: new Date(b.lastUpdate),
        grillingItems: b.grillStatus?.items || []
      }));
      setBranches(formattedData);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const totalRevenue = branches.reduce((sum, b) => sum + b.revenue, 0);

  const getTimeSinceUpdate = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const isInactive = (date: Date) => {
    const hours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    return hours >= 2;
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#D32F2F]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logoImage} alt="Migo's Lechon" className="h-16 w-16 rounded-full shadow-md" />
          <div>
            <h1 className="text-2xl font-bold text-[#212121]">Command Center</h1>
            <p className="text-gray-600 font-medium">Real-time Multi-Branch Overview</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
          <p className="text-3xl font-black text-[#D32F2F]">₱{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Audit Notification Banner */}
        {branches.map((branch, index) => (
          <div key={index} className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            {branch.auditStatus === 'ready_for_audit' && (
              <div className="mb-6 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-500 p-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-emerald-700">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </div>
                  <span className="text-sm font-bold">Ready for Evening Audit</span>
                </div>
                <button className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-3 py-1 rounded-md hover:bg-emerald-700 transition-colors">
                  Review Sales
                </button>
              </div>
            )}
            <div className="mb-4 flex items-start justify-between">
               <div>
                 <h2 className="text-xl font-bold text-[#212121]">{branch.name}</h2>
                 <div className="mt-1 flex items-center gap-2 text-gray-500">
                   <Clock className="h-4 w-4" />
                   <span className="text-sm">{getTimeSinceUpdate(branch.lastUpdate)}</span>
                   {isInactive(branch.lastUpdate) && <AlertCircle className="h-4 w-4 text-[#D32F2F]" />}
                 </div>
               </div>
               <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">
                    {branch.auditStatus === 'ready_for_audit' ? 'Final Revenue' : "Today's Revenue"}
                  </p>
                  <p className={`text-xl font-black ${branch.auditStatus === 'ready_for_audit' ? 'text-emerald-600' : 'text-[#D32F2F]'}`}>
                    ₱{branch.revenue.toLocaleString()}
                  </p>
               </div>
            </div>

            {/* Inactivity Warning */}
            {isInactive(branch.lastUpdate) && (
              <div className="mb-4 rounded-lg bg-red-50 border border-[#D32F2F] p-3">
                <div className="flex items-center gap-2 text-[#D32F2F]">
                  <AlertCircle className="h-5 w-5" />
                  <span>No updates in 2+ hours</span>
                </div>
              </div>
            )}

            {/* Grill Status */}
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <TrendingUp className="h-4 w-4 text-[#FFC107]" />
                Grill Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {branch.grillingItems.length > 0 ? (
                  branch.grillingItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
                      <span className="text-sm font-medium text-gray-700">{item.product_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-[#FFC107]">{item.current_count}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">On Grill</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic py-2">No items currently grilling</p>
                )}
              </div>
            </div>

            {/* Low Stock Alerts */}
            {branch.lowStock.length > 0 && (
              <div className="rounded-lg bg-yellow-50 border border-[#FFC107] p-4">
                <div className="mb-2 flex items-center gap-2 text-[#212121]">
                  <Package className="h-5 w-5" />
                  <h3>Low Stock Items</h3>
                </div>
                <ul className="space-y-1">
                  {branch.lowStock.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      <div className="h-2 w-2 rounded-full bg-[#FFC107]"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="rounded-lg bg-[#212121] py-4 text-white hover:bg-[#424242] transition-colors">
          View Detailed Reports
        </button>
        <button className="rounded-lg bg-[#FFC107] py-4 text-[#212121] hover:bg-[#FFA000] transition-colors">
          Inventory Management
        </button>
        <button className="rounded-lg border-2 border-[#D32F2F] bg-white py-4 text-[#D32F2F] hover:bg-gray-50 transition-colors">
          Contact Branches
        </button>
      </div> */}
    </div>
  );
}
