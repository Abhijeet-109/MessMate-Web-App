import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { BottomNav } from '../../components/shared/BottomNav';
import { Plus, Edit2, Trash2, X, Star } from 'lucide-react';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { Toast } from '../../components/shared/Toast';

const EMPTY = { name: '', price: '', totalMeals: '', mealTypes: ['Lunch'], isRecommended: false };
const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner'];

const PlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchPlans = async () => {
    try {
      const data = await adminService.getPlans();
      setPlans(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const openAdd = () => { setForm({ ...EMPTY }); setModal({ mode: 'add' }); };
  const openEdit = (p) => {
    setForm({ name: p.name, price: p.price, totalMeals: p.totalMeals, mealTypes: p.mealTypes || [], isRecommended: p.isRecommended });
    setModal({ mode: 'edit', plan: p });
  };

  const toggleMealType = (mt) => {
    setForm(prev => ({
      ...prev,
      mealTypes: prev.mealTypes.includes(mt) ? prev.mealTypes.filter(m => m !== mt) : [...prev.mealTypes, mt]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { name: form.name, price: Number(form.price), totalMeals: Number(form.totalMeals), mealTypes: form.mealTypes, isRecommended: form.isRecommended };
      if (modal.mode === 'add') await adminService.addPlan(payload);
      else await adminService.updatePlan(modal.plan.id, payload);
      await fetchPlans();
      setModal(null);
      setToast({ message: modal.mode === 'add' ? 'Plan added!' : 'Plan updated!', type: 'success' });
    } catch (err) { setToast({ message: 'Failed to save plan.', type: 'error' }); }
    setSaving(false);
  };

  const handleDelete = (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await adminService.deletePlan(deleteConfirm);
      await fetchPlans();
      setToast({ message: 'Plan deleted.', type: 'success' });
    } catch (err) { setToast({ message: err?.response?.data?.error || 'Failed to delete plan.', type: 'error' }); }
    setDeleteConfirm(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-background pb-20 md:pb-8">
      <header className="px-6 pt-12 pb-4 bg-surface shadow-sm z-10 border-b border-outline-variant flex justify-between items-center">
        <h1 className="text-headline-lg font-extrabold text-on-surface">Subscription Plans</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={openAdd} className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
        ) : (
          <div className="flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-6">
            {plans.map(plan => (
              <div key={plan.id} className={`bg-surface p-5 rounded-xl border-2 shadow-sm flex flex-col gap-3 relative ${plan.isRecommended ? 'border-primary' : 'border-outline-variant'}`}>
                {plan.isRecommended && (
                  <div className="absolute -top-2.5 left-4 bg-primary text-white text-[10px] font-bold px-3 py-0.5 rounded-pill uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3 h-3" /> Recommended
                  </div>
                )}
                <div className="flex justify-between items-start mt-1">
                  <div>
                    <h3 className="font-bold text-headline-md text-on-surface">{plan.name}</h3>
                    <span className="text-headline-lg font-extrabold text-primary-dark">₹{plan.price}</span>
                    <span className="text-body-md text-on-surface-variant">/month</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(plan)} className="p-2 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(plan.id)} className="p-2 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-body-md text-on-surface-variant space-y-1 pt-2 border-t border-outline-variant">
                  <div>📦 {plan.totalMeals} meals total</div>
                  <div>🍽️ {plan.mealTypes?.join(', ') || 'All meals'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-surface rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-outline-variant">
              <h2 className="text-headline-md font-bold text-on-surface">{modal.mode === 'add' ? 'Add Plan' : 'Edit Plan'}</h2>
              <button onClick={() => setModal(null)} className="p-1 rounded-full hover:bg-surface-container"><X className="w-5 h-5 text-on-surface-variant" /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Plan Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface focus:border-primary outline-none" placeholder="Gold Pass" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Price (₹)</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                    className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Total Meals</label>
                  <input type="number" value={form.totalMeals} onChange={e => setForm({...form, totalMeals: e.target.value})}
                    className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface focus:border-primary outline-none" />
                </div>
              </div>
              <div>
                <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Included Meals</label>
                <div className="flex gap-2">
                  {MEAL_OPTIONS.map(mt => (
                    <button key={mt} onClick={() => toggleMealType(mt)}
                      className={`px-4 py-2 rounded-pill text-label-md font-bold transition-colors ${form.mealTypes.includes(mt) ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant border border-outline-variant'}`}>
                      {mt}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isRecommended} onChange={e => setForm({...form, isRecommended: e.target.checked})}
                  className="w-5 h-5 rounded accent-primary" />
                <span className="text-body-md text-on-surface font-bold">Mark as Recommended</span>
              </label>
            </div>
            <div className="p-5 border-t border-outline-variant flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-pill font-bold border border-outline-variant text-on-surface hover:bg-surface-container">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.price || !form.totalMeals}
                className="flex-1 py-3 rounded-pill font-bold bg-primary text-white disabled:opacity-50">
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
            <h3 className="text-headline-md font-bold text-on-surface">Delete Plan?</h3>
            <p className="text-body-md text-on-surface-variant">Are you sure you want to delete this subscription plan? Active subscriptions will not be deleted, but no new users can subscribe to it.</p>
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

export default PlanManagement;
