import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
 
const COLORS = ['#E02020', '#FFA500', '#F26522', '#000000', '#D3D3D3', '#FFCC00'];
 
interface BranchBarChartProps {
  data: Record<string, string | number>[];
}
 
export function BranchBarChart({ data }: BranchBarChartProps) {
  return (
    <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
      <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-8">
        Branch Performance Breakdown
      </h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              dy={10}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: '#F8FAFC' }}
              contentStyle={{
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
            {data.length > 0 &&
              Object.keys(data[0])
                .filter((key) => key !== 'day')
                .map((branchName, i) => (
                  <Bar
                    key={branchName}
                    dataKey={branchName}
                    fill={COLORS[i % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}