import React, { createContext, useContext, useState } from 'react';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState(null);

  const startPreOrder = (mess, slot, orderType) => {
    setCurrentOrder({
      mess,
      slot,
      orderType, // 'Dine-in' or 'Parcel'
      items: [],
      total: 0,
    });
  };

  const updateItems = (items) => {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCurrentOrder(prev => ({ ...prev, items, total }));
  };

  const clearOrder = () => setCurrentOrder(null);

  return (
    <OrderContext.Provider value={{ currentOrder, startPreOrder, updateItems, clearOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => useContext(OrderContext);
