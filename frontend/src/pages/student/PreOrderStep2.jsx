import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Edit2, UtensilsCrossed, Clock, Receipt } from 'lucide-react';

const PreOrderStep2 = () => {
  const navigate = useNavigate();
  const { currentOrder } = useOrder();
  const { user } = useAuth();

  useEffect(() => {
    if (!currentOrder) {
      navigate('/student/browse');
    }
  }, [currentOrder, navigate]);

  if (!currentOrder) return null;

  const isSubscriber = user?.mess_id === currentOrder?.mess?.id;

  return (
    <div className="flex-1 flex flex-col bg-background relative pb-24 md:pb-0">
      <header className="px-6 pt-12 pb-4 bg-surface shadow-sm z-10 flex items-center gap-4 border-b border-outline-variant">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-surface-container">
          <ArrowLeft className="w-6 h-6 text-on-surface" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-headline-md font-extrabold text-on-surface">Step 2: Review</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto py-6">
        <div className="max-w-2xl mx-auto px-6 w-full flex flex-col gap-6">
          {/* Order Details Card */}
          <div className="bg-surface p-5 rounded-xl shadow-card border border-outline-variant flex flex-col gap-4">
            <div className="flex justify-between items-start border-b border-outline-variant pb-4">
              <div className="flex flex-col">
                <span className="font-bold text-headline-md text-on-surface">{currentOrder.mess.name}</span>
                <span className="text-body-md text-on-surface-variant">MIT College Road</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-label-md text-on-surface-variant uppercase">Time Slot</span>
                  <span className="font-bold text-on-surface text-body-md">{currentOrder.slot?.time || currentOrder.slot}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-label-md text-on-surface-variant uppercase">Type</span>
                  <span className="font-bold text-on-surface text-body-md">{currentOrder.orderType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="bg-surface p-5 rounded-xl shadow-card border border-outline-variant flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-on-surface flex items-center gap-2"><Receipt className="w-4 h-4"/> Order Summary</h3>
              <button onClick={() => navigate(-1)} className="text-primary flex items-center gap-1 text-label-md font-bold">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {isSubscriber && (
                <div className="flex justify-between items-start text-body-md">
                  <span className="text-on-surface">Standard Subscription Thali <span className="text-success font-bold">(Paid via Pass)</span></span>
                  <span className="font-bold text-on-surface">1x</span>
                </div>
              )}
              
              {currentOrder.items.map(item => (
                <div key={item.id} className="flex justify-between items-start text-body-md">
                  <span className="text-on-surface">{item.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-on-surface-variant">{item.quantity}x</span>
                    <span className="font-bold text-on-surface w-12 text-right">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-outline-variant mt-2 pt-3 flex justify-between items-center">
              <span className="font-bold text-headline-md text-on-surface">Extra Total</span>
              <span className="font-extrabold text-headline-xl text-primary-dark">₹{currentOrder.total}</span>
            </div>
          </div>

          {/* Desktop CTA Button (In-flow and full width within max-w-2xl) */}
          <div className="hidden md:block mt-2">
            <button 
              onClick={() => navigate('/student/order/step3')}
              className="w-full bg-primary text-white py-4 rounded-pill font-bold text-lg shadow-card hover:bg-primary-dark transition-transform active:scale-[0.98]"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </main>

      {/* Floating Action Button — Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-4 bg-surface border-t border-outline-variant z-50 md:hidden">
        <button 
          onClick={() => navigate('/student/order/step3')}
          className="w-full bg-primary text-white py-4 rounded-pill font-bold text-lg shadow-card hover:bg-primary-dark transition-transform active:scale-[0.98]"
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default PreOrderStep2;
