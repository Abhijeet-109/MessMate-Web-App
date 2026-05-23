import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { BottomNav } from '../../components/shared/BottomNav';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { Toast } from '../../components/shared/Toast';

const EMPTY_ITEM = { name: '', price: '', mealType: 'lunch', foodType: 'veg' };

const MenuManagement = () => {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('lunch');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', item }
  const [form, setForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchMenu = async () => {
    try {
      const data = await adminService.getMenu();
      setItems(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchMenu(); }, []);

  const currentItems = items.filter(i => i.mealType === activeTab);

  const openAdd = () => {
    setForm({ ...EMPTY_ITEM, mealType: activeTab });
    setModal({ mode: 'add' });
  };

  const openEdit = (item) => {
    setForm({ name: item.name, price: item.price, mealType: item.mealType, foodType: item.foodType });
    setModal({ mode: 'edit', item });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        const autoId = `${req_messId()}-${form.mealType.charAt(0)}${Date.now()}`;
        await adminService.addMenuItem({
          id: autoId,
          name: form.name, price: Number(form.price),
          mealType: form.mealType, foodType: form.foodType
        });
      } else {
        await adminService.updateMenuItem(modal.item.id, {
          name: form.name, price: Number(form.price),
          mealType: form.mealType, foodType: form.foodType
        });
      }
      await fetchMenu();
      setModal(null);
      setToast({ message: modal.mode === 'add' ? 'Menu item added!' : 'Menu item updated!', type: 'success' });
    } catch (err) { setToast({ message: 'Failed to save item.', type: 'error' }); }
    setSaving(false);
  };

  // helper to generate a unique menu item id
  function req_messId() { return 'm1'; }


  const handleDelete = (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await adminService.deleteMenuItem(deleteConfirm);
      setItems(prev => prev.filter(i => i.id !== deleteConfirm));
      setToast({ message: 'Menu item deleted.', type: 'success' });
    } catch (err) { setToast({ message: 'Failed to delete item.', type: 'error' }); }
    setDeleteConfirm(null);
  };

  const handleToggle = async (id) => {
    try {
      await adminService.toggleMenuAvailability(id);
      setItems(prev => prev.map(i => i.id === id ? { ...i, isAvailable: !i.isAvailable } : i));
      const item = items.find(i => i.id === id);
      setToast({ message: `${item?.name} marked as ${item?.isAvailable ? 'out of stock' : 'available'}`, type: 'success' });
    } catch (err) { setToast({ message: 'Failed to update.', type: 'error' }); }
  };

  return (
    <div className="flex-1 flex flex-col bg-background pb-20">
      <header className="px-6 pt-12 pb-4 bg-surface shadow-sm z-10 border-b border-outline-variant flex justify-between items-center">
        <h1 className="text-headline-lg font-extrabold text-on-surface">Menu Management</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={openAdd} className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="px-6 py-4 bg-surface border-b border-outline-variant flex gap-4 overflow-x-auto no-scrollbar">
        {['breakfast', 'lunch', 'dinner'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-pill font-bold capitalize text-label-md whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
        ) : (
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {currentItems.map(item => (
              <div key={item.id} className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-on-surface">{item.name}</h3>
                  <p className="text-body-md text-on-surface-variant mt-1">₹{item.price}</p>
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={`inline-block mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                      item.isAvailable ? 'bg-success/20 text-success hover:bg-success/30' : 'bg-error-container text-error hover:bg-error/20'
                    }`}
                  >
                    {item.isAvailable ? 'available' : 'out of stock'}
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => openEdit(item)} className="p-2 bg-surface-container text-on-surface-variant rounded-lg hover:text-primary hover:bg-primary/10 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-surface-container text-on-surface-variant rounded-lg hover:text-error hover:bg-error/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {currentItems.length === 0 && (
              <div className="col-span-full py-12 text-center text-on-surface-variant">No items for this meal type.</div>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-surface rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-outline-variant">
              <h2 className="text-headline-md font-bold text-on-surface">{modal.mode === 'add' ? 'Add Item' : 'Edit Item'}</h2>
              <button onClick={() => setModal(null)} className="p-1 rounded-full hover:bg-surface-container"><X className="w-5 h-5 text-on-surface-variant" /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Price (₹)</label>
                <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                  className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface focus:border-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Food Type</label>
                  <select value={form.foodType} onChange={e => setForm({...form, foodType: e.target.value})}
                    className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface focus:border-primary outline-none">
                    <option value="veg">Veg</option>
                    <option value="non-veg">Non-Veg</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-outline-variant flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-pill font-bold border border-outline-variant text-on-surface hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.price}
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
            <h3 className="text-headline-md font-bold text-on-surface">Delete Item?</h3>
            <p className="text-body-md text-on-surface-variant">Are you sure you want to delete this menu item? This action cannot be undone.</p>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-pill font-bold border border-outline-variant text-on-surface hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 rounded-pill font-bold bg-error text-white hover:bg-error/90 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav variant="admin" />
    </div>
  );
};

export default MenuManagement;
