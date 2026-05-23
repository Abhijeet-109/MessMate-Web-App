import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export const Toast = ({ message, type = 'info', onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-success" />,
    error: <AlertCircle className="w-5 h-5 text-error" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning" />,
    info: <Info className="w-5 h-5 text-primary" />
  };

  const bgs = {
    success: 'bg-success/10 border-success',
    error: 'bg-error/10 border-error',
    warning: 'bg-warning/10 border-warning',
    info: 'bg-primary/10 border-primary'
  };

  return (
    <div className={clsx(
      "fixed bottom-20 left-4 right-4 z-50 transition-all duration-300 ease-in-out transform",
      isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
    )}>
      <div className={clsx(
        "flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg",
        bgs[type],
        "bg-surface"
      )}>
        {icons[type]}
        <p className="flex-1 text-body-md font-semibold text-on-surface">{message}</p>
        <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className="p-1">
          <X className="w-4 h-4 text-outline" />
        </button>
      </div>
    </div>
  );
};
