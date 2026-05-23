import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { ArrowLeft, Lock, Mail, UtensilsCrossed, CheckCircle2 } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('owner@annapurna.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authService.loginAdmin(email, password);
      login(data.user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { setForceLight } = useTheme();

  useEffect(() => {
    setForceLight(true);
    return () => setForceLight(false);
  }, [setForceLight]);

  return (
    <div className="min-h-screen flex w-full bg-background md:bg-white">

      {/* LEFT PANEL - Desktop Only */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-primary to-primary-dark text-white relative overflow-hidden">
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 -left-20 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>
          <span className="text-[28px] font-extrabold tracking-tight">MessMate</span>
        </div>

        <div className="relative z-10 mb-20">
          <h1 className="text-[48px] lg:text-[64px] font-extrabold leading-[1.1] mb-8">
            Manage Your Mess.<br />Smarter.
          </h1>
          <ul className="flex flex-col gap-5">
            <li className="flex items-center gap-4 text-xl font-medium">
              <div className="bg-white/20 p-1.5 rounded-full"><CheckCircle2 className="w-6 h-6" /></div>
              Accept orders with one tap
            </li>
            <li className="flex items-center gap-4 text-xl font-medium">
              <div className="bg-white/20 p-1.5 rounded-full"><CheckCircle2 className="w-6 h-6" /></div>
              Track subscribers and attendance
            </li>
            <li className="flex items-center gap-4 text-xl font-medium">
              <div className="bg-white/20 p-1.5 rounded-full"><CheckCircle2 className="w-6 h-6" /></div>
              View daily revenue and analytics
            </li>
          </ul>
        </div>

        <div className="relative z-10 text-white/50 text-sm font-bold">
          © 2026 MessMate
        </div>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-24">
        <div className="w-full max-w-[400px] mx-auto flex flex-col h-full md:h-auto">

          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-surface-container self-start mb-8 md:hidden">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>

          <div className="bg-primary-container text-primary-dark px-3 py-1 rounded-md self-start font-bold text-[12px] uppercase tracking-wider mb-4">
            Admin Portal
          </div>

          <h1 className="text-headline-xl font-extrabold text-on-surface mb-2">Mess Owner Login</h1>
          <p className="text-body-lg text-on-surface-variant mb-8">Manage your subscribers, orders, and daily menu.</p>

          {error && <div className="bg-error-container text-error p-3 rounded-lg mb-6 text-body-md font-semibold">{error}</div>}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface-variant ml-1">Email</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-5 h-5 text-outline" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface-variant ml-1">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-5 h-5 text-outline" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-white py-4 mt-8 rounded-pill font-bold text-lg shadow-card hover:bg-secondary/90 transition-colors disabled:opacity-70 flex justify-center items-center h-14"
            >
              {loading ? <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin"></div> : 'Login to Dashboard'}
            </button>
          </form>

          <div className="mt-auto pb-8 pt-8 md:pt-12 text-center md:mt-4 flex flex-col gap-3">
            <p className="text-body-md text-on-surface-variant">
              New mess owner? <button onClick={() => navigate('/admin/register')} className="text-primary font-bold hover:underline">Register your mess</button>
            </p>
            <button onClick={() => navigate('/student/login')} className="text-primary font-bold hover:underline text-body-md">Go to Student Portal</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
