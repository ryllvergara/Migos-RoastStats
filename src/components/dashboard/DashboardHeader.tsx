import logoImage from '@/assets/logoImage.png';

interface DashboardHeaderProps {
  totalRevenue: number;
}

export function DashboardHeader({ totalRevenue }: DashboardHeaderProps) {
  return (
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
  );
}
