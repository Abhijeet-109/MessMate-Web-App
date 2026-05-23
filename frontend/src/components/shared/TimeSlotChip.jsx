import React from 'react';
import { clsx } from 'clsx';

export const TimeSlotChip = ({ time, state, onClick }) => {
  // state: 'available', 'selected', 'full'
  
  let styles = "border border-outline-variant text-on-surface hover:border-primary";
  if (state === 'selected') {
    styles = "bg-primary text-white border-primary";
  } else if (state === 'full') {
    styles = "bg-surface-container text-outline border-outline-variant opacity-60 cursor-not-allowed";
  }

  return (
    <button
      onClick={() => state !== 'full' && onClick && onClick(time)}
      disabled={state === 'full'}
      className={clsx(
        "px-4 py-2 rounded-pill text-[14px] font-semibold transition-colors duration-200",
        styles
      )}
    >
      {time} {state === 'full' && '(Full)'}
    </button>
  );
};
