import { Link, useLocation, useNavigate } from 'react-router';
import { Flame, BarChart3, FileCheck, LogOut, Package, Store, Loader2, ChartNoAxesCombined} from 'lucide-react';
import { useState } from 'react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';  

const PORT = import.meta.env.PORT;
const BASE_URL = `http://localhost:${PORT}/api/auth`;
export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userRole = sessionStorage.getItem('userRole');
  const userName = sessionStorage.getItem('userName');
  const token = sessionStorage.getItem('token');

  const links = [
    { path: '/pos', label: 'POS', icon: Flame, roles: ['employee'] },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3, roles: ['owner'] },
    { path: '/inventory', label: 'Inventory', icon: Package, roles: ['owner'] },
    { path: '/management', label: 'Management', icon: Store, roles: ['owner'] },
    { path: '/audit', label: 'Audit', icon: FileCheck, roles: ['owner'] },
    { path: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined, roles: ['owner'] },
  ];

  const filteredLinks = links.filter(link => link.roles.includes(userRole || ''));

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
    sessionStorage.clear();
    setIsLoggingOut(false);
    navigate('/');
    }
  };

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

        {userName && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-white text-xs font-bold leading-none">{userName}</p>
              <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">{userRole}</p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={isLoggingOut} 
                  className='flex items-center gap-2 px-4 py-2 rounded-xl bg-[#333333] text-gray-300 hover:text-white hover:bg-[#D32F2F] transition-all disabled:opacity-50'  
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  <span className="text-xs font-bold">Logout</span>
                </button>
                </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold text-[#212121]">
                    Confirm Logout
                  </AlertDialogTitle>
                  {userRole === 'employee' && (
                    <AlertDialogDescription className="text-gray-500">
                    Are you sure you want to log out? This will end your current shift and lock this branch until the next login.
                    </AlertDialogDescription>
                  )}
                  {userRole === 'owner' && (
                    <AlertDialogDescription className="text-gray-500">
                    Are you sure you want to log out?
                    </AlertDialogDescription>
                  )}
                  
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3">
                  <AlertDialogCancel className="rounded-xl border-2 border-gray-100 hover:bg-gray-50 font-bold text-gray-500">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold"
                  >
                    Yes, Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </nav>
  );
}
