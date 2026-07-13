import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { BottomNav } from '../../components/shared/BottomNav';
import { Plus, Edit2, Trash2, X, Clock } from 'lucide-react';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { Toast } from '../../components/shared/Toast';

const EMPTY_SLOT = { mealType: 'lunch', time: '', capacity: 15 };

const SlotSettings = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lunch');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_SLOT);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchSlots = async () => {
    try {
      const data = await adminService.getSlots();
      setSlots(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchSlots(); }, []);

  const currentSlots = slots.filter(s => (s.mealType || s.meal_type) === activeTab);

  const openAdd = () => {
    setForm({ ...EMPTY_SLOT, mealType: activeTab });
    setModal({ mode: 'add' });
  };

  const openEdit = (slot) => {
    setForm({ mealType: slot.mealType || slot.meal_type, time: slot.time, capacity: slot.capacity });
    setModal({ mode: 'edit', slot });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await adminService.addSlot(form);
      } else {
        await adminService.updateSlot(modal.slot.id, form);
      }
      await fetchSlots();
      setModal(null);
      setToast({ message: modal.mode === 'add' ? 'Slot added!' : 'Slot updated!', type: 'success' });
    } catch (err) { setToast({ message: 'Failed to save slot.', type: 'error' }); }
    setSaving(false);
  };

  const handleDelete = (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await adminService.deleteSlot(deleteConfirm);
      setSlots(prev => prev.filter(s => s.id !== deleteConfirm));
      setToast({ message: 'Slot deleted.', type: 'success' });
    } catch (err) { setToast({ message: err?.response?.data?.error || 'Failed to delete slot.', type: 'error' }); }
    setDeleteConfirm(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-background pb-20">
      <header className="px-6 pt-12 pb-4 bg-surface shadow-sm z-10 border-b border-outline-variant flex justify-between items-center">
        <h1 className="text-headline-lg font-extrabold text-on-surface">Slot Settings</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={openAdd} className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="px-6 py-4 bg-surface border-b border-outline-variant flex gap-4 overflow-x-auto no-scrollbar">
        {['breakfast', 'lunch', 'dinner'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-pill font-bold capitalize text-label-md whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            {tab}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
        ) : currentSlots.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant border border-outline-variant border-dashed rounded-xl">
            No slots for {activeTab}. Add one!
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {currentSlots.map(slot => {
              const utilization = slot.booked / slot.capacity;
              return (
                <div key={slot.id} className="bg-surface p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-lg">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface text-lg">{slot.time}</h3>
                        <p className="text-label-md text-on-surface-variant capitalize">{slot.mealType || slot.meal_type}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(slot)} className="p-2 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(slot.id)} className="p-2 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Capacity bar */}
                  <div>
                    <div className="flex justify-between text-label-md mb-1">
                      <span className="text-on-surface-variant font-bold">{slot.booked}/{slot.capacity} booked</span>
                      <span className={`font-bold ${utilization >= 1 ? 'text-error' : utilization >= 0.7 ? 'text-warning' : 'text-success'}`}>
                        {Math.round(utilization * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${utilization >= 1 ? 'bg-error' : utilization >= 0.7 ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${Math.min(100, utilization * 100)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-surface rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-outline-variant">
              <h2 className="text-headline-md font-bold text-on-surface">{modal.mode === 'add' ? 'Add Slot' : 'Edit Slot'}</h2>
              <button onClick={() => setModal(null)} className="p-1 rounded-full hover:bg-surface-container"><X className="w-5 h-5 text-on-surface-variant" /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Meal Type</label>
                <select value={form.mealType} onChange={e => setForm({...form, mealType: e.target.value})}
                  className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface focus:border-primary outline-none">
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
              <div>
                <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Time (e.g. 12:30 PM)</label>
                <input value={form.time} onChange={e => setForm({...form, time: e.target.value})}
                  className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface focus:border-primary outline-none" placeholder="12:30 PM" />
              </div>
              <div>
                <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: Number(e.target.value)})}
                  className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface focus:border-primary outline-none" />
              </div>
            </div>
            <div className="p-5 border-t border-outline-variant flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-pill font-bold border border-outline-variant text-on-surface hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.time}
                className="flex-1 py-3 rounded-pill font-bold bg-primary text-white disabled:opacity-50 transition-all">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-headline-md font-bold text-on-surface">Delete Slot?</h3>
            <p className="text-body-md text-on-surface-variant">Are you sure you want to delete this slot? Existing bookings may be affected.</p>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-pill font-bold border border-outline-variant text-on-surface hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 rounded-pill font-bold bg-red-500 text-white hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav variant="admin" />
    </div>
  );
};

export default SlotSettings;
