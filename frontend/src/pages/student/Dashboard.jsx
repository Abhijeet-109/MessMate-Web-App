import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderService, messService, userService } from '../../services/api';
import { BottomNav } from '../../components/shared/BottomNav';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { OrderCardStudent } from '../../components/shared/OrderCard';
import { MessCard } from '../../components/shared/MessCard';
import { MapPin, Search, Bell, Clock, Ticket } from 'lucide-react';
import { StatusBadge } from '../../components/shared/StatusBadge';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeOrders, setActiveOrders] = useState([]);
  const [messes, setMesses] = useState([]);
  const [subscription, setSubscription] = useState(user?.subscription || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [activeData, messData, subData] = await Promise.all([
          orderService.getActiveOrders(),
          messService.getAllMess(),
          userService.getSubscription(),
        ]);
        setActiveOrders(activeData || []);
        setMesses((messData || []).slice(0, 3));
        setSubscription(subData);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-background pb-20 relative">
      {/* Mobile-only greeting header */}
      <header className="px-6 pt-8 pb-4 bg-surface rounded-b-3xl shadow-sm z-10 relative md:hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center font-bold text-primary-dark text-xl">
              {user?.name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-body-md text-on-surface-variant">Good Morning,</span>
              <span className="text-headline-md font-bold text-on-surface">{user?.name.split(' ')[0]}! 👋</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => navigate('/student/notifications')} className="p-2 rounded-full hover:bg-surface-container relative">
              <Bell className="w-6 h-6 text-on-surface" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
            </button>
          </div>
        </div>

      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">
        
        {/* Quick Search */}
        <div 
          onClick={() => navigate('/student/browse')}
          className="bg-surface p-4 rounded-xl shadow-sm border border-outline-variant flex items-center gap-3 cursor-pointer hover:border-primary transition-colors"
        >
          <Search className="w-5 h-5 text-outline" />
          <span className="text-body-lg text-on-surface-variant">Find a mess near MIT College...</span>
        </div>

        {/* Desktop: 2-column top-aligned layout | Mobile: single column */}
        <div className="flex flex-col md:grid md:grid-cols-2 md:items-start gap-6">

          {/* LEFT COLUMN: Meal Pass card + Browse Messes (desktop), stacked naturally */}
          <div className="flex flex-col gap-6">

            {/* Meal Pass Card */}
            <section className="flex flex-col gap-4">
              <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" /> Active Meal Pass
              </h2>
              {subscription?.isActive ? (
                <div className="bg-gradient-to-r from-primary to-[#F69E52] px-6 py-4 rounded-[24px] shadow-card text-white flex justify-between items-center relative overflow-hidden h-[120px]">
                  <div className="absolute right-0 top-0 bottom-0 w-48 bg-white/10 skew-x-12 translate-x-12"></div>
                  <div className="flex flex-col z-10">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-white/80 mb-1">{subscription.messName || subscription.planName}</span>
                    <span className="text-[48px] font-extrabold leading-none">{subscription.mealsRemaining}</span>
                    <span className="text-body-md text-white/90 mt-1">Meals Remaining</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/student/mess/${subscription.messId}`)}
                    className="z-10 bg-white text-primary font-bold px-6 py-3 rounded-pill shadow-sm hover:scale-105 transition-transform"
                  >
                    Order Now
                  </button>
                </div>
              ) : (
                <div className="bg-surface-container border-2 border-outline-variant border-dashed px-6 py-4 rounded-[24px] flex flex-col items-center justify-center gap-2 text-center h-[120px]">
                  <span className="text-body-md font-bold text-on-surface-variant">No Active Pass</span>
                  <button onClick={() => navigate('/student/subscription')} className="text-white bg-primary font-bold px-6 py-2 rounded-pill border-2 border-primary">Buy a Pass</button>
                </div>
              )}
            </section>

            {/* Browse Messes — shown in left column on desktop only */}
            <section className="hidden md:flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
                  <Search className="w-5 h-5 text-secondary" /> Browse Messes
                </h2>
                <button onClick={() => navigate('/student/browse')} className="text-primary font-bold text-label-md uppercase tracking-wider">See All</button>
              </div>
              <div className="flex flex-col gap-4">
                {messes.map(mess => (
                  <MessCard key={mess.id} mess={mess} onClick={() => navigate(`/student/mess/${mess.id}`)} />
                ))}
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: Active Orders */}
          <section className="flex flex-col gap-4">
            <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" /> Active Order
            </h2>
            {activeOrders.length > 0 ? (
              activeOrders.map(order => (
                <OrderCardStudent key={order.id} order={order} onClick={() => navigate('/student/orders')} />
              ))
            ) : (
              <div className="bg-surface border-2 border-outline-variant border-dashed p-6 rounded-[24px] flex flex-col items-center justify-center gap-2 text-center min-h-[120px]">
                <span className="text-body-md font-bold text-on-surface-variant">No active orders</span>
              </div>
            )}
          </section>

        </div>

        {/* Browse Messes — mobile only (shown inline on desktop inside left column above) */}
        <section className="flex md:hidden flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
              <Search className="w-5 h-5 text-secondary" /> Browse Messes
            </h2>
            <button onClick={() => navigate('/student/browse')} className="text-primary font-bold text-label-md uppercase tracking-wider">See All</button>
          </div>
          <div className="flex flex-col gap-4">
            {messes.map(mess => (
              <MessCard key={mess.id} mess={mess} onClick={() => navigate(`/student/mess/${mess.id}`)} />
            ))}
          </div>
        </section>

      </main>

      <BottomNav variant="student" />
    </div>
  );
};

export default Dashboard;
