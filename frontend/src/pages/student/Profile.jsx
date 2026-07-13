import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BottomNav } from '../../components/shared/BottomNav';
import { userService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Building, Settings, HelpCircle, LogOut, ChevronDown, ChevronUp, Save, Lock, Loader2 } from 'lucide-react';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // App Settings toggle
  const [showSettings, setShowSettings] = useState(false);

  // Change Name state
  const [newName, setNewName] = useState(user?.name || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState(null);

  // Reset Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNameSave = async () => {
    setNameMsg(null);
    if (!newName || newName.trim().length < 2) {
      setNameMsg({ text: 'Name must be at least 2 characters.', type: 'error' });
      return;
    }
    setNameSaving(true);
    try {
      const res = await userService.updateName(newName.trim());
      updateUser({ name: newName.trim() });
      setNameMsg({ text: res.message || 'Name updated successfully.', type: 'success' });
    } catch (err) {
      setNameMsg({ text: err.message || 'Failed to update name.', type: 'error' });
    } finally {
      setNameSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    setPwMsg(null);
    if (!currentPassword || !newPassword) {
      setPwMsg({ text: 'Both current and new password are required.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPwMsg({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ text: 'Passwords do not match.', type: 'error' });
      return;
    }
    setPwSaving(true);
    try {
      const res = await userService.resetPassword(currentPassword, newPassword);
      setPwMsg({ text: res.message || 'Password updated', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMsg({ text: err.message || 'Failed to update password.', type: 'error' });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background pb-20">
      <header className="px-6 pt-12 md:pt-0 pb-6 md:pb-2 bg-surface md:bg-transparent shadow-sm md:shadow-none z-10 border-b border-outline-variant md:border-none">
        <h1 className="text-headline-lg font-extrabold text-on-surface md:hidden">Profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
        
        {/* User Info Card */}
        <div className="bg-surface p-6 rounded-2xl shadow-card border border-outline-variant flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center font-extrabold text-primary-dark text-3xl mb-4 shadow-sm">
            {user?.name.charAt(0)}
          </div>
          <h2 className="text-headline-md font-bold text-on-surface">{user?.name}</h2>
          <p className="text-body-md text-on-surface-variant bg-surface-container px-3 py-1 rounded-pill mt-2">Student ID: #8892</p>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col gap-2">
          <h3 className="text-label-md font-bold text-outline uppercase tracking-wider mb-1 px-2">Personal Details</h3>
          <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="flex items-center gap-4 p-4 border-b border-outline-variant">
              <Mail className="w-5 h-5 text-outline" />
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wide">Email</span>
                <span className="text-body-md text-on-surface font-semibold">{user?.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 border-b border-outline-variant">
              <Phone className="w-5 h-5 text-outline" />
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wide">Phone</span>
                <span className="text-body-md text-on-surface font-semibold">{user?.phone}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <Building className="w-5 h-5 text-outline" />
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wide">College/Institute</span>
                <span className="text-body-md text-on-surface font-semibold">{user?.college}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action List */}
        <div className="flex flex-col gap-2">
          <h3 className="text-label-md font-bold text-outline uppercase tracking-wider mb-1 px-2">Settings</h3>
          <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            
            {/* App Settings Toggle */}
            <button 
              onClick={() => setShowSettings(prev => !prev)}
              className="w-full flex items-center justify-between p-4 border-b border-outline-variant hover:bg-surface-container transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <Settings className="w-5 h-5 text-outline" />
                <span className="text-body-md text-on-surface font-bold">App Settings</span>
              </div>
              {showSettings 
                ? <ChevronUp className="w-5 h-5 text-outline" />
                : <ChevronDown className="w-5 h-5 text-outline" />
              }
            </button>

            {/* Expandable Settings Form */}
            {showSettings && (
              <div className="p-5 flex flex-col gap-5 border-b border-outline-variant animate-fadeIn">
                
                {/* Change Name */}
                <div>
                  <label className="text-label-lg font-bold text-on-surface flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-primary" />
                    Change Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {nameMsg && (
                    <p className={`text-label-sm mt-1 ${nameMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {nameMsg.text}
                    </p>
                  )}
                  <button
                    onClick={handleNameSave}
                    disabled={nameSaving}
                    className="mt-3 flex items-center justify-center gap-2 bg-primary text-on-primary font-bold py-2.5 px-5 rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 text-body-md"
                  >
                    {nameSaving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save Name</>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <hr className="border-outline-variant" />

                {/* Reset Password */}
                <div>
                  <label className="text-label-lg font-bold text-on-surface flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-secondary" />
                    Reset Password
                  </label>
                  <div className="flex flex-col gap-3">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Current Password"
                      className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="New Password"
                      className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  {pwMsg && (
                    <p className={`text-label-sm mt-1 ${pwMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {pwMsg.text}
                    </p>
                  )}
                  <button
                    onClick={handlePasswordSave}
                    disabled={pwSaving}
                    className="mt-3 flex items-center justify-center gap-2 bg-primary text-on-primary font-bold py-2.5 px-5 rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 text-body-md"
                  >
                    {pwSaving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                    ) : (
                      <><Lock className="w-4 h-4" /> Update Password</>
                    )}
                  </button>
                </div>
              </div>
            )}

            <button className="w-full flex items-center justify-between p-4 border-b border-outline-variant hover:bg-surface-container transition-colors text-left">
              <div className="flex items-center gap-4">
                <HelpCircle className="w-5 h-5 text-outline" />
                <span className="text-body-md text-on-surface font-bold">Help & Support</span>
              </div>
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-error/10 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <LogOut className="w-5 h-5 text-error" />
                <span className="text-body-md text-error font-bold">Logout</span>
              </div>
            </button>
          </div>
        </div>

      </main>

      <BottomNav variant="student" />
    </div>
  );
};

export default Profile;
