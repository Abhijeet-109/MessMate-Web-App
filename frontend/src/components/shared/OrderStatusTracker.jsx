import React from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

export const OrderStatusTracker = ({ currentStatus }) => {
  const steps = ['Placed', 'Accepted', 'Preparing', 'Ready'];
  const currentIndex = steps.indexOf(currentStatus) >= 0 ? steps.indexOf(currentStatus) : 0;

  return (
    <div className="flex items-center justify-between w-full px-2 mt-4 relative">
      <div className="absolute top-1/2 left-6 right-6 h-[2px] bg-outline-variant -z-10 -translate-y-1/2"></div>
      
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isActive = index === currentIndex;

        return (
          <div key={step} className="flex flex-col items-center gap-2 bg-surface">
            <div 
              className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center border-2",
                isCompleted ? "bg-success border-success text-white" : "bg-surface border-outline-variant text-transparent"
              )}
            >
              {isCompleted && <Check className="w-4 h-4" strokeWidth={3} />}
            </div>
            <span className={clsx(
              "text-[10px] font-bold uppercase tracking-wider",
              isActive ? "text-on-surface" : "text-outline"
            )}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
};
