import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BottomNav } from '../../components/shared/BottomNav';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Building, Settings, HelpCircle, LogOut } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
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
            <button className="w-full flex items-center justify-between p-4 border-b border-outline-variant hover:bg-surface-container transition-colors text-left">
              <div className="flex items-center gap-4">
                <Settings className="w-5 h-5 text-outline" />
                <span className="text-body-md text-on-surface font-bold">App Settings</span>
              </div>
            </button>
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
