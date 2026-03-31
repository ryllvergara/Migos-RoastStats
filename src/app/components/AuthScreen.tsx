import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, MapPin } from 'lucide-react';
import logoImage from '@/assets/logoImage.png';

export function AuthScreen() {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeePin, setEmployeePin] = useState('');
  const [userRole, setUserRole] = useState<'employee' | 'owner'>('employee');

  const branches = [
    { id: 'branch-a', name: 'Branch A', location: 'Main Street Location' },
    { id: 'branch-b', name: 'Branch B', location: 'Downtown Location' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (userRole === 'employee' && (!employeeName || !employeePin || !selectedBranch)) {
      alert('Please fill in all fields and select a branch');
      return;
    }

    if (userRole === 'owner' && (!employeeName || !employeePin)) {
      alert('Please fill in all fields');
      return;
    }

    // Store branch info and role in sessionStorage
    sessionStorage.setItem('employeeBranch', selectedBranch);
    sessionStorage.setItem('employeeName', employeeName);
    sessionStorage.setItem('userRole', userRole);

    // Redirect based on role
    if (userRole === 'owner') {
      navigate('/dashboard');
    } else {
      navigate('/pos');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D32F2F] to-[#B71C1C] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img src={logoImage} alt="Migo's Lechon" className="h-32 w-32 mx-auto mb-4 rounded-full border-4 border-white shadow-xl" />
          <h1 className="text-white mb-2">Migo's RoastStats</h1>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-white rounded-lg shadow-2xl p-6 space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-[#212121] mb-3">
              Login As
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserRole('employee')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  userRole === 'employee'
                    ? 'border-[#D32F2F] bg-[#D32F2F]/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className={`${userRole === 'employee' ? 'text-[#D32F2F]' : 'text-[#212121]'}`}>
                  Employee
                </p>
              </button>
              <button
                type="button"
                onClick={() => setUserRole('owner')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  userRole === 'owner'
                    ? 'border-[#FFC107] bg-[#FFC107]/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className={`${userRole === 'owner' ? 'text-[#FFC107]' : 'text-[#212121]'}`}>
                  Owner
                </p>
              </button>
            </div>
          </div>

          {/* Employee Name */}
          <div>
            <label htmlFor="employeeName" className="block text-[#212121] mb-2">
              Name
            </label>
            <input
              id="employeeName"
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#D32F2F] focus:outline-none text-[#212121]"
              required
            />
          </div>

          {/* PIN */}
          <div>
            <label htmlFor="employeePin" className="block text-[#212121] mb-2">
              PIN Code
            </label>
            <input
              id="employeePin"
              type="password"
              value={employeePin}
              onChange={(e) => setEmployeePin(e.target.value)}
              placeholder="Enter 6-digit PIN"
              maxLength={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#D32F2F] focus:outline-none text-[#212121]"
              required
            />
          </div>

          {/* Branch Selection */}
          { userRole === 'employee' && (
          <div>
            <label className="block text-[#212121] mb-3">
              Select Your Branch
            </label>
            <div className="space-y-3">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => setSelectedBranch(branch.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedBranch === branch.id
                      ? 'border-[#D32F2F] bg-[#D32F2F]/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className={`h-5 w-5 ${selectedBranch === branch.id ? 'text-[#D32F2F]' : 'text-gray-400'}`} />
                    <div className="text-left flex-1">
                      <p className="text-[#212121]">{branch.name}</p>
                      <p className="text-gray-500">{branch.location}</p>
                    </div>
                    {selectedBranch === branch.id && (
                      <div className="h-5 w-5 rounded-full bg-[#D32F2F] flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white py-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <LogIn className="h-5 w-5" />
            {userRole === 'employee' && <span>Start Shift</span>}
            {userRole === 'owner' && <span>Go to Dashboard</span>}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-white/60 mt-6 text-sm">
          Contact your manager if you need help logging in
        </p>
      </div>
    </div>
  );
}
