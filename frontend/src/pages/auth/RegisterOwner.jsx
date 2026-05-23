import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { ArrowLeft, User, Lock, Mail, Phone, UtensilsCrossed, MapPin, Building2, Loader2, CheckCircle2 } from 'lucide-react';

const RegisterOwner = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    messName: '',
    messLocation: '',
    messContact: '',
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

    if (!form.name.trim() || !form.email.trim() || !form.password || !form.messName.trim()) {
      setError('Owner name, email, password, and mess name are required.');
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
      const data = await authService.registerOwner({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        messName: form.messName.trim(),
        messLocation: form.messLocation.trim() || undefined,
        messContact: form.messContact.trim() || undefined,
      });
      login(data.user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background md:bg-white">

      {/* LEFT PANEL - Desktop Only */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-secondary to-primary-dark text-white relative overflow-hidden">
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 -left-20 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>
          <span className="text-[28px] font-extrabold tracking-tight">MessMate</span>
        </div>

        <div className="relative z-10 mb-20">
          <h1 className="text-[48px] lg:text-[56px] font-extrabold leading-[1.1] mb-8">
            Manage Your Mess.<br/>Digitally.
          </h1>
          <ul className="flex flex-col gap-5">
            <li className="flex items-center gap-4 text-xl font-medium">
              <div className="bg-white/20 p-1.5 rounded-full"><CheckCircle2 className="w-6 h-6" /></div>
              Real-time order queue management
            </li>
            <li className="flex items-center gap-4 text-xl font-medium">
              <div className="bg-white/20 p-1.5 rounded-full"><CheckCircle2 className="w-6 h-6" /></div>
              Menu, slots & subscription plans
            </li>
            <li className="flex items-center gap-4 text-xl font-medium">
              <div className="bg-white/20 p-1.5 rounded-full"><CheckCircle2 className="w-6 h-6" /></div>
              Billing analytics & CSV exports
            </li>
          </ul>
        </div>

        <div className="relative z-10 text-white/50 text-sm font-bold">© 2026 MessMate</div>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 md:px-12 lg:px-24 overflow-y-auto">
        <div className="w-full max-w-[420px] mx-auto flex flex-col">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-surface-container self-start mb-4 md:hidden">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>

          <h1 className="text-headline-xl font-extrabold text-on-surface mb-1">Register Your Mess</h1>
          <p className="text-body-lg text-on-surface-variant mb-5">Create an owner account and set up your mess in one step.</p>

          {error && (
            <div className="bg-error-container text-error px-4 py-3 rounded-xl text-body-md font-bold mb-4 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Owner Details Section */}
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider font-bold mt-1">Owner Details</p>

            <div className="relative flex items-center">
              <User className="absolute left-4 w-5 h-5 text-outline" />
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Owner Full Name *"
                required disabled={loading}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors disabled:opacity-50" />
            </div>

            <div className="relative flex items-center">
              <Mail className="absolute left-4 w-5 h-5 text-outline" />
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email *"
                required disabled={loading}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors disabled:opacity-50" />
            </div>

            <div className="relative flex items-center">
              <Phone className="absolute left-4 w-5 h-5 text-outline" />
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number"
                disabled={loading}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors disabled:opacity-50" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-5 h-5 text-outline" />
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password *"
                  required minLength={6} disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors disabled:opacity-50" />
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-5 h-5 text-outline" />
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm *"
                  required disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors disabled:opacity-50" />
              </div>
            </div>

            {/* Mess Details Section */}
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider font-bold mt-2">Mess Details</p>

            <div className="relative flex items-center">
              <Building2 className="absolute left-4 w-5 h-5 text-outline" />
              <input type="text" name="messName" value={form.messName} onChange={handleChange} placeholder="Mess Name *"
                required disabled={loading}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors disabled:opacity-50" />
            </div>

            <div className="relative flex items-center">
              <MapPin className="absolute left-4 w-5 h-5 text-outline" />
              <input type="text" name="messLocation" value={form.messLocation} onChange={handleChange} placeholder="Mess Location / Address"
                disabled={loading}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors disabled:opacity-50" />
            </div>

            <div className="relative flex items-center">
              <Phone className="absolute left-4 w-5 h-5 text-outline" />
              <input type="tel" name="messContact" value={form.messContact} onChange={handleChange} placeholder="Mess Contact Number"
                disabled={loading}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-colors disabled:opacity-50" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-4 mt-3 rounded-pill font-bold text-lg shadow-card hover:bg-primary-dark transition-colors flex justify-center items-center h-14 disabled:opacity-50">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create Mess & Sign Up'}
            </button>
          </form>

          <div className="pb-8 pt-6 text-center">
            <p className="text-body-md text-on-surface-variant">
              Already registered? <button onClick={() => navigate('/admin/login')} className="text-primary font-bold hover:underline">Login here</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterOwner;
