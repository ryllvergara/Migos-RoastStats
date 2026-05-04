import { useState } from "react";
import { X, UserPlus, Shield, User, Lock, Loader2 } from "lucide-react";
import { AppConfig } from "@/patterns/index";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const [userName, setUserName] = useState("");
  const [userPin, setUserPin] = useState("");
  const [userRole, setUserRole] = useState<"employee" | "owner">("employee");
  const [loading, setLoading] = useState(false);
  const config = AppConfig.getInstance();

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${config.baseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.token}`
        },
        body: JSON.stringify({ userName, userPin, userRole }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Registration failed");

      alert("Staff Registered Successfully!");
      onClose(); // Close modal on success
      setUserName("");
      setUserPin("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-[#D32F2F] p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            <h2 className="text-xl font-bold">Register New Staff</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleRegister} className="p-8 space-y-5">
          {/* Role Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setUserRole("employee")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                userRole === "employee" ? "bg-white shadow-md text-[#D32F2F]" : "text-gray-500"
              }`}
            >
              <User className="h-4 w-4" /> <span className="font-medium text-sm">Employee</span>
            </button>
            <button
              type="button"
              onClick={() => setUserRole("owner")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                userRole === "owner" ? "bg-white shadow-md text-[#FFC107]" : "text-gray-500"
              }`}
            >
              <Shield className="h-4 w-4" /> <span className="font-medium text-sm">Owner</span>
            </button>
          </div>

          {/* Name Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Kadoy"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-[#D32F2F] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* PIN Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Security PIN (4 Digits)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                maxLength={4}
                placeholder="0000"
                value={userPin}
                onChange={(e) => setUserPin(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-[#D32F2F] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#212121] hover:bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            Confirm Registration
          </button>
        </form>
      </div>
    </div>
  );
}