import React from 'react';
import { clsx } from 'clsx';

export const ConfirmationModal = ({ isOpen, title, message, icon: Icon, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, isDestructive }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-secondary/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-sm rounded-[24px] p-6 shadow-modal transform animate-slide-up">
        {Icon && (
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mb-4 mx-auto">
            <Icon className="w-6 h-6 text-primary-dark" />
          </div>
        )}
        
        <h2 className="text-headline-md font-bold text-center text-on-surface mb-2">{title}</h2>
        <p className="text-body-md text-center text-on-surface-variant mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 rounded-pill border-2 border-outline-variant text-on-surface font-bold hover:bg-surface-container transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={clsx(
              "flex-1 py-3 rounded-pill text-white font-bold transition-transform active:scale-95",
              isDestructive ? "bg-red-500 hover:bg-red-600" : "bg-primary"
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
