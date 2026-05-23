import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { ArrowLeft, User, Lock, Mail, Building, Phone, UtensilsCrossed, CheckCircle2, Loader2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    college: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setForceLight } = useTheme();

  useEffect(() => {
    setForceLight(true);
    return () => setForceLight(false);
  }, [setForceLight]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Name, email, and password are required.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.register(
        form.name.trim(),
        form.email.trim().toLowerCase(),
        form.password,
        form.phone.trim() || undefined,
        form.college.trim() || undefined
      );
      // Set user in auth context
      login(data.user);
      navigate('/student/home');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            Pre-Order Your Meal.<br/>Skip the Wait.
          </h1>
          <ul className="flex flex-col gap-5">
            <li className="flex items-center gap-4 text-xl font-medium">
              <div className="bg-white/20 p-1.5 rounded-full"><CheckCircle2 className="w-6 h-6" /></div>
              Browse mess menus in real time
            </li>
            <li className="flex items-center gap-4 text-xl font-medium">
              <div className="bg-white/20 p-1.5 rounded-full"><CheckCircle2 className="w-6 h-6" /></div>
              Pre-book your slot before arriving
            </li>
            <li className="flex items-center gap-4 text-xl font-medium">
              <div className="bg-white/20 p-1.5 rounded-full"><CheckCircle2 className="w-6 h-6" /></div>
              Pay online or at the counter
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
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-surface-container self-start mb-6 md:hidden">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>

          <h1 className="text-headline-xl font-extrabold text-on-surface mb-2">Create Account</h1>
          <p className="text-body-lg text-on-surface-variant mb-6">Join MessMate to pre-order meals and skip the wait.</p>

          {error && (
            <div className="bg-error-container text-error px-4 py-3 rounded-xl text-body-md font-bold mb-4 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-12 md:pb-0">
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface-variant ml-1">Full Name *</label>
              <div className="relative flex items-center">
                <User className="absolute left-4 w-5 h-5 text-outline" />
                <input 
                  type="text" 
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface-variant ml-1">College/Institute</label>
              <div className="relative flex items-center">
                <Building className="absolute left-4 w-5 h-5 text-outline" />
                <input 
                  type="text" 
                  name="college"
                  value={form.college}
                  onChange={handleChange}
                  placeholder="MIT Pune"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface-variant ml-1">Phone Number</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-4 w-5 h-5 text-outline" />
                <input 
                  type="tel" 
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface-variant ml-1">Email *</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-5 h-5 text-outline" />
                <input 
                  type="email" 
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface-variant ml-1">Password *</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-5 h-5 text-outline" />
                <input 
                  type="password" 
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface-variant ml-1">Confirm Password *</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-5 h-5 text-outline" />
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white py-4 mt-4 rounded-pill font-bold text-lg shadow-card hover:bg-primary-dark transition-colors flex justify-center items-center h-14 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
          
          <div className="mt-auto pb-8 pt-8 md:pt-12 text-center md:mt-4">
            <p className="text-body-md text-on-surface-variant">
              Already have an account? <button onClick={() => navigate('/student/login')} className="text-primary font-bold hover:underline">Login here</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
