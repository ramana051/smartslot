import { Link, useNavigate } from 'react-router';
import { Clock, ShieldCheck, Briefcase, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SmartSlot
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {(!user || user.role === 'user') && (
              <>
                <Link to="/services" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
                  Browse
                </Link>
                <Link to="/deals" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
                  Deals
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-slate-700 hover:text-blue-600 transition-colors font-medium flex items-center gap-1"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link to="/bookings" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
                      My Bookings
                    </Link>
                  </>
                )}
              </>
            )}

            {isAuthenticated ? (
              <>
                {user?.role === 'owner' && (
                  <Link
                    to="/business"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                  >
                    <Briefcase className="w-4 h-4" /> Owner Console
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                  >
                    <ShieldCheck className="w-4 h-4" /> Admin
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="hidden lg:inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-800 rounded-lg hover:bg-slate-50 transition-all font-medium"
                >
                  Profile
                </Link>

                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-200">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    {user?.name}
                    <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full ml-1 uppercase text-slate-500">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200">
                <Link to="/login" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
                  Login
                </Link>
                <Link to="/login/owner" className="text-slate-600 hover:text-slate-900 text-sm">
                  Owner
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  Sign Up
                </Link>
                <Link to="/admin/login" className="text-xs text-slate-400 hover:text-red-600">
                  Admin
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
