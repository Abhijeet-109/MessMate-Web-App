import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/api';
import { BottomNav } from '../../components/shared/BottomNav';
import { Download, Wallet, CheckCircle, Clock } from 'lucide-react';
import ThemeToggle from '../../components/shared/ThemeToggle';

const BillingRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Postpaid state
  const [postpaidView, setPostpaidView] = useState(false);
  const [postpaidData, setPostpaidData] = useState({ pending: [], collected: [] });
  const [postpaidLoading, setPostpaidLoading] = useState(false);
  const [toast, setToast] = useState('');

  const fetchBilling = async () => {
    try {
      const data = await adminService.getBillingRecords(typeFilter || undefined, statusFilter || undefined);
      setRecords(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchPostpaid = useCallback(async () => {
    setPostpaidLoading(true);
    try {
      const data = await adminService.getPostpaidOrders();
      setPostpaidData(data);
    } catch (err) { console.error(err); }
    setPostpaidLoading(false);
  }, []);

  useEffect(() => {
    if (postpaidView) {
      fetchPostpaid();
    } else {
      fetchBilling();
    }
  }, [typeFilter, statusFilter, postpaidView]);

  const handleExport = async () => {
    try {
      const blob = await adminService.exportBillingCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'billing.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleCollect = async (orderId) => {
    try {
      const result = await adminService.collectPostpaidPayment(orderId);
      // Optimistic UI: move from pending to collected
      setPostpaidData(prev => {
        const item = prev.pending.find(o => o.id === orderId);
        if (!item) return prev;
        return {
          pending: prev.pending.filter(o => o.id !== orderId),
          collected: [{ ...item, paymentCollected: true }, ...prev.collected],
        };
      });
      setToast(result.message || 'Payment collected!');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error(err);
      setToast('Failed to collect payment.');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const pendingTotal = postpaidData.pending.reduce((s, o) => s + o.total, 0);
  const collectedTotal = postpaidData.collected.reduce((s, o) => s + o.total, 0);

  return (
    <div className="flex-1 flex flex-col bg-background pb-20 md:pb-8">
      <header className="px-6 pt-12 pb-4 bg-surface shadow-sm z-10 border-b border-outline-variant flex justify-between items-center">
        <h1 className="text-headline-lg font-extrabold text-on-surface">Billing & Records</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-pill bg-primary text-white font-bold text-label-md hover:bg-primary-dark transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </header>

      {/* Filter tabs */}
      <div className="px-6 py-3 bg-surface border-b border-outline-variant flex gap-3 overflow-x-auto no-scrollbar">
        {[{ key: '', label: 'All' }, { key: 'order', label: 'Orders' }, { key: 'subscription', label: 'Subscriptions' }].map(f => (
          <button key={f.key} onClick={() => { setTypeFilter(f.key); setPostpaidView(false); }}
            className={`px-4 py-1.5 rounded-pill text-label-md font-bold whitespace-nowrap transition-colors ${!postpaidView && typeFilter === f.key ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            {f.label}
          </button>
        ))}
        <button onClick={() => setPostpaidView(true)}
          className={`px-4 py-1.5 rounded-pill text-label-md font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${postpaidView ? 'bg-warning text-white' : 'bg-surface-container text-on-surface-variant'}`}>
          <Wallet className="w-3.5 h-3.5" /> Postpaid
        </button>
        {!postpaidView && (
          <>
            <div className="w-px bg-outline-variant mx-1"></div>
            {[{ key: '', label: 'All Status' }, { key: 'captured', label: 'Success' }, { key: 'failed', label: 'Failed' }].map(f => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={`px-4 py-1.5 rounded-pill text-label-md font-bold whitespace-nowrap transition-colors ${statusFilter === f.key ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                {f.label}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="mx-6 mt-3 px-4 py-3 bg-success/10 border border-success/30 rounded-xl text-success font-bold text-body-md flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-5 h-5" /> {toast}
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {/* === POSTPAID VIEW === */}
        {postpaidView ? (
          postpaidLoading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Summary row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex flex-col items-center">
                  <span className="text-label-md text-warning font-bold uppercase">Total Pending</span>
                  <span className="text-headline-xl font-extrabold text-warning">₹{pendingTotal}</span>
                  <span className="text-label-md text-on-surface-variant">{postpaidData.pending.length} orders</span>
                </div>
                <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex flex-col items-center">
                  <span className="text-label-md text-success font-bold uppercase">Total Collected</span>
                  <span className="text-headline-xl font-extrabold text-success">₹{collectedTotal}</span>
                  <span className="text-label-md text-on-surface-variant">{postpaidData.collected.length} orders</span>
                </div>
              </div>

              {/* Pending Section */}
              {postpaidData.pending.length > 0 && (
                <div>
                  <h2 className="text-headline-md font-extrabold text-on-surface mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-warning" /> Pending Collection
                  </h2>

                  {/* Desktop table */}
                  <div className="hidden md:block bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container border-b border-outline-variant text-label-md uppercase tracking-wider text-on-surface-variant">
                          <th className="p-4 font-bold">Order ID</th>
                          <th className="p-4 font-bold">Student</th>
                          <th className="p-4 font-bold">Items</th>
                          <th className="p-4 font-bold">Amount</th>
                          <th className="p-4 font-bold">Date</th>
                          <th className="p-4 font-bold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {postpaidData.pending.map(order => (
                          <tr key={order.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container/50 transition-colors">
                            <td className="p-4 font-mono text-[12px] text-on-surface-variant">#{order.id}</td>
                            <td className="p-4 font-bold text-on-surface">{order.studentName}</td>
                            <td className="p-4 text-on-surface text-body-sm">{order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || '-'}</td>
                            <td className="p-4 font-extrabold text-on-surface">₹{order.total}</td>
                            <td className="p-4 text-on-surface-variant">{formatDate(order.createdAt)}</td>
                            <td className="p-4">
                              <button onClick={() => handleCollect(order.id)}
                                className="px-4 py-2 rounded-pill bg-warning text-white font-bold text-label-md hover:bg-warning/90 transition-colors flex items-center gap-1.5">
                                <Wallet className="w-4 h-4" /> Collect ₹{order.total}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden flex flex-col gap-3">
                    {postpaidData.pending.map(order => (
                      <div key={order.id} className="bg-surface p-4 rounded-xl border border-warning/30 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[11px] text-on-surface-variant">#{order.id}</span>
                            <h3 className="font-bold text-on-surface">{order.studentName}</h3>
                          </div>
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-warning/20 text-warning">Pending</span>
                        </div>
                        <div className="text-body-sm text-on-surface-variant">{order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || '-'}</div>
                        <div className="flex justify-between items-center pt-2 border-t border-outline-variant">
                          <div>
                            <span className="font-extrabold text-on-surface text-lg">₹{order.total}</span>
                            <span className="text-label-md text-on-surface-variant ml-2">{formatDate(order.createdAt)}</span>
                          </div>
                          <button onClick={() => handleCollect(order.id)}
                            className="px-4 py-2 rounded-pill bg-warning text-white font-bold text-label-md hover:bg-warning/90 transition-colors flex items-center gap-1.5">
                            <Wallet className="w-4 h-4" /> Collect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collected Section */}
              {postpaidData.collected.length > 0 && (
                <div>
                  <h2 className="text-headline-md font-extrabold text-on-surface mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" /> Collected
                  </h2>
                  <div className="hidden md:block bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container border-b border-outline-variant text-label-md uppercase tracking-wider text-on-surface-variant">
                          <th className="p-4 font-bold">Order ID</th>
                          <th className="p-4 font-bold">Student</th>
                          <th className="p-4 font-bold">Amount</th>
                          <th className="p-4 font-bold">Date</th>
                          <th className="p-4 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {postpaidData.collected.map(order => (
                          <tr key={order.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container/50 transition-colors">
                            <td className="p-4 font-mono text-[12px] text-on-surface-variant">#{order.id}</td>
                            <td className="p-4 font-bold text-on-surface">{order.studentName}</td>
                            <td className="p-4 font-extrabold text-on-surface">₹{order.total}</td>
                            <td className="p-4 text-on-surface-variant">{formatDate(order.createdAt)}</td>
                            <td className="p-4"><span className="px-3 py-1 text-[12px] font-bold uppercase tracking-wider rounded-md bg-success/20 text-success">Collected</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden flex flex-col gap-3">
                    {postpaidData.collected.map(order => (
                      <div key={order.id} className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm flex justify-between items-center">
                        <div>
                          <span className="font-mono text-[11px] text-on-surface-variant">#{order.id}</span>
                          <h3 className="font-bold text-on-surface">{order.studentName}</h3>
                          <span className="text-label-md text-on-surface-variant">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-on-surface">₹{order.total}</div>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-success/20 text-success">Collected</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {postpaidData.pending.length === 0 && postpaidData.collected.length === 0 && (
                <div className="py-12 text-center text-on-surface-variant border border-outline-variant border-dashed rounded-xl">No postpaid orders found.</div>
              )}
            </div>
          )
        ) : (
          /* === REGULAR BILLING VIEW === */
          loading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant border border-outline-variant border-dashed rounded-xl">No billing records found.</div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant text-label-md uppercase tracking-wider text-on-surface-variant">
                      <th className="p-4 font-bold">Transaction ID</th>
                      <th className="p-4 font-bold">Date</th>
                      <th className="p-4 font-bold">Student</th>
                      <th className="p-4 font-bold">Type</th>
                      <th className="p-4 font-bold">Payment</th>
                      <th className="p-4 font-bold">Amount</th>
                      <th className="p-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(rec => (
                      <tr key={rec.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container/50 transition-colors">
                        <td className="p-4 font-mono text-[12px] text-on-surface-variant">{rec.id}</td>
                        <td className="p-4 text-on-surface">{formatDate(rec.date)}</td>
                        <td className="p-4 font-bold text-on-surface">{rec.student}</td>
                        <td className="p-4 text-on-surface">{rec.type}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            rec.paymentType === 'Postpaid' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                          }`}>{rec.paymentType}</span>
                        </td>
                        <td className="p-4 font-extrabold text-on-surface">₹{rec.amount}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 text-[12px] font-bold uppercase tracking-wider rounded-md ${
                            rec.status === 'Success' ? 'bg-success/20 text-success' : rec.status === 'Failed' ? 'bg-error-container text-error' : 'bg-warning/20 text-warning'
                          }`}>{rec.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden flex flex-col gap-4">
                {records.map(rec => (
                  <div key={rec.id} className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                      <div>
                        <div className="font-bold text-on-surface text-lg">₹{rec.amount}</div>
                        <div className="text-[10px] text-on-surface-variant font-mono uppercase mt-0.5">{rec.id}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-md text-[12px] font-bold uppercase tracking-wider ${
                        rec.status === 'Success' ? 'bg-success/20 text-success' : rec.status === 'Failed' ? 'bg-error-container text-error' : 'bg-warning/20 text-warning'
                      }`}>{rec.status}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <div>
                        <div className="font-bold text-on-surface">{rec.student}</div>
                        <div className="text-label-md text-on-surface-variant flex items-center gap-2">
                          {rec.type}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            rec.paymentType === 'Postpaid' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                          }`}>{rec.paymentType}</span>
                        </div>
                      </div>
                      <div className="text-label-md text-on-surface-variant text-right">{formatDate(rec.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        )}
      </main>

      <BottomNav variant="admin" />
    </div>
  );
};

export default BillingRecords;
