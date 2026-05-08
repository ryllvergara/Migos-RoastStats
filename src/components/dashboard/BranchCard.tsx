import { resolveCardView } from '../../patterns/index';
import { AuditReadyBanner } from './AuditReadyBanner';
import { BranchCardHeader } from './BranchCardHeader';
import { ActiveBranchBody } from './ActiveBranchBody';

interface GrillingProduct {
  product_name: string;
  current_count: number;
}

interface RecentSale {
  product_name: string;
  sold_at: Date;
}

export interface BranchCardData {
  id: string;
  name: string;
  revenue: number;
  grillingItems: GrillingProduct[];
  lastUpdate: Date;
  auditStatus: string;
  recentSale?: RecentSale;
}

interface BranchCardProps {
  branch: BranchCardData;
  timestampLabel: string;
  isInactive: boolean;
  onAuditClick: (id: string, name: string) => void;
}

export function BranchCard({ branch, timestampLabel, isInactive, onAuditClick }: BranchCardProps) {
  const cfg = resolveCardView(branch.auditStatus);

  const renderBody = () => {
    if (cfg.viewType === 'ready_for_audit') {
      return (
        <button
          onClick={() => onAuditClick(branch.id, branch.name)}
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
        <div className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-white flex items-center justify-center py-12 px-6">
          <span className="text-sm italic text-gray-400 font-medium">
            Closed and Audited for the Day
          </span>
        </div>
      );
    }

    return (
      <ActiveBranchBody
        recentSale={branch.recentSale}
        lastUpdate={branch.lastUpdate}
        grillingItems={branch.grillingItems}
        isInactive={isInactive}
      />
    );
  };

  return (
    <div className={`rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow ${cfg.cardBorderClass}`}>
      {cfg.viewType === 'ready_for_audit' && <AuditReadyBanner />}

      <BranchCardHeader
        name={branch.name}
        timestampLabel={timestampLabel}
        revenue={branch.revenue}
        revenueLabel={cfg.revenueLabel}
        revenueClass={cfg.revenueClass}
        showInactiveIcon={cfg.viewType === 'active' && isInactive}
      />

      {renderBody()}
    </div>
  );
}
