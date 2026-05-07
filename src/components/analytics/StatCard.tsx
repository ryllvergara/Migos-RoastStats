import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({ label, value, trend, isPositive, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-gray-50 rounded-xl text-gray-400">{icon}</div>
        {trend.includes('%') && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <h2 className="text-2xl font-black text-gray-900 leading-tight">{value}</h2>
      {!trend.includes('%') && <p className="text-xs font-bold text-gray-400 mt-1">{trend}</p>}
    </div>
  );
}