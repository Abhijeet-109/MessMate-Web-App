import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, UtensilsCrossed, Settings, Users, Receipt, UserCircle, LogOut, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';

export const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Queue', path: '/admin/orders', icon: ListOrdered },
    { name: 'Menu', path: '/admin/menu', icon: UtensilsCrossed },
    { name: 'Slots', path: '/admin/slots', icon: Settings },
    { name: 'Subscribers', path: '/admin/subscribers', icon: Users },
    { name: 'Plans', path: '/admin/plans', icon: CreditCard },
    { name: 'Billing', path: '/admin/billing', icon: Receipt },
    { name: 'Profile', path: '/admin/profile', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex relative">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-surface border-r border-outline-variant shadow-lg z-20">
        <div className="p-6 border-b border-outline-variant">
          <h1 className="text-headline-lg font-extrabold text-primary">MessMate</h1>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider mt-1">Owner Portal</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold",
                isActive
                  ? "bg-primary-container text-primary-dark"
                  : "text-on-surface hover:bg-surface-container"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-outline-variant">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-error w-full hover:bg-error-container"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen bg-background relative overflow-hidden">
        <div className="w-full flex-1 flex flex-col md:px-8 md:py-8 pb-24 md:pb-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
