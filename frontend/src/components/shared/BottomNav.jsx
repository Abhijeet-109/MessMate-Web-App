import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, CreditCard, User, LayoutDashboard, UtensilsCrossed, Clock, Users, Receipt, X, MoreHorizontal, Settings } from 'lucide-react';
import { clsx } from 'clsx';

export const BottomNav = ({ variant = 'student' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const studentItems = [
    { label: 'Home', icon: Home, path: '/student/home' },
    { label: 'Orders', icon: ClipboardList, path: '/student/orders' },
    { label: 'Pass', icon: CreditCard, path: '/student/subscription' },
    { label: 'Profile', icon: User, path: '/student/profile' },
  ];

  // Primary 4 items shown in the bottom bar
  const adminPrimaryItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Queue', icon: ClipboardList, path: '/admin/orders' },
    { label: 'Menu', icon: UtensilsCrossed, path: '/admin/menu' },
    { label: 'More', icon: MoreHorizontal, path: '__more__' },
  ];

  // Overflow items shown in the "More" drawer
  const adminMoreItems = [
    { label: 'Slots', icon: Clock, path: '/admin/slots' },
    { label: 'Plans', icon: CreditCard, path: '/admin/plans' },
    { label: 'Billing', icon: Receipt, path: '/admin/billing' },
    { label: 'Subscribers', icon: Users, path: '/admin/subscribers' },
    { label: 'Profile', icon: User, path: '/admin/profile' },
  ];

  const items = variant === 'student' ? studentItems : adminPrimaryItems;

  // Check if a "more" page is currently active
  const isMorePageActive = variant === 'admin' && adminMoreItems.some(m => location.pathname.startsWith(m.path));

  const handleNavClick = (item) => {
    if (item.path === '__more__') {
      setShowMore(!showMore);
    } else {
      setShowMore(false);
      navigate(item.path);
    }
  };

  const handleMoreItemClick = (item) => {
    setShowMore(false);
    navigate(item.path);
  };

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && variant === 'admin' && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setShowMore(false)} />
          <div className="fixed bottom-16 left-0 right-0 w-full md:hidden bg-surface rounded-t-2xl shadow-xl z-50 border-t border-outline-variant animate-slide-up">
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-outline-variant">
              <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">More Options</span>
              <button onClick={() => setShowMore(false)} className="p-1 rounded-full hover:bg-surface-container">
                <X className="w-4 h-4 text-on-surface-variant" />
              </button>
            </div>
            <nav className="grid grid-cols-3 gap-1 p-3">
              {adminMoreItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleMoreItemClick(item)}
                    className={clsx(
                      "flex flex-col items-center justify-center py-3 rounded-xl gap-1.5 transition-colors",
                      isActive ? "bg-primary-container" : "hover:bg-surface-container"
                    )}
                  >
                    <Icon className={clsx("w-5 h-5", isActive ? "text-primary-dark" : "text-outline")} strokeWidth={isActive ? 2.5 : 2} />
                    <span className={clsx("text-[11px] font-semibold", isActive ? "text-primary-dark" : "text-outline")}>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </>
      )}

      {/* Bottom Navigation Bar */}
      <nav className={clsx(
        "fixed bottom-0 left-0 right-0 w-full md:hidden bg-surface border-t border-outline-variant pb-safe z-50 flex justify-around h-16"
      )}>
        {items.map((item) => {
          let isActive;
          if (item.path === '__more__') {
            isActive = isMorePageActive || showMore;
          } else {
            isActive = location.pathname.startsWith(item.path);
          }
          const Icon = item.icon;
          
          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className="flex flex-col items-center justify-center w-16 h-full gap-1"
            >
              <div className={clsx("p-1 rounded-full transition-colors", isActive ? "bg-primary-container" : "")}>
                <Icon 
                  className={clsx("w-6 h-6", isActive ? "text-primary-dark" : "text-outline")} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className={clsx("text-[10px] font-semibold", isActive ? "text-primary-dark" : "text-outline")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
