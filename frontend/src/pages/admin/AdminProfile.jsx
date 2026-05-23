import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BottomNav } from '../../components/shared/BottomNav';
import { Toast } from '../../components/shared/Toast';
import { adminService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { LogOut, Store, ChevronDown, ChevronUp, Save, MapPin, Phone, Clock, Sparkles, Image, Loader2 } from 'lucide-react';

const AdminProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showMessSetup, setShowMessSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Mess detail form state
  const [messData, setMessData] = useState({
    name: '',
    location: '',
    contact: '',
    thumbnail: '',
    todaysSpecial: '',
    hoursBreakfast: '',
    hoursLunch: '',
    hoursDinner: '',
  });

  // Thumbnail preview image options
  const presetImages = [
    { label: 'Veggie Bowl', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop' },
    { label: 'Tiffin Service', url: 'https://images.unsplash.com/photo-1589302168068-964664d93cb0?q=80&w=400&auto=format&fit=crop' },
    { label: 'Fresh Greens', url: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=400&auto=format&fit=crop' },
    { label: 'Indian Thali', url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=400&auto=format&fit=crop' },
    { label: 'South Indian', url: 'https://images.unsplash.com/photo-1630383249896-424e482df921?q=80&w=400&auto=format&fit=crop' },
    { label: 'Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400&auto=format&fit=crop' },
  ];

  // Load mess profile when section is opened
  useEffect(() => {
    if (showMessSetup) {
      loadMessProfile();
    }
  }, [showMessSetup]);

  const loadMessProfile = async () => {
    setLoading(true);
    try {
      const data = await adminService.getMessProfile();
      setMessData({
        name: data.name || '',
        location: data.location || '',
        contact: data.contact || '',
        thumbnail: data.thumbnail || '',
        todaysSpecial: data.todays_special || '',
        hoursBreakfast: data.hours_breakfast || '',
        hoursLunch: data.hours_lunch || '',
        hoursDinner: data.hours_dinner || '',
      });
    } catch (err) {
      setToast({ message: 'Failed to load mess details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.updateMessProfile({
        name: messData.name || undefined,
        location: messData.location || undefined,
        contact: messData.contact || undefined,
        thumbnail: messData.thumbnail || undefined,
        todaysSpecial: messData.todaysSpecial || undefined,
        hoursBreakfast: messData.hoursBreakfast || undefined,
        hoursLunch: messData.hoursLunch || undefined,
        hoursDinner: messData.hoursDinner || undefined,
      });
      setToast({ message: 'Mess details updated successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to save.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const updateField = (field, value) => {
    setMessData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex-1 flex flex-col bg-background pb-20">
      <header className="px-6 pt-12 pb-6 bg-surface shadow-sm z-10 border-b border-outline-variant">
        <h1 className="text-headline-lg font-extrabold text-on-surface">Owner Profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
        
        {/* Owner Info Card */}
        <div className="bg-surface p-6 rounded-2xl shadow-card border border-outline-variant flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center font-extrabold text-secondary text-3xl mb-4 shadow-sm">
            {user?.name.charAt(0)}
          </div>
          <h2 className="text-headline-md font-bold text-on-surface">{user?.name}</h2>
          <p className="text-body-md text-on-surface-variant bg-surface-container px-3 py-1 rounded-pill mt-2">Owner: {messData.name || 'Your Mess'}</p>
        </div>

        {/* Mess Details Setup */}
        <div className="flex flex-col gap-2">
          <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            
            {/* Toggle Button */}
            <button 
              onClick={() => setShowMessSetup(prev => !prev)}
              className="w-full flex items-center justify-between p-4 border-b border-outline-variant hover:bg-surface-container transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <Store className="w-5 h-5 text-primary" />
                <span className="text-body-md text-on-surface font-bold">Mess Details Setup</span>
              </div>
              {showMessSetup 
                ? <ChevronUp className="w-5 h-5 text-outline" />
                : <ChevronDown className="w-5 h-5 text-outline" />
              }
            </button>

            {/* Expandable Form */}
            {showMessSetup && (
              <div className="p-5 flex flex-col gap-5 animate-fadeIn">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-3 text-body-md text-on-surface-variant">Loading mess details...</span>
                  </div>
                ) : (
                  <>
                    {/* Thumbnail Section */}
                    <div>
                      <label className="text-label-lg font-bold text-on-surface flex items-center gap-2 mb-3">
                        <Image className="w-4 h-4 text-primary" />
                        Card Image / Thumbnail
                      </label>
                      
                      {/* Current Preview */}
                      {messData.thumbnail && (
                        <div className="mb-3 rounded-xl overflow-hidden border border-outline-variant shadow-sm" style={{ maxHeight: '160px' }}>
                          <img 
                            src={messData.thumbnail} 
                            alt="Current thumbnail"
                            className="w-full h-40 object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      
                      {/* Preset Image Picker */}
                      <p className="text-label-md text-on-surface-variant mb-2">Choose a preset image:</p>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {presetImages.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => updateField('thumbnail', img.url)}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                              messData.thumbnail === img.url 
                                ? 'border-primary shadow-md ring-2 ring-primary/30' 
                                : 'border-outline-variant hover:border-primary/50'
                            }`}
                          >
                            <img src={img.url} alt={img.label} className="w-full h-16 object-cover" />
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-0.5 text-center">
                              {img.label}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Or custom URL */}
                      <input
                        type="text"
                        value={messData.thumbnail}
                        onChange={e => updateField('thumbnail', e.target.value)}
                        placeholder="Or paste a custom image URL..."
                        className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    {/* Divider */}
                    <hr className="border-outline-variant" />

                    {/* Today's Special */}
                    <div>
                      <label className="text-label-lg font-bold text-on-surface flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-warning" />
                        Today's Special
                      </label>
                      <input
                        type="text"
                        value={messData.todaysSpecial}
                        onChange={e => updateField('todaysSpecial', e.target.value)}
                        placeholder="e.g. Dal Rice, Paneer Thali..."
                        className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <p className="text-label-sm text-on-surface-variant mt-1">
                        Leave empty to auto-detect from your lunch menu.
                      </p>
                    </div>

                    {/* Divider */}
                    <hr className="border-outline-variant" />

                    {/* Location */}
                    <div>
                      <label className="text-label-lg font-bold text-on-surface flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-error" />
                        Location
                      </label>
                      <input
                        type="text"
                        value={messData.location}
                        onChange={e => updateField('location', e.target.value)}
                        placeholder="e.g. Near MIT College, Kothrud, Pune"
                        className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    {/* Contact */}
                    <div>
                      <label className="text-label-lg font-bold text-on-surface flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-primary" />
                        Contact Number
                      </label>
                      <input
                        type="text"
                        value={messData.contact}
                        onChange={e => updateField('contact', e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    {/* Divider */}
                    <hr className="border-outline-variant" />

                    {/* Operating Hours */}
                    <div>
                      <label className="text-label-lg font-bold text-on-surface flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-secondary" />
                        Operating Hours
                      </label>
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="text-label-md text-on-surface-variant mb-1 block">Breakfast</label>
                          <input
                            type="text"
                            value={messData.hoursBreakfast}
                            onChange={e => updateField('hoursBreakfast', e.target.value)}
                            placeholder="e.g. 7:00 AM - 10:00 AM"
                            className="w-full px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-label-md text-on-surface-variant mb-1 block">Lunch</label>
                          <input
                            type="text"
                            value={messData.hoursLunch}
                            onChange={e => updateField('hoursLunch', e.target.value)}
                            placeholder="e.g. 12:00 PM - 3:00 PM"
                            className="w-full px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-label-md text-on-surface-variant mb-1 block">Dinner</label>
                          <input
                            type="text"
                            value={messData.hoursDinner}
                            onChange={e => updateField('hoursDinner', e.target.value)}
                            placeholder="e.g. 7:00 PM - 10:00 PM"
                            className="w-full px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-bold py-3 rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Logout Button */}
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <BottomNav variant="admin" />
    </div>
  );
};

export default AdminProfile;
