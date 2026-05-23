// Mock data representing the backend database for MessMate

export const MESS_DATA = [
  {
    id: 'm1',
    name: 'Annapurna Mess',
    rating: 4.5,
    reviewsCount: 120,
    distance: '1.2 km',
    location: 'Near MIT College, Kothrud, Pune',
    contact: '+91 98765 43210',
    isOpen: true,
    thumbnail: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop',
    todaysSpecial: 'Special Thali',
    hours: {
      breakfast: '7:00 AM - 10:00 AM',
      lunch: '12:00 PM - 3:00 PM',
      dinner: '7:00 PM - 10:00 PM',
    },
    menu: {
      breakfast: [
        { id: 'b1', name: 'Poha', price: 30, isAvailable: true, type: 'veg' },
        { id: 'b2', name: 'Upma', price: 25, isAvailable: true, type: 'veg' },
        { id: 'b3', name: 'Tea', price: 10, isAvailable: true, type: 'veg' },
        { id: 'b4', name: 'Idli Sambar', price: 40, isAvailable: false, type: 'veg' },
      ],
      lunch: [
        { id: 'l1', name: 'Dal Rice', price: 60, isAvailable: true, type: 'veg' },
        { id: 'l2', name: 'Chapati Sabji', price: 50, isAvailable: true, type: 'veg' },
        { id: 'l3', name: 'Special Thali', price: 80, isAvailable: true, type: 'veg' },
        { id: 'l4', name: 'Buttermilk', price: 15, isAvailable: true, type: 'veg' },
      ],
      dinner: [
        { id: 'd1', name: 'Roti Sabji', price: 55, isAvailable: true, type: 'veg' },
        { id: 'd2', name: 'Rice Dal Fry', price: 50, isAvailable: true, type: 'veg' },
      ]
    },
    slots: {
      lunch: [
        { time: '12:00 PM', capacity: 15, booked: 8 },
        { time: '12:30 PM', capacity: 15, booked: 15 }, // Full
        { time: '1:00 PM', capacity: 15, booked: 3 },
        { time: '1:30 PM', capacity: 15, booked: 0 },
        { time: '2:00 PM', capacity: 15, booked: 0 },
      ]
    }
  },
  {
    id: 'm2',
    name: 'Shree Krishna Tiffin',
    rating: 4.2,
    reviewsCount: 85,
    distance: '0.8 km',
    location: 'Karve Nagar, Pune',
    contact: '+91 99887 76655',
    isOpen: true,
    thumbnail: 'https://images.unsplash.com/photo-1589302168068-964664d93cb0?q=80&w=400&auto=format&fit=crop',
    todaysSpecial: 'Paneer Masala',
    hours: {
      breakfast: '7:30 AM - 10:30 AM',
      lunch: '12:30 PM - 3:30 PM',
      dinner: '7:30 PM - 10:30 PM',
    },
    menu: {
      breakfast: [{ id: 'b1', name: 'Misal Pav', price: 50, isAvailable: true, type: 'veg' }],
      lunch: [{ id: 'l1', name: 'Veg Thali', price: 70, isAvailable: true, type: 'veg' }],
      dinner: [{ id: 'd1', name: 'Mini Thali', price: 60, isAvailable: true, type: 'veg' }]
    },
    slots: {
      lunch: [
        { time: '12:30 PM', capacity: 10, booked: 5 },
        { time: '1:00 PM', capacity: 10, booked: 2 },
      ]
    }
  },
  {
    id: 'm3',
    name: 'Maa Ki Rasoi',
    rating: 3.9,
    reviewsCount: 42,
    distance: '2.5 km',
    location: 'FC Road, Pune',
    contact: '+91 91234 56789',
    isOpen: false,
    thumbnail: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=400&auto=format&fit=crop',
    todaysSpecial: 'Rajma Chawal',
    hours: {
      breakfast: '8:00 AM - 11:00 AM',
      lunch: '1:00 PM - 4:00 PM',
      dinner: '8:00 PM - 11:00 PM',
    },
    menu: { breakfast: [], lunch: [], dinner: [] },
    slots: { lunch: [] }
  }
];

export const MOCK_USER = {
  id: 'u1',
  name: 'Abhijeet Kumar',
  email: 'abhijeet@example.com',
  phone: '+91 98765 43210',
  college: 'MIT Pune',
  role: 'student',
  subscription: {
    isActive: true,
    planName: 'Monthly Unlimited',
    messId: 'm1',
    messName: 'Annapurna Mess',
    mealsRemaining: 18,
    totalMeals: 30,
    expiresAt: 'Jun 15, 2026',
    noShowCount: 1,
    maxNoShows: 3
  }
};

export const MOCK_OWNER = {
  id: 'o1',
  name: 'Rahul Owner',
  email: 'owner@annapurna.com',
  role: 'admin',
  messId: 'm1'
};

export const MOCK_ORDERS = [
  {
    id: 'MM-1234',
    messId: 'm1',
    messName: 'Annapurna Mess',
    mealType: 'Lunch',
    slotTime: '12:30 PM',
    orderType: 'Dine-in',
    items: [
      { id: 'l1', name: 'Dal Rice', quantity: 1, price: 60 },
      { id: 'l2', name: 'Chapati Sabji', quantity: 1, price: 50 }
    ],
    total: 110,
    status: 'Preparing', // Placed, Accepted, Preparing, Ready, Completed, Cancelled, No-show
    paymentMethod: 'Subscription',
    createdAt: '2026-05-17T10:30:00Z',
    estimatedReadyTime: '~12:25 PM',
    notes: 'Less spicy'
  },
  {
    id: 'MM-1230',
    messId: 'm2',
    messName: 'Shree Krishna Tiffin',
    mealType: 'Dinner',
    slotTime: '7:00 PM',
    orderType: 'Parcel',
    items: [
      { id: 'd1', name: 'Mini Thali', quantity: 1, price: 60 }
    ],
    total: 60,
    status: 'Accepted',
    paymentMethod: 'UPI',
    createdAt: '2026-05-16T18:00:00Z',
    estimatedReadyTime: '~6:55 PM',
    notes: ''
  }
];

export const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'success', message: 'Your order #MM-1234 was accepted by Annapurna Mess', timestamp: '2 min ago', read: false },
  { id: 'n2', type: 'success', message: 'Your food is ready for pickup!', timestamp: '15 min ago', read: false },
  { id: 'n3', type: 'warning', message: 'Your subscription expires in 5 days. Renew now.', timestamp: '2 hours ago', read: true },
  { id: 'n4', type: 'error', message: 'No-show detected. 1 meal deducted from your plan.', timestamp: 'Yesterday', read: true },
  { id: 'n5', type: 'info', message: 'New mess added near you: Maa Ki Rasoi', timestamp: '2 days ago', read: true },
];

export const MOCK_PLANS = [
  { id: 'p1', name: 'Basic Plan', price: 2500, meals: 30, types: ['Lunch'], isRecommended: false },
  { id: 'p2', name: 'Standard Plan', price: 4000, meals: 60, types: ['Lunch', 'Dinner'], isRecommended: true },
  { id: 'p3', name: 'Premium Plan', price: 5500, meals: 90, types: ['Breakfast', 'Lunch', 'Dinner'], isRecommended: false },
];
