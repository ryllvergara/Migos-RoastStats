import { Link, useLocation, useNavigate } from 'react-router';
import { Flame, BarChart3, FileCheck, LogOut, Package, Store } from 'lucide-react';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = sessionStorage.getItem('userRole');

  const links = [
    { path: '/pos', label: 'POS', icon: Flame, roles: ['employee'] },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3, roles: ['owner'] },
    { path: '/inventory', label: 'Inventory', icon: Package, roles: ['owner'] },
    { path: '/management', label: 'Management', icon: Store, roles: ['owner'] },
    { path: '/audit', label: 'Audit', icon: FileCheck, roles: ['owner'] },
  ];

  const filteredLinks = links.filter(link => link.roles.includes(userRole || 'employee'));

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  const employeeName = sessionStorage.getItem('employeeName');

  return (
    <nav className="bg-[#212121] shadow-lg">
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex gap-2">
          {filteredLinks.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#D32F2F] text-white'
                    : 'text-gray-300 hover:text-white hover:bg-[#424242]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm">{label}</span>
              </Link>
            );
          })}
        </div>

        {employeeName && (
          <div className="flex items-center gap-3">
            <span className="text-white text-sm">👋 {employeeName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#424242] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
