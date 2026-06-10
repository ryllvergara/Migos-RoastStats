import { AlertCircle } from 'lucide-react';

interface RecentSaleBannerProps {
  productName: string;
  soldAt: Date;
}

export function RecentSaleBanner({ productName, soldAt }: RecentSaleBannerProps) {
  return (
    <div className="rounded-lg bg-amber-50 border border-[#FFC107] p-3 shadow-sm animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#4A3728]">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </div>
          <span className="font-bold text-sm">{productName} sold!</span>
        </div>
        <span className="text-sm font-bold text-amber-600 uppercase">
          {soldAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export function InactivityWarning() {
  return (
    <div className="rounded-lg bg-red-50 border border-[#D32F2F] p-3 animate-in fade-in slide-in-from-bottom-1">
      <div className="flex items-center gap-2 text-[#D32F2F]">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium text-sm">No activity recorded in 2+ hours</span>
      </div>
    </div>
  );
}
