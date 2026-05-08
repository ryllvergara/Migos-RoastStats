import { useState, useEffect } from 'react';
import { AppConfig, resolveCardView } from '../patterns/index';
import { AuditModal } from '../components/audit/AuditModal';
import { Clock, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import logoImage from '@/assets/logoImage.png';

interface GrillingProduct {
  product_name: string;
  current_count: number;
}

interface RecentSale {
  product_name: string;
  sold_at: Date;
}

interface BranchData {
  id: string;
  name: string;
  revenue: number;
  grillingItems: GrillingProduct[];
  lastUpdate: Date;
  auditStatus: string;
  recentSale?: RecentSale;
}

export function OwnerDashboard() {
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuditBranch, setSelectedAuditBranch] = useState<{ id: string; name: string } | null>(null);
  const config = AppConfig.getInstance();

  const fetchData = async () => {
    try {
      const res = await fetch(`${config.baseUrl}/dashboard/overview`);
      const data = await res.json();
      const formattedData = data.map((b: any) => ({
        ...b,
        lastUpdate: new Date(b.lastUpdate),
        grillingItems: b.grillStatus?.items || [],
        recentSale: b.latestSale ? {
          product_name: b.latestSale.product_name,
          sold_at: new Date(b.latestSale.sold_at)
        } : undefined
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
    const source = new EventSource(`${config.baseUrl}/dashboard/live-updates`);
    source.onmessage = () => {
       fetchData();
    };
    source.onerror = (err) => {
      console.error('EventSource error:', err);
    };
    return () => {
      source.close();
    };
  }, []);

  const totalRevenue = branches.reduce((sum, b) => sum + b.revenue, 0);

  const getTimeSinceUpdate = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h ago`;
  };

  const isInactive = (date: Date) => {
    return (Date.now() - date.getTime()) / (1000 * 60 * 60) >= 2;
  };

  const getTimestampLabel = (branch: BranchData, prefix: string) => {
    const timeStr = branch.lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (prefix) return `${prefix} ${timeStr}`;
    return getTimeSinceUpdate(branch.lastUpdate);
  };

  const handleAuditComplete = () => {
    fetchData(); 
    setSelectedAuditBranch(null);
  };
  
  // Renders the card body based on auditStatus
  const renderCardBody = (branch: BranchData) => {
    const cfg = resolveCardView(branch.auditStatus);

    if (cfg.viewType === 'ready_for_audit') {
      return (
        <button
          onClick={() => setSelectedAuditBranch({ id: branch.id, name: branch.name })}
          className="w-full rounded-xl border-2 border-emerald-500 bg-emerald-50 
                     hover:bg-emerald-100 active:scale-[0.99] transition-all
                     flex flex-col items-center justify-center gap-1 py-12 px-6"
        >
          <span className="text-base font-bold text-emerald-700">Ready for Evening Audit</span>
          <span className="text-sm italic text-emerald-500">Tap to review sales</span>
        </button>
      );
    }

    if (cfg.viewType === 'audited') {
      return (
        <div className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-white
                        flex items-center justify-center py-12 px-6">
          <span className="text-sm italic text-gray-400 font-medium">
            Closed and Audited for the Day
          </span>
        </div>
      );
    }

    if (loading) return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D32F2F]" />
      </div>
    );

    return (
      <>
        {/* Recent Sale or Inactivity Warning */}
        <div className="mb-4">
          {branch.recentSale && !isInactive(branch.recentSale.sold_at) ? (
            <div className="rounded-lg bg-amber-50 border border-[#FFC107] p-3 shadow-sm animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#4A3728]">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </div>
                  <span className="font-bold text-sm">{branch.recentSale.product_name} sold!</span>
                </div>
                <span className="text-sm font-bold text-amber-600 uppercase">
                  {branch.recentSale.sold_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ) : isInactive(branch.lastUpdate) ? (
            <div className="rounded-lg bg-red-50 border border-[#D32F2F] p-3 animate-in fade-in slide-in-from-bottom-1">
              <div className="flex items-center gap-2 text-[#D32F2F]">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium text-sm">No activity recorded in 2+ hours</span>
              </div>
            </div>
          ) : null}
        </div>

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
      </>
    );
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
        {branches.map((branch, index) => {
          const cfg = resolveCardView(branch.auditStatus);
          return (
            <div
              key={index}
              className={`rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow ${cfg.cardBorderClass}`}
            >
              {/* Audit Notification Banner */}
              {cfg.viewType === 'ready_for_audit' && (
                <div className="mb-4 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-500 p-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <span className="text-sm font-bold">Ready for Evening Audit!</span>
                  </div>
                </div>
              )}

              {/* Card Header */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#212121]">{branch.name}</h2>
                  <div className="mt-1 flex items-center gap-2 text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{getTimestampLabel(branch, cfg.timestampPrefix)}</span>
                    {cfg.viewType === 'active' && isInactive(branch.lastUpdate) && (
                      <AlertCircle className="h-4 w-4 text-[#D32F2F]" />
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">
                    {cfg.revenueLabel}
                  </p>
                  <p className={`text-xl font-black ${cfg.revenueClass}`}>
                    ₱{branch.revenue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              {renderCardBody(branch)}
            </div>
          );
        })}
      </div>

      {selectedAuditBranch && (
        <AuditModal
          branchId={selectedAuditBranch.id}
          branchName={selectedAuditBranch.name}
          onClose={() => setSelectedAuditBranch(null)}
          onFinalize={handleAuditComplete}
        />
      )}
    </div>
  );
}