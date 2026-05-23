import React from 'react';
import { clsx } from 'clsx';

export const StatusBadge = ({ status }) => {
  const normalized = status.toLowerCase();
  let colors = 'bg-outline-variant text-on-surface-variant';

  if (['active', 'available', 'completed', 'ready'].includes(normalized)) {
    colors = 'bg-success text-white';
  } else if (['pending', 'preparing'].includes(normalized)) {
    colors = 'bg-warning text-white';
  } else if (['accepted', 'info'].includes(normalized)) {
    colors = 'bg-primary-container text-primary-dark';
  } else if (['cancelled', 'no-show', 'sold out', 'full'].includes(normalized)) {
    colors = 'bg-error text-white';
  }

  return (
    <span className={clsx("px-2.5 py-1 rounded-pill text-[10px] font-bold tracking-wide uppercase", colors)}>
      {status}
    </span>
  );
};
