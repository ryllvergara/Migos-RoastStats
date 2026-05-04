import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { LogIn, MapPin, Loader2 } from "lucide-react";
import logoImage from "@/assets/logoImage.png";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const AUTH_URL = `${BASE_URL}/api/auth`;

interface Branch {
  id: string;
  branch_name: string;
  branch_address: string;
}

export function AuthScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [userName, setUserName] = useState("");
  const [userPin, setUserPin] = useState("");
  const [userRole, setUserRole] = useState<"employee" | "owner">("employee");
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch(`${AUTH_URL}/branches`);
        if (!response.ok) throw new Error("Failed to fetch branches");
        const data = await response.json();
        setBranches(data);
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };

    fetchBranches();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName || !userPin || (userRole === "employee" && !selectedBranch)) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, userPin, userRole, branchId: selectedBranch }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Login failed");
      }

      sessionStorage.clear();
      sessionStorage.setItem("token", result.token);
      sessionStorage.setItem("userId", result.user.userId);
      sessionStorage.setItem("userName", result.user.userName);
      sessionStorage.setItem("userRole", result.user.userRole);
      sessionStorage.setItem("shiftId", result.user.shiftId || "");

      if (userRole === "employee" && selectedBranch) {
        const branchInfo = branches.find((b) => b.id === selectedBranch);
        sessionStorage.setItem("activeBranchId", selectedBranch);
        sessionStorage.setItem(
          "branchName",
          branchInfo?.branch_name || "Branch",
        );
      }

      navigate(userRole === "owner" ? "/dashboard" : "/pos");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D32F2F] to-[#B71C1C] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={logoImage}
            alt="Migo's Lechon"
            className="h-32 w-32 mx-auto mb-4 rounded-full border-4 border-white shadow-xl"
          />
          <h1 className="text-white mb-2 text-3xl font-bold">Migo's RoastStats</h1>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-lg shadow-2xl p-6 space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-[#212121] mb-3 font-medium">Login As</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserRole("employee")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  userRole === "employee"
                    ? "border-[#D32F2F] bg-[#D32F2F]/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className={`font-semibold ${userRole === "employee" ? "text-[#D32F2F]" : "text-[#212121]"}`}>
                  Employee
                </p>
              </button>
              <button
                type="button"
                onClick={() => setUserRole("owner")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  userRole === "owner"
                    ? "border-[#FFC107] bg-[#FFC107]/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className={`font-semibold ${userRole === "owner" ? "text-[#FFC107]" : "text-[#212121]"}`}>
                  Owner
                </p>
              </button>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="userName" className="block text-[#212121] mb-2 font-medium">Name</label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#D32F2F] focus:outline-none text-[#212121]"
              required
            />
          </div>

          {/* PIN Input */}
          <div>
            <label htmlFor="userPin" className="block text-[#212121] mb-2 font-medium">PIN Code</label>
            <input
              id="userPin"
              type="password"
              value={userPin}
              onChange={(e) => setUserPin(e.target.value)}
              placeholder="Enter 4-digit PIN"
              maxLength={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#D32F2F] focus:outline-none text-[#212121]"
              required
            />
          </div>

          {/* Branch Selection */}
          {userRole === "employee" && (
            <div className="space-y-3">
              <label className="block text-[#212121] mb-1 font-medium">Select Your Branch</label>
              {branches.length === 0 ? (
                <p className="text-gray-400 text-sm italic">
                  Loading branches...
                </p>
              ) : (
                branches.map((branch) => (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => setSelectedBranch(branch.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedBranch === branch.id
                        ? "border-[#D32F2F] bg-[#D32F2F]/10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin
                        className={`h-5 w-5 ${selectedBranch === branch.id ? "text-[#D32F2F]" : "text-gray-400"}`}
                      />
                      <div className="text-left flex-1">
                        <p className="text-[#212121] font-medium">
                          {branch.branch_name}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {branch.branch_address}
                        </p>
                      </div>
                      {selectedBranch === branch.id && (
                        <div className="h-5 w-5 rounded-full bg-[#D32F2F] flex items-center justify-center">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white py-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
            <span className="font-bold">
              {userRole === "employee" ? "Start Shift" : "Go to Dashboard"}
            </span>
          </button>
        </form>

        <p className="text-center text-white/60 mt-6 text-sm">
          Contact your manager if you need help logging in
        </p>
      </div>
    </div>
  );
}
