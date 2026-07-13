import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService, messService, orderService } from '../../services/api';
import { BottomNav } from '../../components/shared/BottomNav';
import { SubscriptionPlanCard } from '../../components/shared/SubscriptionPlanCard';
import { ConfirmationModal } from '../../components/shared/ConfirmationModal';
import { CreditCard, CheckCircle2, ChevronLeft, ChevronRight, CalendarDays, ShieldCheck, Sparkles, Store, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Subscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sub, setSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loadingSub, setLoadingSub] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [payLoadingText, setPayLoadingText] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPlanName, setSuccessPlanName] = useState('');
  const [payError, setPayError] = useState('');

  // All messes & selected mess for browsing plans
  const [allMesses, setAllMesses] = useState([]);
  const [selectedMessId, setSelectedMessId] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const [selectedDate, setSelectedDate] = useState(null);
  const [dateOrders, setDateOrders] = useState([]);
  const [loadingDateOrders, setLoadingDateOrders] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const fetchDateOrders = async (dateStr) => {
    setLoadingDateOrders(true);
    setDateOrders([]);
    try {
      const data = await orderService.getOrdersByDate(dateStr);
      setDateOrders(data);
    } catch (e) {
      setDateOrders([]);
    } finally {
      setLoadingDateOrders(false);
    }
  };

  // Fetch subscription + all messes on mount
  useEffect(() => {
    userService.getSubscription().then(data => {
      setSub(data);
    }).catch(() => {}).finally(() => setLoadingSub(false));

    messService.getAllMess().then(data => {
      setAllMesses(data);
      // Default to first mess if available
      if (data.length > 0) {
        setSelectedMessId(data[0].id);
      }
    }).catch(() => {});
  }, []);

  // Fetch plans whenever selected mess changes
  useEffect(() => {
    if (!selectedMessId) return;
    setLoadingPlans(true);
    messService.getPlans(selectedMessId).then(p => {
      setPlans(p);
    }).catch(() => setPlans([])).finally(() => setLoadingPlans(false));
  }, [selectedMessId]);

  // Fetch attendance when month changes
  useEffect(() => {
    const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    userService.getAttendance(monthStr).then(data => setAttendance(data)).catch(() => setAttendance([]));
  }, [calYear, calMonth]);

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan);
    setPayError('');
    setShowConfirm(true);
  };

  /**
   * Opens Razorpay checkout modal and returns a promise
   */
  const openRazorpayCheckout = (razorpayOrderId, amount, keyId, planName, messName) => {
    return new Promise((resolve, reject) => {
      const options = {
        key: keyId,
        amount: amount,
        currency: 'INR',
        name: 'MessMate',
        description: `Subscription: ${planName}`,
        order_id: razorpayOrderId,
        handler: function (response) {
          resolve({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: function () {
            reject(new Error('Payment cancelled. You can try again.'));
          },
        },
        prefill: {
          name: JSON.parse(localStorage.getItem('messmate_user') || '{}')?.name || '',
          email: JSON.parse(localStorage.getItem('messmate_user') || '{}')?.email || '',
        },
        theme: { color: '#E8590C' },
        notes: { messName: messName || '', planName },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        reject(new Error(response.error?.description || 'Payment failed. Please try again.'));
      });
      rzp.open();
    });
  };

  /**
   * Full flow: Create order → Razorpay modal → Verify → Activate subscription
   */
  const processSubscription = async () => {
    setShowConfirm(false);
    setPayLoading(true);
    setPayError('');

    // Use the currently selected mess for the subscription
    const messId = selectedMessId;
    const messName = allMesses.find(m => m.id === messId)?.name || '';

    try {
      // Step 1 — Create Razorpay order
      setPayLoadingText('Creating payment order...');
      const paymentOrder = await orderService.createPaymentOrder(
        selectedPlan.price,
        null,
        'subscription',
        messId
      );

      // Step 2 — Open Razorpay modal
      setPayLoading(false);
      setPayLoadingText('');
      const razorpayResponse = await openRazorpayCheckout(
        paymentOrder.razorpay_order_id,
        paymentOrder.amount,
        paymentOrder.key_id,
        selectedPlan.name,
        messName
      );

      // Step 3 — Verify payment
      setPayLoading(true);
      setPayLoadingText('Verifying payment...');
      await orderService.verifyPayment(
        razorpayResponse.razorpay_order_id,
        razorpayResponse.razorpay_payment_id,
        razorpayResponse.razorpay_signature
      );

      // Step 4 — Activate subscription
      setPayLoadingText('Activating your plan...');
      await userService.subscribe(selectedPlan.id, messId, razorpayResponse.razorpay_payment_id);

      setSuccessPlanName(selectedPlan.name);
      setPayLoading(false);
      setShowSuccess(true);
      setTimeout(() => navigate('/student/home'), 2500);

    } catch (err) {
      setPayLoading(false);
      setPayLoadingText('');
      setPayError(err.message || 'Payment failed. Please try again.');
    }
  };

  // Calendar helpers
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const today = new Date();
  const isCurrentMonth = calYear === today.getFullYear() && calMonth === today.getMonth();

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); }
    else setCalMonth(calMonth + 1);
  };

  const attendanceMap = {};
  attendance.forEach(a => {
    const day = parseInt(a.date.split('-')[2], 10);
    attendanceMap[day] = a.status;
  });
  const isActive = sub?.isActive || sub?.status === 'active';

  const selectedMessName = allMesses.find(m => m.id === selectedMessId)?.name || '';

  return (
    <div className="flex-1 flex flex-col bg-background pb-20 md:pb-8">

      {/* ── Payment Loading Overlay ── */}
      {payLoading && (
        <div className="fixed inset-0 z-[99] flex flex-col items-center justify-center bg-black/55 gap-5 animate-fade-in">
          <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-white font-bold text-body-lg animate-pulse">{payLoadingText || 'Processing...'}</p>
        </div>
      )}

      {/* ── Success Modal ── */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="bg-surface rounded-3xl p-8 mx-6 max-w-sm w-full flex flex-col items-center gap-5 shadow-2xl animate-scale-in">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-success/20 animate-ping opacity-60"></div>
              <div className="relative w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-warning" />
              <h2 className="text-headline-md font-extrabold text-on-surface">Plan Activated!</h2>
              <Sparkles className="w-5 h-5 text-warning" />
            </div>
            <p className="text-body-md text-on-surface-variant text-center leading-relaxed">
              <span className="font-bold text-primary">{successPlanName}</span> is now active.
              <br />Enjoy your meals with MessMate! 🎉
            </p>
            <div className="flex items-center gap-2 text-[12px] text-on-surface-variant bg-success/10 px-4 py-2 rounded-full">
              <ShieldCheck className="w-4 h-4 text-success" />
              Payment verified & secured by Razorpay
            </div>
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* ── Error Toast ── */}
      {payError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] bg-error text-white px-5 py-3 rounded-xl shadow-xl text-sm font-bold flex items-center gap-3 animate-fade-in max-w-xs w-full">
          <span className="flex-1">{payError}</span>
          <button onClick={() => setPayError('')} className="text-white/80 hover:text-white font-extrabold text-lg leading-none">✕</button>
        </div>
      )}

      <header className="px-6 pt-12 md:pt-0 pb-6 md:pb-2 bg-surface md:bg-transparent shadow-sm md:shadow-none z-10 border-b border-outline-variant md:border-none">
        <h1 className="text-headline-lg font-extrabold text-on-surface md:hidden">Meal Pass</h1>
        <p className="text-body-md text-on-surface-variant mt-1 md:hidden">Manage your subscriptions and attendance</p>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">
        <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">

          {/* Active Plan */}
          <div className="flex flex-col gap-3">
            <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" /> Active Pass
            </h2>
            {loadingSub ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : isActive ? (
              <section className="bg-surface rounded-2xl shadow-card border-2 border-primary relative overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary via-primary-dark to-secondary w-full"></div>
                <div className="absolute top-2 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wide">Active</div>
                <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-headline-md font-bold text-on-surface">{sub.messName}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-headline-xl font-extrabold text-primary-dark">{sub.mealsRemaining}</span>
                      <span className="text-body-md text-on-surface-variant">Meals Left</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      <div className="flex items-center gap-2">
                        <div className="bg-success/20 p-0.5 rounded-full"><CheckCircle2 className="w-4 h-4 text-success" /></div>
                        <span className="text-body-md text-on-surface">Expires: {sub.expiresAt}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-success/20 p-0.5 rounded-full"><CheckCircle2 className="w-4 h-4 text-success" /></div>
                        <span className="text-body-md text-on-surface">{sub.planName}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/student/mess/${sub.messId}`)}
                    className="w-full md:w-auto px-8 py-3 rounded-pill font-bold bg-primary text-white transition-transform active:scale-95 shadow-sm"
                  >
                    Order Now
                  </button>
                </div>
              </section>
            ) : (
              <div className="bg-surface-container border-2 border-outline-variant border-dashed p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
                <CreditCard className="w-8 h-8 text-outline" />
                <span className="text-body-lg font-bold text-on-surface-variant">No Active Pass</span>
                <span className="text-body-md text-on-surface-variant">Pick a mess below and subscribe to a plan</span>
              </div>
            )}
          </div>

          {/* ── Mess Selector Tabs ── */}
          <div className="flex flex-col gap-3">
            <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
              <Store className="w-5 h-5 text-secondary" /> Select Mess
            </h2>
            {allMesses.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {allMesses.map(mess => (
                  <button
                    key={mess.id}
                    onClick={() => setSelectedMessId(mess.id)}
                    className={`flex-shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                      selectedMessId === mess.id
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary/40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-extrabold ${
                      selectedMessId === mess.id ? 'bg-white text-primary' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {mess.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="leading-tight">{mess.name}</span>
                      {mess.rating > 0 && (
                        <span className={`text-[10px] font-normal ${selectedMessId === mess.id ? 'text-white/80' : 'text-on-surface-variant'}`}>⭐ {mess.rating}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-on-surface-variant text-center py-4">Loading messes...</div>
            )}
          </div>

          {/* Available Plans for Selected Mess */}
          <div className="flex flex-col gap-3">
            <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              {selectedMessName ? `Plans — ${selectedMessName}` : 'Available Plans'}
            </h2>
            <div className="flex flex-col gap-4">
              {loadingPlans ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                </div>
              ) : plans.length > 0 ? plans.map(plan => (
                <SubscriptionPlanCard key={plan.id} plan={plan} onSubscribe={handleSubscribe} />
              )) : (
                <div className="bg-surface-container border-2 border-outline-variant border-dashed p-6 rounded-2xl flex flex-col items-center justify-center gap-2 text-center">
                  <CreditCard className="w-6 h-6 text-outline" />
                  <span className="text-body-md font-bold text-on-surface-variant">
                    {selectedMessName ? `No plans available for ${selectedMessName}` : 'Select a mess to view plans'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Calendar */}
        {isActive && (
          <section className="mt-4 flex flex-col gap-4 bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2 mb-2">
              <CalendarDays className="w-5 h-5 text-secondary" /> Attendance
            </h2>
            
            {/* No-show KPI Card */}
            {(sub.noShowCount ?? 0) > 0 && (
              <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm">Postpaid No-shows</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {sub.noShowCount ?? 0} of {sub.maxNoShows ?? 0} allowed misses used
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-warning">{sub.noShowCount ?? 0}/{sub.maxNoShows ?? 0}</p>
                  {(sub.noShowCount ?? 0) >= (sub.maxNoShows ?? 0) && (
                    <p className="text-[10px] font-bold text-error uppercase tracking-wide mt-0.5">Postpaid Blocked</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between bg-surface-container rounded-pill p-1 max-w-[250px] mx-auto mb-2">
              <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-on-surface">
                <ChevronLeft className="w-4 h-4"/>
              </button>
              <span className="font-bold text-label-md uppercase tracking-wider">{monthName}</span>
              <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-on-surface">
                <ChevronRight className="w-4 h-4"/>
              </button>
            </div>
            
            <div className="w-full overflow-x-auto no-scrollbar pb-4">
              <div className="min-w-[340px] md:w-full max-w-[600px] mx-auto">
                <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div className="grid grid-cols-7 gap-y-3 gap-x-2 justify-items-center">
                  {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`empty-${i}`}></div>)}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const status = attendanceMap[day];
                    const isTodayDate = isCurrentMonth && day === today.getDate();
                    let colorClass = "bg-surface-container border-transparent text-on-surface-variant";
                    let showDay = true;
                    if (status === 'attended') { colorClass = "bg-success text-white border-transparent shadow-sm"; showDay = false; }
                    else if (status === 'no-show') { colorClass = "bg-error text-white border-transparent shadow-sm"; showDay = false; }
                    else if (isCurrentMonth && day === today.getDate()) { colorClass = "bg-surface border-2 border-warning text-warning font-bold"; }
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          const dateString = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          setSelectedDate(dateString);
                          setShowDateModal(true);
                          fetchDateOrders(dateString);
                        }}
                        className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center text-[12px] md:text-sm font-semibold transition-all hover:scale-110 active:scale-95 ${colorClass} ${isTodayDate ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                        title={status ? `${status} on ${day}` : ''}
                      >
                        {showDay ? day : (status === 'attended' ? '✓' : '✗')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant text-center mt-2">
              Tap any date to see your orders for that day
            </p>
          </section>
        )}
      </main>

      {/* Confirmation modal — shown BEFORE Razorpay opens */}
      <ConfirmationModal
        isOpen={showConfirm}
        title="Confirm Subscription"
        message={`You are about to subscribe to ${selectedPlan?.name} at ${selectedMessName} for ₹${selectedPlan?.price}. You will be redirected to Razorpay to complete the payment securely.`}
        confirmText="Pay via Razorpay →"
        onConfirm={processSubscription}
        onCancel={() => setShowConfirm(false)}
      />

      <BottomNav variant="student" />

      {/* Date Detail Modal */}
      {showDateModal && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50"
          onClick={() => setShowDateModal(false)}
        >
          <div
            className="bg-surface w-full max-w-lg rounded-t-3xl p-6 pb-10 flex flex-col gap-4 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-on-surface text-lg">
                {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                  weekday: 'long', day: 'numeric', month: 'long'
                }) : ''}
              </h3>
              <button
                onClick={() => setShowDateModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant font-bold hover:bg-outline-variant transition-colors"
              >✕</button>
            </div>

            {/* Content */}
            {loadingDateOrders ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : dateOrders.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-sm">
                No orders placed on this day
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {dateOrders.map((order) => (
                  <div key={order.id} className="bg-surface-container rounded-2xl p-4 flex flex-col gap-2 shadow-sm border border-outline-variant">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface text-sm">{order.mess_name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                        order.status === 'Completed' ? 'bg-success/20 text-success' :
                        order.status === 'No-show' ? 'bg-error/20 text-error' :
                        order.status === 'Cancelled' ? 'bg-outline/20 text-on-surface-variant' :
                        'bg-primary/20 text-primary'
                      }`}>{order.status}</span>
                    </div>
                    <div className="text-xs text-on-surface-variant capitalize">
                      {order.meal_type} • {order.order_type} • {order.slot_time}
                    </div>
                    <div className="flex flex-col gap-1">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs text-on-surface">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="text-on-surface-variant">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-1 border-t border-outline-variant">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        {order.payment_method}
                      </span>
                      <span className="font-extrabold text-on-surface text-sm">₹{order.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
