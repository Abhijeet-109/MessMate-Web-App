import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { ProtectedRoute } from './context/AuthContext';
import { StudentLayout } from './components/layout/StudentLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Auth Pages
import Splash from './pages/auth/Splash';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLogin from './pages/auth/AdminLogin';
import RegisterOwner from './pages/auth/RegisterOwner';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import Browse from './pages/student/Browse';
import MessDetail from './pages/student/MessDetail';
import PreOrderStep1 from './pages/student/PreOrderStep1';
import PreOrderStep2 from './pages/student/PreOrderStep2';
import PreOrderStep3 from './pages/student/PreOrderStep3';
import OrderConfirmation from './pages/student/OrderConfirmation';
import MyOrders from './pages/student/MyOrders';
import Subscription from './pages/student/Subscription';
import Notifications from './pages/student/Notifications';
import Profile from './pages/student/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import LiveOrderQueue from './pages/admin/LiveOrderQueue';
import MenuManagement from './pages/admin/MenuManagement';
import SlotSettings from './pages/admin/SlotSettings';
import SubscriberManagement from './pages/admin/SubscriberManagement';
import BillingRecords from './pages/admin/BillingRecords';
import AdminProfile from './pages/admin/AdminProfile';
import PlanManagement from './pages/admin/PlanManagement';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OrderProvider>
          <Router>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Splash />} />
              <Route path="/student/login" element={<Login />} />
              <Route path="/student/register" element={<Register />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/register" element={<RegisterOwner />} />

              {/* Student Routes */}
              <Route path="/student" element={
                <ProtectedRoute allowedRole="student">
                  <StudentLayout />
                </ProtectedRoute>
              }>
                <Route path="home" element={<StudentDashboard />} />
                <Route path="browse" element={<Browse />} />
                <Route path="mess/:id" element={<MessDetail />} />
                <Route path="order/step1" element={<PreOrderStep1 />} />
                <Route path="order/step2" element={<PreOrderStep2 />} />
                <Route path="order/step3" element={<PreOrderStep3 />} />
                <Route path="order/confirmed" element={<OrderConfirmation />} />
                <Route path="orders" element={<MyOrders />} />
                <Route path="subscription" element={<Subscription />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="orders" element={<LiveOrderQueue />} />
                <Route path="menu" element={<MenuManagement />} />
                <Route path="slots" element={<SlotSettings />} />
                <Route path="subscribers" element={<SubscriberManagement />} />
                <Route path="billing" element={<BillingRecords />} />
                <Route path="plans" element={<PlanManagement />} />
                <Route path="profile" element={<AdminProfile />} />
              </Route>
            </Routes>
          </Router>
        </OrderProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
