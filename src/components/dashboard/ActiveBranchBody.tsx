import { RecentSaleBanner, InactivityWarning } from './ActivityBanners';
import { GrillStatusGrid } from './GrillStatusGrid';

interface RecentSale {
  product_name: string;
  sold_at: Date;
}

interface GrillingProduct {
  product_name: string;
  current_count: number;
}

interface ActiveBranchBodyProps {
  recentSale?: RecentSale;
  lastUpdate: Date;
  grillingItems: GrillingProduct[];
  isInactive: boolean;
}

export function ActiveBranchBody({
  recentSale,
  lastUpdate,
  grillingItems,
  isInactive,
}: ActiveBranchBodyProps) {
  const recentSaleIsActive =
    recentSale && (Date.now() - recentSale.sold_at.getTime()) / (1000 * 60 * 60) < 2;

  return (
    <>
      {/* Recent Sale or Inactivity Warning */}
      <div className="mb-4">
        {recentSaleIsActive ? (
          <RecentSaleBanner productName={recentSale!.product_name} soldAt={recentSale!.sold_at} />
        ) : isInactive ? (
          <InactivityWarning />
        ) : null}
      </div>

      {/* Grill Status */}
      <GrillStatusGrid items={grillingItems} />
    </>
  );
}
