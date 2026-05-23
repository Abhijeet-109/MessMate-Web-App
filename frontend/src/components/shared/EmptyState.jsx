import React from 'react';
import { Search, Inbox, UtensilsCrossed, Bell } from 'lucide-react';

export const EmptyState = ({ illustration = 'no-orders', title, subtitle, ctaLabel, onCta }) => {
  
  const getIcon = () => {
    switch(illustration) {
      case 'no-mess': return <Search className="w-16 h-16 text-outline" strokeWidth={1} />;
      case 'no-orders': return <Inbox className="w-16 h-16 text-outline" strokeWidth={1} />;
      case 'no-subscription': return <UtensilsCrossed className="w-16 h-16 text-outline" strokeWidth={1} />;
      case 'no-notifications': return <Bell className="w-16 h-16 text-outline" strokeWidth={1} />;
      default: return <Inbox className="w-16 h-16 text-outline" strokeWidth={1} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-64">
      <div className="bg-surface-container w-24 h-24 rounded-full flex items-center justify-center mb-6">
        {getIcon()}
      </div>
      <h3 className="text-headline-md font-bold text-on-surface mb-2">{title}</h3>
      <p className="text-body-md text-on-surface-variant mb-6 max-w-xs">{subtitle}</p>
      
      {ctaLabel && onCta && (
        <button 
          onClick={onCta}
          className="bg-primary-container text-primary-dark font-bold px-6 py-2.5 rounded-pill transition-transform active:scale-95"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
};
