import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext';
import { orderService } from '../../services/api';
import { ArrowLeft, CheckCircle2, Wallet, Banknote, CreditCard, ShieldCheck } from 'lucide-react';
import { Toast } from '../../components/shared/Toast';

const PreOrderStep3 = () => {
  const navigate = useNavigate();
  const { currentOrder, clearOrder } = useOrder();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  useEffect(() => {
    if (!currentOrder) {
      navigate('/student/browse');
    }
  }, [currentOrder, navigate]);

  if (!currentOrder) return null;

  const isSubscription = currentOrder.paymentMethod === 'Subscription' || currentOrder.total === 0;

  /**
   * Open Razorpay checkout modal and return a promise
   * Resolves with { razorpay_payment_id, razorpay_order_id, razorpay_signature }
   * Rejects on user cancel or failure
   */
  const openRazorpayCheckout = (razorpayOrderId, amount, keyId) => {
    return new Promise((resolve, reject) => {
      const options = {
        key: keyId,
        amount: amount, // already in paise from backend
        currency: 'INR',
        name: 'MessMate',
        description: `Order at ${currentOrder.mess?.name || 'Mess'}`,
        order_id: razorpayOrderId,
        handler: function (response) {
          // Payment successful — Razorpay sends back these fields
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
        theme: {
          color: '#E8590C', // Primary brand color
        },
        notes: {
          messName: currentOrder.mess?.name || '',
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        reject(new Error(response.error?.description || 'Payment failed. Please try again.'));
      });

      rzp.open();
    });
  };

  /**
   * Full Razorpay payment flow:
   * 1. Create Razorpay order on backend
   * 2. Open checkout modal
   * 3. Verify payment signature on backend
   * 4. Place the mess order with verified paymentId
   */
  const handleRazorpayPayment = async () => {
    // Step 1: Create Razorpay order
    setLoadingText('Creating payment order...');
    const paymentOrder = await orderService.createPaymentOrder(
      currentOrder.total,
      null,
      'order',
      currentOrder.mess?.id
    );

    // Step 2: Open Razorpay checkout modal
    setLoading(false); // Hide spinner while modal is open
    setLoadingText('');

    const razorpayResponse = await openRazorpayCheckout(
      paymentOrder.razorpay_order_id,
      paymentOrder.amount,
      paymentOrder.key_id
    );

    // Step 3: Verify payment on backend
    setLoading(true);
    setLoadingText('Verifying payment...');
    await orderService.verifyPayment(
      razorpayResponse.razorpay_order_id,
      razorpayResponse.razorpay_payment_id,
      razorpayResponse.razorpay_signature
    );

    // Step 4: Place the order with verified payment ID
    setLoadingText('Placing your order...');
    const orderPayload = {
      messId: currentOrder.mess?.id,
      mealType: currentOrder.slot?.mealType || currentOrder.slot?.meal_type || 'Lunch',
      slotTime: currentOrder.slot?.time || '12:00 PM',
      orderType: currentOrder.orderType || 'Dine-in',
      items: currentOrder.items.map(i => ({
        id: i.id, name: i.name, quantity: i.quantity, price: i.price
      })),
      paymentMethod: paymentMethod,
      paymentId: razorpayResponse.razorpay_payment_id,
      notes: currentOrder.notes || ''
    };

    await orderService.placeOrder(orderPayload);
    return true;
  };

  const handlePlaceOrder = async (method) => {
    setLoading(true);
    setError('');
    try {
      if (method === 'UPI' || method === 'Card') {
        // Real Razorpay payment flow
        await handleRazorpayPayment();
      } else {
        // Subscription or Pay on Site — place order directly (no payment needed upfront)
        setLoadingText('Placing your order...');
        const orderPayload = {
          messId: currentOrder.mess?.id,
          mealType: currentOrder.slot?.mealType || currentOrder.slot?.meal_type || 'Lunch',
          slotTime: currentOrder.slot?.time || '12:00 PM',
          orderType: currentOrder.orderType || 'Dine-in',
          items: currentOrder.items.map(i => ({
            id: i.id, name: i.name, quantity: i.quantity, price: i.price
          })),
          paymentMethod: isSubscription ? 'Subscription' : method,
          notes: currentOrder.notes || ''
        };
        await orderService.placeOrder(orderPayload);
      }

      // Success!
      setShowSuccess(true);
      setTimeout(() => {
        clearOrder();
        navigate('/student/order/confirmed');
      }, 1500);
    } catch (err) {
      setError(err?.message || 'Order failed. Please try again.');
      setLoading(false);
      setLoadingText('');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <header className="px-6 pt-12 pb-4 bg-surface shadow-sm z-10 flex items-center gap-4 border-b border-outline-variant">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-surface-container" disabled={loading}>
          <ArrowLeft className="w-6 h-6 text-on-surface" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-headline-md font-extrabold text-on-surface">Step 3: Payment</h1>
        </div>
      </header>

      {error && <Toast message={error} type="error" onClose={() => setError('')} />}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-surface rounded-2xl p-8 mx-6 max-w-sm w-full flex flex-col items-center gap-4 shadow-xl animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-headline-md font-extrabold text-on-surface">Order Placed!</h2>
            <p className="text-body-md text-on-surface-variant text-center">Your order has been placed successfully. Redirecting...</p>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
        
        {/* Order Summary */}
        <div className="bg-surface p-5 rounded-xl shadow-card border border-outline-variant">
          <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider font-bold mb-3">Order Summary</h3>
          {currentOrder.items.map((item, i) => (
            <div key={i} className="flex justify-between py-1.5 text-body-md">
              <span className="text-on-surface">{item.quantity}x {item.name}</span>
              <span className="font-bold text-on-surface">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 mt-3 border-t border-outline-variant">
            <span className="font-bold text-on-surface">Total</span>
            <span className="text-headline-md font-extrabold text-primary-dark">₹{currentOrder.total}</span>
          </div>
        </div>

        {/* Payment Options */}
        <div className="bg-surface p-5 rounded-xl shadow-card border border-outline-variant flex flex-col gap-3">
          
          {isSubscription ? (
            <div className="bg-success/10 text-success px-4 py-4 rounded-xl flex items-center gap-3 border border-success/30">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <span className="font-bold block">Covered by Subscription</span>
                <span className="text-[12px] opacity-75">1 meal will be deducted from your plan</span>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider font-bold mb-1">Select Payment Method</h3>
              
              {/* UPI / Online */}
              <button 
                onClick={() => setPaymentMethod('UPI')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'UPI' ? 'border-primary bg-primary-container/20' : 'border-outline-variant bg-surface'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === 'UPI' ? 'bg-primary/20' : 'bg-surface-container'}`}>
                  <CreditCard className={`w-5 h-5 ${paymentMethod === 'UPI' ? 'text-primary' : 'text-on-surface-variant'}`} />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-bold text-on-surface block">UPI / Online Payment</span>
                  <span className="text-[12px] text-on-surface-variant flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Secure payment via Razorpay
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'UPI' ? 'border-primary' : 'border-outline-variant'}`}>
                  {paymentMethod === 'UPI' && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                </div>
              </button>

              {/* Pay on Site */}
              <button 
                onClick={() => setPaymentMethod('Pay on Site')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'Pay on Site' ? 'border-primary bg-primary-container/20' : 'border-outline-variant bg-surface'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === 'Pay on Site' ? 'bg-primary/20' : 'bg-surface-container'}`}>
                  <Banknote className={`w-5 h-5 ${paymentMethod === 'Pay on Site' ? 'text-primary' : 'text-on-surface-variant'}`} />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-bold text-on-surface block">Pay on Site</span>
                  <span className="text-[12px] text-on-surface-variant">Cash/UPI at counter — Postpaid</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'Pay on Site' ? 'border-primary' : 'border-outline-variant'}`}>
                  {paymentMethod === 'Pay on Site' && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                </div>
              </button>
            </>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center mt-4 gap-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <p className="text-body-md text-on-surface-variant font-bold animate-pulse">
              {loadingText || 'Processing...'}
            </p>
          </div>
        )}

      </main>

      {!loading && !showSuccess && (
        <div className="sticky bottom-0 p-4 bg-surface border-t border-outline-variant z-50">
          <button 
            onClick={() => handlePlaceOrder(isSubscription ? 'Subscription' : paymentMethod)}
            className="w-full bg-primary text-white py-4 rounded-pill font-bold text-lg shadow-card hover:bg-primary-dark transition-transform active:scale-[0.98]"
          >
            {isSubscription ? 'Confirm Order' : paymentMethod === 'Pay on Site' ? `Place Order — ₹${currentOrder.total} (Pay Later)` : `Pay ₹${currentOrder.total} via Razorpay`}
          </button>
        </div>
      )}
    </div>
  );
};

export default PreOrderStep3;
