import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messService } from '../../services/api';
import { ArrowLeft, Star, MapPin, Phone, Info, Clock } from 'lucide-react';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { TimeSlotChip } from '../../components/shared/TimeSlotChip';
import { useOrder } from '../../context/OrderContext';
import { clsx } from 'clsx';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

const MessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { startPreOrder } = useOrder();
  
  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [orderType, setOrderType] = useState('Dine-in');
  const [selectedMealType, setSelectedMealType] = useState('lunch');

  useEffect(() => {
    messService.getMessById(id).then(data => {
      setMess(data);
      // Auto-select the first meal type that has slots
      if (data?.slots) {
        const firstWithSlots = MEAL_TYPES.find(mt => data.slots[mt]?.length > 0);
        if (firstWithSlots) setSelectedMealType(firstWithSlots);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex-1 bg-background flex justify-center items-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>;
  if (!mess) return <div className="flex-1 bg-background flex justify-center items-center text-on-surface">Mess not found</div>;

  // Reset selected slot when meal type changes
  const handleMealTypeChange = (mt) => {
    setSelectedMealType(mt);
    setSelectedSlot('');
  };

  const currentSlots = mess.slots?.[selectedMealType] || [];

  const handleContinue = () => {
    if (selectedSlot) {
      // Pass mealType along with the slot so PreOrderStep knows which meal
      startPreOrder(mess, { time: selectedSlot, mealType: selectedMealType }, orderType);
      navigate('/student/order/step1');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background relative pb-24">
      {/* Header Image */}
      <div className="relative h-64 w-full">
        <img src={mess.thumbnail} alt={mess.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent"></div>
        <button onClick={() => navigate(-1)} className="absolute top-12 left-4 p-2 rounded-full bg-surface/20 backdrop-blur-md text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
          <div className="text-white">
            <h1 className="text-headline-xl font-extrabold">{mess.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="text-body-md font-bold">{mess.rating} ({mess.reviewsCount} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 flex flex-col gap-6">
        
        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface p-3 rounded-xl shadow-sm flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="text-label-md text-on-surface">{mess.distance} away</span>
          </div>
          <div className="bg-surface p-3 rounded-xl shadow-sm flex items-center gap-2">
            <StatusBadge status={mess.isOpen ? 'Available' : 'Closed'} />
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-surface p-5 rounded-xl shadow-card border border-outline-variant flex flex-col gap-4">
          <h2 className="text-headline-md font-bold text-on-surface">Pre-Order Now</h2>
          
          <div className="flex bg-surface-container rounded-pill p-1">
            <button 
              className={clsx("flex-1 py-2 rounded-pill text-body-md font-bold transition-all", orderType === 'Dine-in' ? 'bg-white shadow-sm text-primary-dark' : 'text-on-surface-variant')}
              onClick={() => setOrderType('Dine-in')}
            >Dine-in</button>
            <button 
              className={clsx("flex-1 py-2 rounded-pill text-body-md font-bold transition-all", orderType === 'Parcel' ? 'bg-white shadow-sm text-primary-dark' : 'text-on-surface-variant')}
              onClick={() => setOrderType('Parcel')}
            >Parcel</button>
          </div>

          {/* Meal Type Tabs */}
          <div className="flex gap-2">
            {MEAL_TYPES.map(mt => (
              <button
                key={mt}
                onClick={() => handleMealTypeChange(mt)}
                className={clsx(
                  "px-4 py-1.5 rounded-pill text-label-md font-bold capitalize transition-colors",
                  selectedMealType === mt
                    ? 'bg-primary text-white'
                    : 'bg-surface-container text-on-surface-variant hover:bg-outline/10'
                )}
              >
                {MEAL_LABELS[mt]}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <h3 className="text-label-md text-on-surface flex items-center gap-1">
              <Clock className="w-4 h-4"/> Select {MEAL_LABELS[selectedMealType]} Slot (Today)
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentSlots.length > 0 ? currentSlots.map((slot) => (
                <TimeSlotChip 
                  key={slot.time}
                  time={slot.time}
                  state={slot.capacity === slot.booked ? 'full' : (selectedSlot === slot.time ? 'selected' : 'available')}
                  onClick={setSelectedSlot}
                />
              )) : (
                <p className="text-body-md text-on-surface-variant py-2">No slots available for {MEAL_LABELS[selectedMealType]}.</p>
              )}
            </div>
          </div>
        </div>

        {/* Desktop CTA Button (In-flow and full width inside parent padding) */}
        <div className="hidden md:block">
          <button 
            disabled={!selectedSlot || !mess.isOpen}
            onClick={handleContinue}
            className="w-full bg-primary text-white py-4 rounded-pill font-bold text-lg shadow-card disabled:opacity-50 disabled:bg-outline transition-transform active:scale-[0.98]"
          >
            {mess.isOpen ? 'Continue to Menu' : 'Mess is Closed'}
          </button>
        </div>

      </div>

      {/* Floating Action Button — Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-4 bg-surface border-t border-outline-variant z-50 md:hidden">
        <button 
          disabled={!selectedSlot || !mess.isOpen}
          onClick={handleContinue}
          className="w-full bg-primary text-white py-4 rounded-pill font-bold text-lg shadow-card disabled:opacity-50 disabled:bg-outline transition-transform active:scale-[0.98]"
        >
          {mess.isOpen ? 'Continue to Menu' : 'Mess is Closed'}
        </button>
      </div>
    </div>
  );
};

export default MessDetail;
