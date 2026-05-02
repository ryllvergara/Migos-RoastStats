import { useState, useEffect } from "react";
import { 
  X, 
  Users, 
  Package, 
  AlertTriangle, 
  Banknote, 
  TrendingUp, 
  Loader2 
} from "lucide-react";

interface AuditProduct {
  name: string;
  unitsSold: number;
  pricePerUnit: number;
  revenue: number;
  wastage: number;
  remainingStocks: number;
}

interface Staff {
  name: string;
}

interface AuditModalProps {
  branchId: string;
  branchName: string;
  onClose: () => void;
  onFinalize: () => void;
}

const PORT = import.meta.env.VITE_PORT;
const BASE_URL = `http://localhost:${PORT}/api/audit`;

export function AuditModal({ branchId, branchName, onClose, onFinalize }: AuditModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<{ products: AuditProduct[]; employees: Staff[]; totalExpected: number }>({
    products: [],
    employees: [],
    totalExpected: 0,
  });
  const [actualCash, setActualCash] = useState<string>("");

  useEffect(() => {
    fetchAuditDetails();
  }, [branchId]);

  const fetchAuditDetails = async () => {
    try {
      const res = await fetch(`${BASE_URL}/details/${branchId}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Audit Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const expectedCash = data.totalExpected;
  const variance = (Number(actualCash) || 0) - expectedCash;

  const handleFinalize = async () => {
    if (!actualCash) return alert("Please enter the actual cash counted.");
    
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          actualCash: Number(actualCash),
          expectedCash,
          variance,
        }),
      });

      if (res.ok) {
        onFinalize();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <Loader2 className="h-8 w-8 animate-spin text-[#D32F2F]" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Branch Audit: {branchName}</h2>
            <p className="text-sm text-gray-500">Review sales and inventory before resetting status</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Staff Section */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-[#D32F2F]">
              <Users className="h-5 w-5" />
              <h3 className="font-bold uppercase tracking-wider text-xs">Staff on Duty</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.employees.map((emp, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                  {emp.name}
                </span>
              ))}
            </div>
          </section>

          {/* Sales Table */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-[#D32F2F]">
              <Package className="h-5 w-5" />
              <h3 className="font-bold uppercase tracking-wider text-xs">Sales Summary</h3>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-center">Sold</th>
                    <th className="px-4 py-3 text-center">Wasted</th>
                    <th className="px-4 py-3 text-center">Remaining Stocks</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.products.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-800">{p.name}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{p.unitsSold}</td>
                      <td className="px-4 py-3 text-center text-red-500 font-medium">
                        {p.wastage > 0 ? `${p.wastage}` : "0"}
                      </td>
                      <td className="px-4 py-3 text-center text-red-500 font-medium">
                        {p.remainingStocks > 0 ? `${p.remainingStocks}` : "0"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">₱{p.pricePerUnit.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">₱{p.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Revenue Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div className="space-y-4">
              {/* Expected Revenue */}
              <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                <div className="flex items-center gap-3 text-gray-600">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-medium">Total Expected Revenue</span>
                </div>
                <span className="text-xl font-black text-gray-900">₱{expectedCash.toFixed(2)}</span>
              </div>
              {/* Actual Cash Input */}
              <div className="p-4 rounded-2xl flex justify-between items-center bg-white border-2 border-dashed border-gray-200">
                <div className="flex items-center gap-3 text-gray-600">
                  <Banknote className="h-5 w-5" />
                  <span className="font-medium">Actual Cash in Drawer</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">₱</span>
                  <input
                    type="number"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    placeholder="0.00"
                    className="w-24 text-right font-black text-xl text-[#D32F2F] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Variance */}
            <div className={`p-6 rounded-2xl flex flex-col justify-center items-center ${variance < 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                {variance < 0 ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <TrendingUp className="h-5 w-5 text-green-600" />}
                <span className={`font-bold uppercase text-xs ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Variance (Difference)
                </span>
              </div>
              <p className={`text-4xl font-black ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {variance < 0 ? "-" : "+"}₱{Math.abs(variance).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {variance < 0 ? "Cash shortage detected" : variance > 0 ? "Cash surplus detected" : "Perfectly balanced"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleFinalize}
            disabled={submitting}
            className="flex-[2] py-3 bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold rounded-xl shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Finalize & Reset Branch Status"}
          </button>
        </div>
      </div>
    </div>
  );
}