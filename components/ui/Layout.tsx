import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MENU_ITEMS, APP_NAME } from '../../constants';
import { LogOut, BrainCircuit, Menu, X, Sun, Moon } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row transition-colors duration-200">
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
           <BrainCircuit className="w-6 h-6" />
           <span>{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={toggleTheme} className="text-gray-500 dark:text-gray-400">
             {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
           </button>
           <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-700 dark:text-gray-200">
             {mobileMenuOpen ? <X /> : <Menu />}
           </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen sticky top-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-between px-6 border-b dark:border-gray-700">
            <div className="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400">
              <BrainCircuit className="w-8 h-8" />
              <span>{APP_NAME}</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout Section */}
          <div className="p-4 border-t dark:border-gray-700">
             {/* Desktop Theme Toggle */}
             <button 
               onClick={toggleTheme}
               className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mb-2"
             >
               {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
               {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
             </button>

            <div className="flex items-center gap-3 mb-4 px-2 mt-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:h-screen md:overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-950 transition-colors">
        {children}
      </main>
    </div>
  );
};