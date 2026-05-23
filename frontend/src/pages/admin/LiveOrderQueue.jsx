import React, { useState, useEffect, useCallback } from 'react';
import { orderService, adminService } from '../../services/api';
import { BottomNav } from '../../components/shared/BottomNav';
import { Filter, CheckCircle, XCircle, ChefHat, Clock, RefreshCw, AlertTriangle, Wallet } from 'lucide-react';
import ThemeToggle from '../../components/shared/ThemeToggle';

const STATUS_FLOW = {
  Placed:    { next: 'Accepted',  label: 'Accept',     icon: ChefHat,     color: 'bg-primary text-white' },
  Accepted:  { next: 'Preparing', label: 'Start Prep', icon: ChefHat,     color: 'bg-primary text-white' },
  Preparing: { next: 'Ready',     label: 'Mark Ready', icon: CheckCircle, color: 'bg-success text-white' },
  Ready:     { next: 'Completed', label: 'Complete',   icon: CheckCircle, color: 'bg-success text-white' },
};

const LiveOrderQueue = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchOrders = useCallback(async () => {
    try {
      const data = await orderService.getAdminOrders();
      // Only show active orders (not Completed/Cancelled)
      setOrders(data.filter(o => !['Completed', 'Cancelled', 'No-show'].includes(o.status)));
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await orderService.updateOrderStatus(id, newStatus);
      if (['Completed', 'Cancelled', 'No-show'].includes(newStatus)) {
        setOrders(prev => prev.filter(o => o.id !== id));
      } else {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      }
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id) => {
    try {
      await orderService.updateOrderStatus(id, 'Cancelled');
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleCollectAndComplete = async (id) => {
    try {
      // Collect payment first (creates billing entry), then mark Completed
      await adminService.collectPostpaidPayment(id);
      await orderService.updateOrderStatus(id, 'Completed');
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) { console.error(err); }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const placedCount = orders.filter(o => o.status === 'Placed').length;
  const preparingCount = orders.filter(o => ['Preparing', 'Accepted'].includes(o.status)).length;
  const readyCount = orders.filter(o => o.status === 'Ready').length;

  // Postpaid tracking
  const postpaidPending = orders.filter(o =>
    o.paymentMethod === 'Pay on Site' && !['Completed','Cancelled'].includes(o.status)
  );
  const postpaidTotal = postpaidPending.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="flex-1 flex flex-col bg-background pb-20">
      <header className="px-6 pt-12 pb-4 bg-surface shadow-sm z-10 border-b border-outline-variant flex justify-between items-center">
        <div>
          <h1 className="text-headline-lg font-extrabold text-on-surface">Live Queue</h1>
          <p className="text-label-md text-on-surface-variant mt-0.5">{orders.length} active orders</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={fetchOrders} className="p-2 rounded-full hover:bg-surface-container text-on-surface">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Status tabs */}
      <div className="px-6 py-3 bg-surface border-b border-outline-variant flex gap-3 overflow-x-auto no-scrollbar">
        {[
          { key: 'all', label: 'All', count: orders.length },
          { key: 'Placed', label: 'New', count: placedCount },
          { key: 'Preparing', label: 'Preparing', count: preparingCount },
          { key: 'Ready', label: 'Ready', count: readyCount },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-pill text-label-md font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filter === tab.key ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              filter === tab.key ? 'bg-white/20' : 'bg-outline/10'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Postpaid pending banner */}
      {postpaidTotal > 0 && (
        <div className="mx-6 mt-3 px-4 py-3 bg-warning/10 border border-warning/30 rounded-xl flex justify-between items-center">
          <span className="text-label-md font-bold text-warning">⚠ Postpaid Pending ({postpaidPending.length} orders)</span>
          <span className="font-extrabold text-warning">₹{postpaidTotal}</span>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-container py-12 rounded-xl text-center text-on-surface-variant text-body-md border border-outline-variant border-dashed">
            {filter === 'all' ? 'No active orders right now' : `No ${filter.toLowerCase()} orders`}
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6">
            {filtered.map(order => {
              const flow = STATUS_FLOW[order.status];
              return (
                <div key={order.id} className="bg-surface rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-label-md font-mono text-on-surface-variant">#{order.id}</span>
                      <h3 className="font-bold text-on-surface">{order.studentName || 'Student'}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'Placed' ? 'bg-warning/20 text-warning' :
                      order.status === 'Preparing' || order.status === 'Accepted' ? 'bg-primary/20 text-primary' :
                      'bg-success/20 text-success'
                    }`}>{order.status}</span>
                  </div>
                  {/* Items */}
                  <div className="bg-surface-container rounded-lg p-3 text-body-md text-on-surface">
                    {order.items?.length > 0 ? order.items.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="text-on-surface-variant">₹{item.price * item.quantity}</span>
                      </div>
                    )) : <p className="text-sm italic text-on-surface-variant">No items found</p>}
                  </div>
                  {/* Meta */}
                  <div className="flex items-center gap-3 flex-wrap text-label-md text-on-surface-variant">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {order.slotTime || order.slot_time}</span>
                    <span className="capitalize">{order.mealType || order.meal_type}</span>
                    <span className="capitalize">{order.orderType || order.order_type}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      (order.paymentMethod === 'Pay on Site') 
                        ? 'bg-warning/20 text-warning' 
                        : 'bg-success/20 text-success'
                    }`}>
                      {order.paymentMethod === 'Pay on Site' ? '💰 Postpaid' : '✅ Prepaid'}
                    </span>
                    <span className="ml-auto font-bold text-on-surface">₹{order.total}</span>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-outline-variant">
                    {order.status === 'Placed' && (
                      <button
                        onClick={() => handleReject(order.id)}
                        className="flex-1 py-2.5 rounded-pill font-bold text-label-md border-2 border-error text-error hover:bg-error/10 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    )}
                    {/* No-show button for ALL active subscription orders */}
                    {['Placed','Accepted','Preparing','Ready'].includes(order.status) && order.paymentMethod === 'Subscription' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'No-show')}
                        className="flex-1 py-2.5 rounded-pill font-bold text-label-md border-2 border-warning text-warning hover:bg-warning/10 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <AlertTriangle className="w-4 h-4" /> No-show
                      </button>
                    )}
                    {/* Postpaid Ready → "Collect & Complete" button */}
                    {order.paymentMethod === 'Pay on Site' && order.status === 'Ready' ? (
                      <button
                        onClick={() => handleCollectAndComplete(order.id)}
                        className="flex-1 py-2.5 rounded-pill font-bold text-label-md bg-warning text-white hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Wallet className="w-4 h-4" /> Collect ₹{order.total} & Complete
                      </button>
                    ) : flow && (
                      <button
                        onClick={() => handleStatusChange(order.id, flow.next)}
                        className={`flex-1 py-2.5 rounded-pill font-bold text-label-md ${flow.color} hover:opacity-90 transition-all flex items-center justify-center gap-1.5`}
                      >
                        <flow.icon className="w-4 h-4" /> {flow.label}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav variant="admin" />
    </div>
  );
};

export default LiveOrderQueue;
