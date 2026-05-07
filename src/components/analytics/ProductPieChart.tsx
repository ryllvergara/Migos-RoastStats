import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
 
const COLORS = ['#E02020', '#FFA500', '#F26522', '#000000', '#D3D3D3', '#FFCC00'];
 
export interface ProductChartData {
  name: string;
  value: number;
  revenue: number;
  units: number;
}
 
interface ProductPieChartProps {
  data: ProductChartData[];
  viewType: 'revenue' | 'quantity';
  onViewTypeChange: (v: 'revenue' | 'quantity') => void;
}
 
export function ProductPieChart({ data, viewType, onViewTypeChange }: ProductPieChartProps) {
  return (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Product Share</h3>
        <select
          value={viewType}
          onChange={(e) => onViewTypeChange(e.target.value as 'revenue' | 'quantity')}
          className="bg-gray-50 border-none text-xs font-bold rounded-lg px-2 py-1 outline-none"
        >
          <option value="revenue">By Revenue</option>
          <option value="quantity">By Quantity Sold</option>
        </select>
      </div>
 
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={70}
              outerRadius={100}
              paddingAngle={8}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
 
      <div className="mt-4 space-y-2">
        {data.map((p, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-gray-600 font-medium">{p.name}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-bold text-gray-900">
                {viewType === 'revenue' ? `₱${p.revenue.toLocaleString()}` : `${p.units} units`}
              </span>
              <span className="text-[10px] text-gray-400">
                {viewType === 'revenue' ? `${p.units} units` : `₱${p.revenue.toLocaleString()}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
 