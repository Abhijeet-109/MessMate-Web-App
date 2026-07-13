import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Plus, Minus, Info } from 'lucide-react';

const PreOrderStep1 = () => {
  const navigate = useNavigate();
  const { currentOrder, updateItems } = useOrder();
  const { user } = useAuth();
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    if (!currentOrder) {
      navigate('/student/browse');
    }
  }, [currentOrder, navigate]);

  if (!currentOrder) return null;

  const isSubscriber = user?.mess_id === currentOrder?.mess?.id;

  const mealType = currentOrder.slot?.mealType || 'lunch';
  const menuItems = currentOrder.mess?.menu?.[mealType] || [];

  const handleIncrement = (item) => {
    setQuantities(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
  };

  const handleDecrement = (item) => {
    setQuantities(prev => {
      const current = prev[item.id] || 0;
      if (current <= 0) return prev;
      return { ...prev, [item.id]: current - 1 };
    });
  };

  const handleContinue = () => {
    const selectedItems = menuItems
      .filter(item => quantities[item.id] > 0)
      .map(item => ({ ...item, quantity: quantities[item.id] }));
    
    updateItems(selectedItems);
    navigate('/student/order/step2');
  };

  const totalSelected = Object.values(quantities).reduce((a, b) => a + b, 0);

  return (
    <div className="flex-1 flex flex-col bg-background relative pb-24 md:pb-0">
      <header className="px-6 pt-12 pb-4 bg-surface shadow-sm z-10 flex items-center gap-4 border-b border-outline-variant">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-surface-container">
          <ArrowLeft className="w-6 h-6 text-on-surface" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-headline-md font-extrabold text-on-surface">Step 1: Build Meal</h1>
          <span className="text-label-md text-primary">{currentOrder.mess.name} • {currentOrder.slot?.time || currentOrder.slot} ({mealType})</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto py-6">
        <div className="max-w-2xl mx-auto px-6 w-full flex flex-col gap-4">
          {isSubscriber && (
            <div className="bg-primary-container/30 px-4 py-3 rounded-xl border border-primary-container flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-body-md text-primary-dark">
                Since you have an active Subscription Pass for this mess, your standard Thali is already covered. You can add extras here.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4 mt-2">
            {menuItems.map(item => (
              <div key={item.id} className="bg-surface p-4 rounded-xl shadow-sm border border-outline-variant flex justify-between items-center">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm border ${item.type === 'veg' ? 'border-success bg-success/20' : 'border-error bg-error/20'} flex items-center justify-center`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.type === 'veg' ? 'bg-success' : 'bg-error'}`}></div>
                    </div>
                    <span className="font-bold text-on-surface">{item.name}</span>
                  </div>
                  <span className="text-body-md text-primary-dark font-bold mt-1">₹{item.price}</span>
                </div>
                
                {item.isAvailable ? (
                  <div className="flex items-center bg-surface-container rounded-pill border border-outline-variant overflow-hidden">
                    <button 
                      onClick={() => handleDecrement(item)}
                      className="p-2 text-on-surface hover:bg-outline-variant/20 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-bold text-body-md">{quantities[item.id] || 0}</span>
                    <button 
                      onClick={() => handleIncrement(item)}
                      className="p-2 text-primary-dark hover:bg-primary-container transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-label-md text-error bg-error-container px-2 py-1 rounded-md">Sold Out</span>
                )}
              </div>
            ))}
          </div>

          {/* Desktop CTA Button (In-flow and full width within max-w-2xl) */}
          <div className="hidden md:block mt-6">
            <button 
              disabled={totalSelected === 0}
              onClick={handleContinue}
              className="w-full bg-primary text-white py-4 rounded-pill font-bold text-lg shadow-card disabled:opacity-50 disabled:bg-outline transition-transform active:scale-[0.98]"
            >
              {totalSelected > 0 ? `Review Order (${totalSelected} items)` : 'Select Items to Continue'}
            </button>
          </div>
        </div>
      </main>

      {/* Floating Action Button — Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-4 bg-surface border-t border-outline-variant z-50 md:hidden">
        <button 
          disabled={totalSelected === 0}
          onClick={handleContinue}
          className="w-full bg-primary text-white py-4 rounded-pill font-bold text-lg shadow-card disabled:opacity-50 disabled:bg-outline transition-transform active:scale-[0.98]"
        >
          {totalSelected > 0 ? `Review Order (${totalSelected} items)` : 'Select Items to Continue'}
        </button>
      </div>
    </div>
  );
};

export default PreOrderStep1;
