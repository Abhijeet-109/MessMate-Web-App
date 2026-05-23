import React from 'react';
import { Star, MapPin } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export const MessCard = ({ mess, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-surface rounded-xl shadow-card overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="relative h-32 w-full">
        <img 
          src={mess.thumbnail} 
          alt={mess.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <StatusBadge status={mess.isOpen ? 'Available' : 'Closed'} />
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <h3 className="text-headline-md font-bold text-on-surface line-clamp-1">{mess.name}</h3>
          <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-md">
            <Star className="w-3 h-3 fill-warning text-warning" />
            <span className="text-label-md text-on-surface">{mess.rating}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-on-surface-variant">
          <MapPin className="w-4 h-4" />
          <span className="text-body-md">{mess.distance} • {mess.location}</span>
        </div>

        {mess.todaysSpecial && (
          <div className="mt-2 bg-primary-container/30 px-3 py-2 rounded-md border border-primary-container">
            <p className="text-label-md text-primary-dark">
              🌟 Today's Special: <span className="font-normal">{mess.todaysSpecial}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
