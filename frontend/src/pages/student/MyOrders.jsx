import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/api';
import { OrderCardStudent } from '../../components/shared/OrderCard';
import { EmptyState } from '../../components/shared/EmptyState';
import { BottomNav } from '../../components/shared/BottomNav';
import { useNavigate } from 'react-router-dom';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active'); // active, past
  const navigate = useNavigate();

  useEffect(() => {
    orderService.getStudentOrders().then(data => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const activeOrders = orders.filter(o => ['Placed', 'Accepted', 'Preparing', 'Ready'].includes(o.status));
  const pastOrders = orders.filter(o => !['Placed', 'Accepted', 'Preparing', 'Ready'].includes(o.status));

  const displayOrders = tab === 'active' ? activeOrders : pastOrders;

  return (
    <div className="flex-1 flex flex-col bg-background pb-20">
      <header className="px-6 pt-12 md:pt-0 pb-4 md:pb-2 bg-surface md:bg-transparent shadow-sm md:shadow-none z-10 border-b border-outline-variant md:border-none">
        <h1 className="text-headline-lg font-extrabold text-on-surface mb-4 md:hidden">My Orders</h1>
        
        <div className="flex bg-surface-container rounded-pill p-1 relative">
          <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white shadow-sm rounded-pill transition-transform duration-300 ${tab === 'past' ? 'translate-x-full left-1' : 'left-1'}`}></div>
          <button 
            className={`flex-1 py-2 rounded-pill text-body-md font-bold transition-colors relative z-10 ${tab === 'active' ? 'text-primary-dark' : 'text-on-surface-variant'}`}
            onClick={() => setTab('active')}
          >
            Active
          </button>
          <button 
            className={`flex-1 py-2 rounded-pill text-body-md font-bold transition-colors relative z-10 ${tab === 'past' ? 'text-primary-dark' : 'text-on-surface-variant'}`}
            onClick={() => setTab('past')}
          >
            Past History
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
        ) : displayOrders.length === 0 ? (
          <EmptyState 
            illustration="no-orders" 
            title={tab === 'active' ? "No active orders" : "No past orders"} 
            subtitle="You don't have any orders here." 
            ctaLabel={tab === 'active' ? "Order Now" : undefined}
            onCta={() => navigate('/student/browse')}
          />
        ) : (
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6 w-full">
            {displayOrders.map(order => (
              <OrderCardStudent key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>

      <BottomNav variant="student" />
    </div>
  );
};

export default MyOrders;
