import React from 'react';
import { Clock, Coffee, UtensilsCrossed } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { OrderStatusTracker } from './OrderStatusTracker';

export const OrderCardStudent = ({ order, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-surface rounded-xl p-4 shadow-card flex flex-col gap-3 cursor-pointer"
    >
      <div className="flex justify-between items-center border-b border-outline-variant pb-2">
        <span className="font-bold text-on-surface">{order.messName}</span>
        <StatusBadge status={order.status} />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Coffee className="w-4 h-4" />
          <span className="text-body-md">{order.mealType} • {order.orderType}</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Clock className="w-4 h-4" />
          <span className="text-body-md font-bold text-primary">{order.slotTime}</span>
        </div>
      </div>

      <div className="mt-2">
        <OrderStatusTracker currentStatus={order.status} />
      </div>
    </div>
  );
};

export const OrderCardAdmin = ({ order, onAccept, onReject }) => {
  return (
    <div className="bg-surface rounded-xl p-4 shadow-card flex flex-col gap-3">
      <div className="flex justify-between items-center border-b border-outline-variant pb-2">
        <div className="flex flex-col">
          <span className="font-bold text-on-surface text-headline-md">{order.id}</span>
          <span className="text-body-md text-on-surface-variant">Student ID: #8892</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={order.status} />
          <span className="text-[10px] bg-secondary-container text-secondary px-2 py-0.5 rounded-full font-bold uppercase">{order.orderType}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-body-md bg-surface-container rounded-md p-2">
        <div className="flex items-center gap-2 font-bold text-primary-dark">
          <Clock className="w-4 h-4" />
          {order.slotTime}
        </div>
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4" />
          {order.mealType}
        </div>
      </div>

      <ul className="text-body-md text-on-surface space-y-1">
        {order.items.map(item => (
          <li key={item.id} className="flex justify-between">
            <span>{item.quantity}x {item.name}</span>
          </li>
        ))}
        {order.notes && (
          <li className="text-warning text-[12px] italic mt-2">Note: {order.notes}</li>
        )}
      </ul>

      {order.status === 'Placed' && (
        <div className="flex gap-2 mt-2 pt-2 border-t border-outline-variant">
          <button 
            onClick={() => onReject(order.id)}
            className="flex-1 py-2 rounded-pill border-2 border-error text-error font-bold"
          >
            Reject
          </button>
          <button 
            onClick={() => onAccept(order.id)}
            className="flex-1 py-2 rounded-pill bg-success text-white font-bold"
          >
            Accept
          </button>
        </div>
      )}
    </div>
  );
};
