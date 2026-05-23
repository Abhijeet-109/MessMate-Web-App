import React, { useState, useEffect } from 'react';
import { userService } from '../../services/api';
import { ArrowLeft, Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/shared/EmptyState';
import { clsx } from 'clsx';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    userService.getNotifications().then(data => {
      setNotifications(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try {
      await userService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, is_read: 1 } : n));
    } catch (err) { console.error(err); }
  };

  const clearAll = async () => {
    try {
      await userService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true, is_read: 1 })));
    } catch (err) { console.error(err); }
  };

  const clearRead = async () => {
    try {
      await userService.clearReadNotifications();
      setNotifications(prev => prev.filter(n => !n.read && !n.is_read));
    } catch (err) { console.error(err); }
  };

  const unreadCount = notifications.filter(n => !n.read && !n.is_read).length;
  const readCount = notifications.filter(n => n.read || n.is_read).length;

  return (
    <div className="flex-1 flex flex-col bg-background">
      <header className="px-6 pt-12 pb-4 bg-surface shadow-sm z-10 flex justify-between items-center border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-surface-container md:hidden">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <h1 className="text-headline-lg font-extrabold text-on-surface">Notifications</h1>
        </div>
        <div className="flex items-center gap-2">
          {readCount > 0 && (
            <button
              onClick={clearRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-error/10 text-error text-label-md font-bold hover:bg-error/20 transition-colors"
            >
              <X className="w-4 h-4" /> Clear read
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-primary/10 text-primary text-label-md font-bold hover:bg-primary/20 transition-colors"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
        ) : notifications.length === 0 ? (
          <EmptyState 
            illustration="no-notifications" 
            title="All caught up!" 
            subtitle="You don't have any new notifications." 
          />
        ) : (
          notifications.map(n => {
            const isRead = n.read || n.is_read;
            return (
              <div key={n.id} className={clsx(
                "p-4 rounded-xl shadow-sm border flex gap-4 transition-all relative group",
                isRead ? "bg-surface border-outline-variant opacity-70" : "bg-primary-container/20 border-primary-container"
              )}>
                <div className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  n.type === 'success' ? 'bg-success/20 text-success' : 
                  n.type === 'warning' ? 'bg-warning/20 text-warning' : 
                  n.type === 'error' ? 'bg-error/20 text-error' : 'bg-primary/20 text-primary'
                )}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <p className={clsx("text-body-md", isRead ? "text-on-surface-variant" : "text-on-surface font-bold")}>{n.message}</p>
                  <span className="text-label-md text-outline">{n.timestamp || new Date(n.created_at).toLocaleString()}</span>
                </div>
                {!isRead && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-success/20 text-on-surface-variant hover:text-success transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default Notifications;
