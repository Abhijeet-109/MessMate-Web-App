import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { BottomNav } from '../../components/shared/BottomNav';
import { Search, Filter, MoreVertical, RotateCcw, Ban, CalendarPlus } from 'lucide-react';
import ThemeToggle from '../../components/shared/ThemeToggle';

const SubscriberManagement = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [actionMenu, setActionMenu] = useState(null); // sub id

  const fetchSubs = async () => {
    try {
      const data = await adminService.getSubscribers(statusFilter || undefined);
      setSubscribers(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchSubs(); }, [statusFilter]);

  const handleAction = async (subId, action) => {
    try {
      await adminService.updateSubscriber(subId, action, action === 'extend' ? 30 : undefined);
      await fetchSubs();
    } catch (err) { console.error(err); }
    setActionMenu(null);
  };

  const filtered = searchQuery
    ? subscribers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()))
    : subscribers;

  const statusLabel = (s) => {
    if (s.status === 'cancelled') return { text: 'Cancelled', cls: 'bg-error-container text-error' };
    if (s.status === 'expired' || s.status === 'cancelled') return { text: 'Expired', cls: 'bg-error-container text-error' };
    if (s.isExpiringSoon) return { text: 'Expiring Soon', cls: 'bg-warning/20 text-warning' };
    return { text: 'Active', cls: 'bg-success/20 text-success' };
  };

  return (
    <div className="flex-1 flex flex-col bg-background pb-20 md:pb-8">
      <header className="px-6 pt-12 pb-4 bg-surface shadow-sm z-10 border-b border-outline-variant flex justify-between items-center">
        <h1 className="text-headline-lg font-extrabold text-on-surface">Subscribers</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-full hover:bg-surface-container bg-surface-container text-on-surface">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Search bar */}
      {showSearch && (
        <div className="px-6 py-3 bg-surface border-b border-outline-variant">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or email..."
            className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface focus:border-primary outline-none" autoFocus />
        </div>
      )}

      {/* Filter tabs */}
      <div className="px-6 py-3 bg-surface border-b border-outline-variant flex gap-3 overflow-x-auto no-scrollbar">
        {[{ key: '', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'expired', label: 'Expired' }, { key: 'cancelled', label: 'Cancelled' }].map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            className={`px-4 py-1.5 rounded-pill text-label-md font-bold whitespace-nowrap transition-colors ${statusFilter === f.key ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-visible">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant text-label-md uppercase tracking-wider text-on-surface-variant">
                    <th className="p-4 font-bold">Student</th>
                    <th className="p-4 font-bold">Plan</th>
                    <th className="p-4 font-bold">Meals Left</th>
                    <th className="p-4 font-bold">No-shows</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sub => {
                    const st = statusLabel(sub);
                    return (
                      <tr key={sub.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-container text-primary-dark font-bold flex items-center justify-center">{sub.name.charAt(0)}</div>
                            <div>
                              <div className="font-bold text-on-surface">{sub.name}</div>
                              <div className="text-[12px] text-on-surface-variant">{sub.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-on-surface">{sub.plan}</td>
                        <td className="p-4 font-bold text-on-surface">
                          <span className={sub.mealsLeft < 10 ? "text-error" : ""}>{sub.mealsLeft}</span>
                        </td>
                        <td className="p-4 text-on-surface">{sub.noShows}/{sub.maxNoShows || 3}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 text-[12px] font-bold uppercase tracking-wider rounded-md ${st.cls}`}>{st.text}</span>
                        </td>
                        <td className="p-4 text-center relative">
                          <button onClick={() => setActionMenu(actionMenu === sub.id ? null : sub.id)} className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {actionMenu === sub.id && (
                            <div className="absolute right-4 top-12 bg-surface border border-outline-variant rounded-xl shadow-lg z-20 w-48 overflow-hidden">
                              <button onClick={() => handleAction(sub.id, 'extend')} className="w-full p-3 text-left flex items-center gap-2 hover:bg-surface-container text-on-surface text-body-md">
                                <CalendarPlus className="w-4 h-4 text-success" /> Extend 30 days
                              </button>
                              <button onClick={() => handleAction(sub.id, 'reset_no_shows')} className="w-full p-3 text-left flex items-center gap-2 hover:bg-surface-container text-on-surface text-body-md border-t border-outline-variant">
                                <RotateCcw className="w-4 h-4 text-primary" /> Reset No-shows
                              </button>
                              <button onClick={() => handleAction(sub.id, 'cancel')} className="w-full p-3 text-left flex items-center gap-2 hover:bg-surface-container text-error text-body-md border-t border-outline-variant">
                                <Ban className="w-4 h-4" /> Cancel Sub
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden flex flex-col gap-4">
              {filtered.map(sub => {
                const st = statusLabel(sub);
                return (
                  <div key={sub.id} className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary-container text-primary-dark font-bold flex items-center justify-center text-lg">{sub.name.charAt(0)}</div>
                        <div>
                          <div className="font-bold text-on-surface">{sub.name}</div>
                          <div className="text-label-md text-on-surface-variant">{sub.email}</div>
                        </div>
                      </div>
                      <div className="relative">
                        <button onClick={() => setActionMenu(actionMenu === sub.id ? null : sub.id)} className="p-2 -mr-2 text-on-surface-variant">
                          <MoreVertical className="w-5 h-5"/>
                        </button>
                        {actionMenu === sub.id && (
                          <div className="absolute right-0 top-10 bg-surface border border-outline-variant rounded-xl shadow-lg z-20 w-48 overflow-hidden">
                            <button onClick={() => handleAction(sub.id, 'extend')} className="w-full p-3 text-left flex items-center gap-2 hover:bg-surface-container text-on-surface text-body-md">
                              <CalendarPlus className="w-4 h-4 text-success" /> Extend 30 days
                            </button>
                            <button onClick={() => handleAction(sub.id, 'reset_no_shows')} className="w-full p-3 text-left flex items-center gap-2 hover:bg-surface-container text-on-surface text-body-md border-t border-outline-variant">
                              <RotateCcw className="w-4 h-4 text-primary" /> Reset No-shows
                            </button>
                            <button onClick={() => handleAction(sub.id, 'cancel')} className="w-full p-3 text-left flex items-center gap-2 hover:bg-surface-container text-error text-body-md border-t border-outline-variant">
                              <Ban className="w-4 h-4" /> Cancel Sub
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-outline-variant">
                      <div>
                        <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Plan</div>
                        <div className="font-semibold text-on-surface">{sub.plan}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Meals</div>
                        <div className={`font-bold ${sub.mealsLeft < 10 ? 'text-error' : 'text-on-surface'}`}>{sub.mealsLeft} Left</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Status</div>
                        <div className={`text-label-md font-bold mt-0.5 ${st.text === 'Active' ? 'text-success' : st.text === 'Expiring Soon' ? 'text-warning' : 'text-error'}`}>
                          {st.text}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="py-12 text-center text-on-surface-variant">No subscribers found.</div>
            )}
          </>
        )}
      </main>

      {/* Click-away listener for action menu */}
      {actionMenu && <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />}

      <BottomNav variant="admin" />
    </div>
  );
};

export default SubscriberManagement;
