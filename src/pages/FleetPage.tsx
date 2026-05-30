import { useEffect, useState } from 'react';
import { Plus, Search, Bus, CreditCard as Edit2, Trash2, Filter } from 'lucide-react';
import { supabase, Bus as BusType } from '../lib/supabase';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';

const FUEL_TYPES = ['diesel', 'cng', 'electric', 'hybrid'];
const STATUS_OPTIONS = ['active', 'inactive', 'maintenance', 'retired'];
const DEPOTS = ['Main Depot', 'North Depot', 'South Depot', 'East Depot', 'West Depot'];

const emptyForm = {
  registration_number: '', model: '', manufacturer: '', year_manufactured: 2020,
  capacity: 50, fuel_type: 'diesel', engine_number: '', chassis_number: '',
  status: 'active', current_mileage: 0, last_service_date: '', next_service_due: '',
  insurance_expiry: '', registration_expiry: '', assigned_depot: 'Main Depot',
  purchase_date: '', purchase_price: 0, notes: '',
};

export default function FleetPage() {
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editBus, setEditBus] = useState<BusType | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchBuses(); }, []);

  async function fetchBuses() {
    setLoading(true);
    const { data } = await supabase.from('buses').select('*').order('registration_number');
    setBuses(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditBus(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(bus: BusType) {
    setEditBus(bus);
    setForm({
      registration_number: bus.registration_number, model: bus.model,
      manufacturer: bus.manufacturer, year_manufactured: bus.year_manufactured,
      capacity: bus.capacity, fuel_type: bus.fuel_type, engine_number: bus.engine_number,
      chassis_number: bus.chassis_number, status: bus.status, current_mileage: bus.current_mileage,
      last_service_date: bus.last_service_date ?? '', next_service_due: bus.next_service_due ?? '',
      insurance_expiry: bus.insurance_expiry ?? '', registration_expiry: bus.registration_expiry ?? '',
      assigned_depot: bus.assigned_depot, purchase_date: bus.purchase_date ?? '',
      purchase_price: bus.purchase_price, notes: bus.notes,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      last_service_date: form.last_service_date || null,
      next_service_due: form.next_service_due || null,
      insurance_expiry: form.insurance_expiry || null,
      registration_expiry: form.registration_expiry || null,
      purchase_date: form.purchase_date || null,
      updated_at: new Date().toISOString(),
    };

    if (editBus) {
      await supabase.from('buses').update(payload).eq('id', editBus.id);
    } else {
      await supabase.from('buses').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchBuses();
  }

  async function handleDelete(id: string) {
    await supabase.from('buses').delete().eq('id', id);
    setDeleteId(null);
    fetchBuses();
  }

  const filtered = buses.filter(b => {
    const matchSearch = b.registration_number.toLowerCase().includes(search.toLowerCase()) ||
      b.model.toLowerCase().includes(search.toLowerCase()) ||
      b.manufacturer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fleet Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{buses.length} buses in registry</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Bus
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Search by registration, model, manufacturer..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Bus className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No buses found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Registration</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Model / Manufacturer</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Capacity</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fuel</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Depot</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mileage</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(bus => (
                  <tr key={bus.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{bus.registration_number}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{bus.model}</p>
                      <p className="text-xs text-slate-400">{bus.manufacturer} · {bus.year_manufactured}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{bus.capacity} seats</td>
                    <td className="px-6 py-4 text-slate-600 capitalize">{bus.fuel_type}</td>
                    <td className="px-6 py-4 text-slate-600">{bus.assigned_depot}</td>
                    <td className="px-6 py-4 text-slate-600">{bus.current_mileage.toLocaleString()} km</td>
                    <td className="px-6 py-4"><StatusBadge status={bus.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(bus)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(bus.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editBus ? 'Edit Bus' : 'Add New Bus'} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Registration Number *', key: 'registration_number', type: 'text' },
            { label: 'Model *', key: 'model', type: 'text' },
            { label: 'Manufacturer', key: 'manufacturer', type: 'text' },
            { label: 'Year Manufactured', key: 'year_manufactured', type: 'number' },
            { label: 'Seating Capacity', key: 'capacity', type: 'number' },
            { label: 'Current Mileage (km)', key: 'current_mileage', type: 'number' },
            { label: 'Engine Number', key: 'engine_number', type: 'text' },
            { label: 'Chassis Number', key: 'chassis_number', type: 'text' },
            { label: 'Last Service Date', key: 'last_service_date', type: 'date' },
            { label: 'Next Service Due', key: 'next_service_due', type: 'date' },
            { label: 'Insurance Expiry', key: 'insurance_expiry', type: 'date' },
            { label: 'Registration Expiry', key: 'registration_expiry', type: 'date' },
            { label: 'Purchase Date', key: 'purchase_date', type: 'date' },
            { label: 'Purchase Price (₹)', key: 'purchase_price', type: 'number' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                type={type}
                value={(form as Record<string, unknown>)[key] as string}
                onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Type</label>
            <select value={form.fuel_type} onChange={e => setForm(f => ({ ...f, fuel_type: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
              {FUEL_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Depot</label>
            <select value={form.assigned_depot} onChange={e => setForm(f => ({ ...f, assigned_depot: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
              {DEPOTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.registration_number || !form.model}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
            {saving ? 'Saving...' : editBus ? 'Update Bus' : 'Add Bus'}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Bus" size="sm">
        <p className="text-slate-600 text-sm">Are you sure you want to delete this bus? This action cannot be undone.</p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
