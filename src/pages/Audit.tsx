import { useState, useEffect } from "react";
import { 
  MapPin, 
  ChevronRight, 
  AlertCircle, 
  Loader2,
  CheckCircle2
} from "lucide-react";
import { AuditModal } from "../components/AuditModal";
import logoImage from "@/assets/logoImage.png";

const PORT = import.meta.env.VITE_PORT;
const BASE_URL = `http://localhost:${PORT}/api`;

interface Branch {
  id: string;
  branch_name: string;
  last_audit_status: "active" | "ready_for_audit";
  location?: string;
}

export function Audit() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/branches`);
      const data = await res.json();
      setBranches(data);
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    } finally {
      setLoading(false);
    }
  };

  const pendingAudits = branches.filter(b => b.last_audit_status === "ready_for_audit");
  const activeBranches = branches.filter(b => b.last_audit_status === "active");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#D32F2F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logoImage} alt="Migo's Lechon" className="h-16 w-16 rounded-full shadow-md" />
          <div>
            <h1 className="text-2xl font-bold text-[#212121]">Branch Audits</h1>
            <p className="text-gray-600 font-medium">Verify and finalize daily revenue reports</p>
          </div>
        </div>
      </div>

      {/* Pending Audits Grid */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6 text-[#D32F2F]">
          <AlertCircle className="h-5 w-5" />
          <h2 className="font-bold uppercase tracking-widest text-sm">Pending Audits</h2>
        </div>

        {pendingAudits.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">All branches are currently audited and active.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingAudits.map((branch) => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranch(branch)}
                className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-md border border-red-100 hover:shadow-xl hover:border-red-300 transition-all text-left"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-50 rounded-2xl text-[#D32F2F] group-hover:bg-[#D32F2F] group-hover:text-white transition-colors">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">
                    Ready for Audit
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{branch.branch_name}</h3>
                <p className="text-sm text-gray-500 mt-1">{branch.location || "Main Branch"}</p>
                <div className="mt-6 flex items-center text-[#D32F2F] font-bold text-sm">
                  Review Shift Details
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Active Branches View */}
      <section>
        <div className="flex items-center gap-2 mb-6 text-gray-400">
          <CheckCircle2 className="h-5 w-5" />
          <h2 className="font-bold uppercase tracking-widest text-sm">Active Branches</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeBranches.map((branch) => (
            <div key={branch.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white opacity-60">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{branch.branch_name}</p>
                <p className="text-[10px] text-green-600 font-bold uppercase">Active Shift</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Audit Modal Integration */}
      {selectedBranch && (
        <AuditModal
          branchId={selectedBranch.id}
          branchName={selectedBranch.branch_name}
          onClose={() => setSelectedBranch(null)}
          onFinalize={() => {
            fetchBranches();
            setSelectedBranch(null);
          }}
        />
      )}
    </div>
  );
}