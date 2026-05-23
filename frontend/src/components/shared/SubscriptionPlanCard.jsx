import React from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

export const SubscriptionPlanCard = ({ plan, onSubscribe }) => {
  return (
    <div className={clsx(
      "bg-surface rounded-xl p-5 shadow-card border-2 relative overflow-hidden",
      plan.isRecommended ? "border-primary" : "border-outline-variant"
    )}>
      {plan.isRecommended && (
        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wide">
          Recommended
        </div>
      )}
      
      <h3 className="text-headline-md font-bold text-on-surface">{plan.name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-headline-xl font-extrabold text-primary-dark">₹{plan.price}</span>
        <span className="text-body-md text-on-surface-variant">/month</span>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="bg-success/20 p-0.5 rounded-full"><Check className="w-4 h-4 text-success" /></div>
          <span className="text-body-md text-on-surface">{plan.meals} Meals Total</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-success/20 p-0.5 rounded-full"><Check className="w-4 h-4 text-success" /></div>
          <span className="text-body-md text-on-surface">Valid for: {plan.types.join(' & ')}</span>
        </div>
      </div>

      <button 
        onClick={() => onSubscribe(plan)}
        className={clsx(
          "w-full mt-6 py-3 rounded-pill font-bold transition-transform active:scale-95",
          plan.isRecommended ? "bg-primary text-white" : "bg-primary-container text-primary-dark"
        )}
      >
        Subscribe Now
      </button>
    </div>
  );
};
