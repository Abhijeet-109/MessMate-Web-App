import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/api';
import { BottomNav } from '../../components/shared/BottomNav';
import { Users, UtensilsCrossed, TrendingUp, Settings, Edit2, Star, Clock, Power } from 'lucide-react';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const PERIOD_MAP = { 'Today': 'today', 'This Week': 'week', 'This Month': 'month' };
const PIE_COLORS = ['#F5A623', '#E8752A', '#FCD34D'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('This Month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [messName, setMessName] = useState('');

  const fetchDashboard = async (period) => {
    try {
      const d = await adminService.getDashboard(period);
      setData(d);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard(PERIOD_MAP[dateRange]);
  }, [dateRange]);

  // Fetch mess profile for isOpen status
  useEffect(() => {
    adminService.getMessProfile().then(m => {
      setIsLive(!!m.is_open);
      if (m.name) setMessName(m.name);
    }).catch(() => {});
  }, []);

  const toggleLive = async () => {
    setToggling(true);
    try {
      await adminService.updateMessProfile({ isOpen: !isLive });
      setIsLive(!isLive);
    } catch (err) { console.error(err); }
    setToggling(false);
  };

  // Derived chart data
  const mealTypeData = data?.mealTypeStats?.map((m, i) => ({
    name: m.meal_type?.charAt(0).toUpperCase() + m.meal_type?.slice(1),
    value: Number(m.count),
    color: PIE_COLORS[i % PIE_COLORS.length]
  })) || [];

  const totalOrders = mealTypeData.reduce((s, m) => s + m.value, 0);

  const revenueTrend = data?.revenueTrend?.map(r => ({
    date: new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    revenue: r.revenue
  })) || [];

  return (
    <div className="flex-1 flex flex-col bg-background pb-20 md:pb-8 relative overflow-x-hidden">
      
      <header className="px-6 pt-12 pb-8 bg-surface rounded-b-3xl shadow-sm z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center font-bold text-white text-2xl shadow-md">
              {messName ? messName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '...'}
            </div>
            <div className="flex flex-col">
              <span className="text-body-md text-on-surface-variant uppercase tracking-wider font-bold">Owner Dashboard</span>
              <span className="text-headline-lg font-extrabold text-on-surface leading-tight">{messName || 'Loading...'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={toggleLive}
              disabled={toggling}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-label-md font-bold transition-colors ${
                isLive ? 'bg-success/20 text-success hover:bg-success/30' : 'bg-error/20 text-error hover:bg-error/30'
              }`}
            >
              <Power className="w-4 h-4" />
              {isLive ? 'Live' : 'Offline'}
            </button>
          </div>
        </div>
        <p className="text-body-md text-on-surface-variant flex items-center gap-1.5 font-medium">
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-success' : 'bg-error'}`}></span>
          {isLive ? 'Taking live orders now' : 'Not accepting orders'}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8 no-scrollbar">
        
        {/* QUICK ACTIONS */}
        <section>
          <h2 className="text-label-md font-bold text-outline uppercase tracking-wider mb-3 px-1">Quick Actions</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar md:grid md:grid-cols-4 md:overflow-visible pb-2">
            <button onClick={() => navigate('/admin/orders')} className="flex-shrink-0 w-[140px] md:w-full bg-surface p-4 rounded-xl shadow-sm border border-outline-variant flex flex-col gap-3 items-start hover:border-primary hover:shadow-md transition-all group">
              <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors"><UtensilsCrossed className="w-5 h-5 text-primary-dark" /></div>
              <span className="font-bold text-on-surface text-left">Live Queue</span>
            </button>
            <button onClick={() => navigate('/admin/menu')} className="flex-shrink-0 w-[140px] md:w-full bg-surface p-4 rounded-xl shadow-sm border border-outline-variant flex flex-col gap-3 items-start hover:border-primary hover:shadow-md transition-all group">
              <div className="bg-secondary/10 p-2 rounded-lg group-hover:bg-secondary/20 transition-colors"><Edit2 className="w-5 h-5 text-secondary" /></div>
              <span className="font-bold text-on-surface text-left">Update Menu</span>
            </button>
            <button onClick={() => navigate('/admin/slots')} className="flex-shrink-0 w-[140px] md:w-full bg-surface p-4 rounded-xl shadow-sm border border-outline-variant flex flex-col gap-3 items-start hover:border-primary hover:shadow-md transition-all group">
              <div className="bg-warning/10 p-2 rounded-lg group-hover:bg-warning/20 transition-colors"><Settings className="w-5 h-5 text-warning" /></div>
              <span className="font-bold text-on-surface text-left">Manage Slots</span>
            </button>
            <button onClick={() => navigate('/admin/subscribers')} className="flex-shrink-0 w-[140px] md:w-full bg-surface p-4 rounded-xl shadow-sm border border-outline-variant flex flex-col gap-3 items-start hover:border-primary hover:shadow-md transition-all group">
              <div className="bg-success/10 p-2 rounded-lg group-hover:bg-success/20 transition-colors"><Users className="w-5 h-5 text-success" /></div>
              <span className="font-bold text-on-surface text-left">Subscribers</span>
            </button>
          </div>
        </section>

        {/* ANALYTICS SECTION */}
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
        ) : data && (
          <section className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Analytics & Insights
              </h2>
              <div className="flex items-center gap-2 bg-surface-container p-1 rounded-pill overflow-x-auto no-scrollbar">
                {['Today', 'This Week', 'This Month'].map(range => (
                  <button 
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-1.5 rounded-pill text-[12px] font-bold whitespace-nowrap transition-colors ${dateRange === range ? 'bg-primary shadow-sm text-white' : 'text-on-surface-variant hover:bg-white/50'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* KEY METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface p-4 rounded-2xl shadow-sm border border-outline-variant flex flex-col">
                <span className="text-[12px] uppercase font-bold text-on-surface-variant tracking-wider flex items-center gap-1.5 mb-2"><TrendingUp className="w-3 h-3" /> Revenue</span>
                <span className="text-[24px] font-extrabold text-on-surface leading-none">₹{(data.revenue || 0).toLocaleString()}</span>
                <span className="text-[10px] font-bold text-on-surface-variant mt-1">{dateRange}</span>
              </div>
              <div className="bg-surface p-4 rounded-2xl shadow-sm border border-outline-variant flex flex-col">
                <span className="text-[12px] uppercase font-bold text-on-surface-variant tracking-wider flex items-center gap-1.5 mb-2"><UtensilsCrossed className="w-3 h-3" /> Orders</span>
                <span className="text-[24px] font-extrabold text-on-surface leading-none">{data.orderCount || 0}</span>
                <span className="text-[10px] font-bold text-on-surface-variant mt-1">{dateRange}</span>
              </div>
              <div className="bg-surface p-4 rounded-2xl shadow-sm border border-outline-variant flex flex-col">
                <span className="text-[12px] uppercase font-bold text-on-surface-variant tracking-wider flex items-center gap-1.5 mb-2"><Star className="w-3 h-3" /> Avg Rating</span>
                <span className="text-[24px] font-extrabold text-on-surface leading-none">{data.avgRating?.toFixed(1) || '0'}</span>
                <span className="text-[10px] font-bold text-on-surface-variant mt-1">{data.reviewsCount || 0} reviews</span>
              </div>
              <div className="bg-surface p-4 rounded-2xl shadow-sm border border-outline-variant flex flex-col">
                <span className="text-[12px] uppercase font-bold text-on-surface-variant tracking-wider flex items-center gap-1.5 mb-2"><Users className="w-3 h-3" /> Subscribers</span>
                <span className="text-[24px] font-extrabold text-on-surface leading-none">{data.activeSubscribers || 0}</span>
                <span className="text-[10px] font-bold text-success mt-1">Active</span>
              </div>
            </div>

            {/* CHARTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Revenue Trend */}
              {revenueTrend.length > 0 && (
                <div className="bg-surface p-5 rounded-2xl shadow-sm border border-outline-variant md:col-span-2">
                  <h3 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-6">Revenue Trend (30 days)</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DEC1B3" opacity={0.5} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} minTickGap={20} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(value) => `₹${value}`} domain={[0, 'auto']} allowDecimals={false} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px', backgroundColor: '#1e293b', color: '#f1f5f9' }}
                          labelStyle={{ color: '#9ca3af' }}
                          itemStyle={{ color: '#f1f5f9' }}
                          formatter={v => [`₹${v}`, 'Revenue']}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#E8752A" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#E8752A', stroke: '#fff', strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Orders by Meal Type */}
              {mealTypeData.length > 0 && (
                <div className="bg-surface p-5 rounded-2xl shadow-sm border border-outline-variant">
                  <h3 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-2">Orders by Meal Type</h3>
                  <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={mealTypeData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                          {mealTypeData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                        </Pie>
                        <RechartsTooltip formatter={v => [v, 'Orders']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-headline-md font-extrabold text-on-surface leading-none">{totalOrders}</span>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">Total</span>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {mealTypeData.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold uppercase">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-on-surface">{item.name} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Dishes */}
              {data.topDishes?.length > 0 && (
                <div className="bg-surface p-5 rounded-2xl shadow-sm border border-outline-variant">
                  <h3 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-4">Top Dishes</h3>
                  <div className="flex flex-col gap-3">
                    {data.topDishes.map((dish, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                          <span className="font-semibold text-on-surface">{dish.name}</span>
                        </div>
                        <span className="font-bold text-on-surface-variant">{dish.total_ordered} orders</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <BottomNav variant="admin" />
    </div>
  );
};

export default AdminDashboard;
