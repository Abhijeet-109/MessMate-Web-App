import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { userService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../shared/ThemeToggle';
import { Home, ClipboardList, Ticket, Bell, User, UtensilsCrossed, LogOut } from 'lucide-react';
import { clsx } from 'clsx';

export const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkUnread = async () => {
      try {
        const notifs = await userService.getNotifications();
        setHasUnread(notifs.some(n => !n.read && !n.is_read));
      } catch (err) {}
    };
    checkUnread();
    const interval = setInterval(checkUnread, 30000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  const navItems = [
    { path: '/student/home', label: 'Home', icon: Home },
    { path: '/student/orders', label: 'My Orders', icon: ClipboardList },
    { path: '/student/subscription', label: 'Meal Pass', icon: Ticket },
    { path: '/student/notifications', label: 'Notifications', icon: Bell },
    { path: '/student/profile', label: 'Profile', icon: User },
  ];

  const getPageTitle = () => {
    if (location.pathname.includes('home')) return `Good Morning, ${user?.name?.split(' ')[0] || 'Student'} 👋`;
    if (location.pathname.includes('orders')) return 'My Orders';
    if (location.pathname.includes('subscription')) return 'Meal Pass';
    if (location.pathname.includes('notifications')) return 'Notifications';
    if (location.pathname.includes('profile')) return 'Profile';
    if (location.pathname.includes('browse')) return 'Browse Messes';
    if (location.pathname.includes('mess')) return 'Mess Details';
    if (location.pathname.includes('order')) return 'Checkout';
    return 'Student Portal';
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-[240px] fixed top-0 left-0 h-screen bg-surface border-r border-outline-variant z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-primary-dark" />
          </div>
          <div>
            <div className="text-headline-md font-extrabold text-primary-dark tracking-tight leading-none">MessMate</div>
            <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mt-1">Student Portal</div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-colors w-full text-left",
                  isActive 
                    ? "bg-primary-container text-primary-dark" 
                    : "text-on-surface-variant hover:bg-surface-container"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-outline-variant">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-error hover:bg-error-container transition-colors w-full border border-error/30"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-[240px] flex flex-col min-h-screen relative overflow-hidden">
        
        {/* DESKTOP HEADER */}
        <header className="hidden md:flex items-center justify-between h-20 px-8 bg-background border-b border-outline-variant sticky top-0 z-40">
          <h1 className="text-headline-lg font-extrabold text-on-surface">{getPageTitle()}</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => navigate('/student/notifications')}
              className="w-10 h-10 rounded-full bg-surface border border-outline-variant flex items-center justify-center relative hover:bg-surface-container transition-colors"
            >
              <Bell className="w-5 h-5 text-on-surface" />
              {hasUnread && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface animate-pulse"></div>}
            </button>
          </div>
        </header>

        {/* MOBILE CONTAINER (maintains 480px width logic on mobile implicitly via the components, but removing wrappers) */}
        <div className="flex-1 w-full md:px-8 md:py-8 pb-24 md:pb-8 bg-background">
          <Outlet />
        </div>
        
      </main>
    </div>
  );
};
