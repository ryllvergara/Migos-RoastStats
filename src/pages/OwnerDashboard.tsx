import { useState, useEffect } from 'react';
import { AppConfig, resolveCardView } from '../patterns/index';
import { AuditModal } from '../components/audit/AuditModal';
import { Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { BranchCard, BranchCardData } from '@/components/dashboard/BranchCard';

export function OwnerDashboard() {
  const [branches, setBranches] = useState<BranchCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuditBranch, setSelectedAuditBranch] = useState<{ id: string; name: string } | null>(null);
  const config = AppConfig.getInstance();

  const fetchData = async () => {
    const baseUrl = AppConfig.getInstance().baseUrl;
    try {
      const res = await fetch(`${baseUrl}/dashboard/overview`);
      const data = await res.json();
      const formattedData = data.map((b: any) => ({
        ...b,
        lastUpdate: new Date(b.lastUpdate),
        grillingItems: b.grillStatus?.items || [],
        recentSale: b.latestSale
          ? { product_name: b.latestSale.product_name, sold_at: new Date(b.latestSale.sold_at) }
          : undefined,
      }));
      setBranches(formattedData);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const source = new EventSource(`${config.baseUrl}/dashboard/live-updates`);
    source.onmessage = () => { fetchData(); };
    source.onerror = (err) => { console.error('EventSource error:', err); };
    return () => { source.close(); };
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

  const getTimestampLabel = (branch: BranchCardData, prefix: string) => {
    const timeStr = branch.lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (prefix) return `${prefix} ${timeStr}`;
    return getTimeSinceUpdate(branch.lastUpdate);
  };

  const handleAuditComplete = () => {
    fetchData();
    setSelectedAuditBranch(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D32F2F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <DashboardHeader totalRevenue={totalRevenue} />

      {/* Branch Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {branches.map((branch, index) => {
          const cfg = resolveCardView(branch.auditStatus);
          return (
            <BranchCard
              key={index}
              branch={branch}
              timestampLabel={getTimestampLabel(branch, cfg.timestampPrefix)}
              isInactive={isInactive(branch.lastUpdate)}
              onAuditClick={(id, name) => setSelectedAuditBranch({ id, name })}
            />
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