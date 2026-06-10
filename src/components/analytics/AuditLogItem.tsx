import { format } from 'date-fns';

export interface AuditLog {
  branches?: { branch_name: string };
  audited_at: string;
  expected_revenue: number;
  actual_cash: number;
  variance: number;
}

interface AuditLogItemProps {
  log: AuditLog;
}

export function AuditLogItem({ log }: AuditLogItemProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-4">
      <div>
        <p className="font-bold text-gray-900">{log.branches?.branch_name ?? 'Unknown'}</p>
        <p className="text-xs text-gray-500 font-medium">
          {format(new Date(log.audited_at), 'PPPP p')}
        </p>
      </div>
      <div className="flex gap-8">
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-gray-400">Expected</p>
          <p className="font-bold">₱{log.expected_revenue.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-gray-400">Actual</p>
          <p className="font-bold">₱{log.actual_cash.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-gray-400">Variance</p>
          <p className={`font-black ${log.variance < 0 ? 'text-red-500' : 'text-green-500'}`}>
            {log.variance < 0 ? '-' : '+'}₱{Math.abs(log.variance).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}