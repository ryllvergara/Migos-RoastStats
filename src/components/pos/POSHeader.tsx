import { RefreshCw } from 'lucide-react';
import logoImage from '@/assets/logoImage.png';

interface POSHeaderProps {
  branchName: string;
  userName: string;
  totalRevenue: number;
  loading: boolean;
  onSync: () => void;
}

export function POSHeader({ branchName, userName, totalRevenue, loading, onSync }: POSHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <img src={logoImage} alt="Migo's Lechon" className="h-16 w-16 rounded-full" />
        <div>
          <h1 className="text-xl font-bold text-[#212121]">Grill Side POS</h1>
          <p className="text-sm text-gray-600">
            {branchName} • {userName}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onSync}
          className="p-2 text-gray-400 hover:text-[#D32F2F] transition-colors"
          title="Sync Menu"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Revenue</p>
          <p className="text-2xl font-black text-[#D32F2F]">₱{totalRevenue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
