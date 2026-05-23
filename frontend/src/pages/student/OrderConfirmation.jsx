import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext';
import { Check, CalendarDays, MapPin } from 'lucide-react';
import { BottomNav } from '../../components/shared/BottomNav';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { currentOrder, clearOrder } = useOrder();

  useEffect(() => {
    if (!currentOrder) {
      navigate('/student/home');
    }
    
    // Clear order context when leaving this page
    return () => clearOrder();
  }, [currentOrder, navigate, clearOrder]);

  if (!currentOrder) return null;

  return (
    <div className="flex-1 flex flex-col bg-primary px-6 pt-16 pb-20 overflow-y-auto items-center">
      
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce-short">
        <Check className="w-12 h-12 text-success" strokeWidth={3} />
      </div>

      <h1 className="text-headline-xl font-extrabold text-white text-center mb-2">Order Confirmed!</h1>
      <p className="text-body-lg text-primary-container text-center mb-8">
        Your food is being prepared. Wait time is approx. 5 mins.
      </p>

      <div className="bg-surface w-full rounded-2xl p-6 shadow-card flex flex-col gap-4 relative mt-4">
        {/* Ticket notch top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-primary rounded-full"></div>
        
        <div className="text-center border-b border-outline-variant border-dashed pb-4 mb-2">
          <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Order Number</span>
          <h2 className="text-[32px] font-extrabold text-primary-dark leading-none mt-1">#MM-8892</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary-dark" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-on-surface text-body-lg">{currentOrder.mess.name}</span>
              <span className="text-body-md text-on-surface-variant">{currentOrder.orderType}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-on-surface text-body-lg">Today, {currentOrder.slot?.time || currentOrder.slot}</span>
              <span className="text-body-md text-on-surface-variant">Arrive 5 mins before</span>
            </div>
          </div>
        </div>

      </div>

      <button 
        onClick={() => navigate('/student/orders')}
        className="w-full bg-white text-primary font-bold py-4 rounded-pill shadow-card mt-8 hover:scale-[1.02] transition-transform"
      >
        Track Order
      </button>

    </div>
  );
};

export default OrderConfirmation;
