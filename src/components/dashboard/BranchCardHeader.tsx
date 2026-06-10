import { Clock, AlertCircle } from 'lucide-react';

interface BranchCardHeaderProps {
  name: string;
  timestampLabel: string;
  revenue: number;
  revenueLabel: string;
  revenueClass: string;
  showInactiveIcon: boolean;
}

export function BranchCardHeader({
  name,
  timestampLabel,
  revenue,
  revenueLabel,
  revenueClass,
  showInactiveIcon,
}: BranchCardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h2 className="text-xl font-bold text-[#212121]">{name}</h2>
        <div className="mt-1 flex items-center gap-2 text-gray-500">
          <Clock className="h-4 w-4" />
          <span className="text-sm">{timestampLabel}</span>
          {showInactiveIcon && <AlertCircle className="h-4 w-4 text-[#D32F2F]" />}
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">{revenueLabel}</p>
        <p className={`text-xl font-black ${revenueClass}`}>₱{revenue.toLocaleString()}</p>
      </div>
    </div>
  );
}
