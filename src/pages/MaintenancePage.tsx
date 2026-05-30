import { useEffect, useState } from 'react';
import { Plus, Search, Wrench, CreditCard as Edit2, Filter } from 'lucide-react';
import { supabase, MaintenanceRecord, Bus } from '../lib/supabase';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';

const MAINTENANCE_TYPES = ['routine', 'breakdown', 'preventive', 'corrective', 'inspection', 'tyre_change', 'oil_change'];
const STATUSES = ['pending', 'in-progress', 'completed', 'cancelled'];

const emptyForm = {
  bus_id: '', maintenance_type: 'routine', description: '', performed_by: '',
  workshop_name: '', maintenance_date: new Date().toISOString().split('T')[0],
  completion_date: '', cost: 0, parts_replaced: '',
  mileage_at_service: 0, next_service_mileage: 0, next_service_date: '',
  status: 'completed', invoice_number: '', notes: '',
};

type MaintenanceWithBus = MaintenanceRecord & {
  buses: { registration_number: string; model: string } | null;
};

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceWithBus[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MaintenanceWithBus | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [recRes, busRes] = await Promise.all([
      supabase.from('maintenance_records')
        .select('*, buses(registration_number, model)')
        .order('maintenance_date', { ascending: false }),
      supabase.from('buses').select('*').order('registration_number'),
    ]);
    setRecords((recRes.data as unknown as MaintenanceWithBus[]) ?? []);
    setBuses(busRes.data ?? []);
    setLoading(false);
  }

  function openAdd() { setEditRecord(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(r: MaintenanceWithBus) {
    setEditRecord(r);
    setForm({
      bus_id: r.bus_id, maintenance_type: r.maintenance_type, description: r.description,
      performed_by: r.performed_by, workshop_name: r.workshop_name,
      maintenance_date: r.maintenance_date, completion_date: r.completion_date ?? '',
      cost: r.cost, parts_replaced: r.parts_replaced, mileage_at_service: r.mileage_at_service ?? 0,
      next_service_mileage: r.next_service_mileage ?? 0, next_service_date: r.next_service_date ?? '',
      status: r.status, invoice_number: r.invoice_number, notes: r.notes,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      completion_date: form.completion_date || null,
      next_service_date: form.next_service_date || null,
      updated_at: new Date().toISOString(),
    };
    if (editRecord) {
      await supabase.from('maintenance_records').update(payload).eq('id', editRecord.id);
    } else {
      await supabase.from('maintenance_records').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchAll();
  }

  const totalCost = records.reduce((s, r) => s + r.cost, 0);
  const filtered = records.filter(r => {
    const matchSearch = (r.buses?.registration_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.performed_by.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.maintenance_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Maintenance Records</h1>
          <p className="text-sm text-slate-500 mt-0.5">Total cost: ₹{totalCost.toLocaleString('en-IN')}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by bus, description, technician..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="all">All Types</option>
            {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Wrench className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No maintenance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bus</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Workshop</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cost</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{rec.buses?.registration_number ?? '—'}</p>
                      <p className="text-xs text-slate-400">{rec.buses?.model ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full capitalize">
                        {rec.maintenance_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-slate-700 truncate">{rec.description}</p>
                      {rec.parts_replaced && <p className="text-xs text-slate-400 mt-0.5 truncate">Parts: {rec.parts_replaced}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{new Date(rec.maintenance_date).toLocaleDateString('en-IN')}</p>
                      {rec.completion_date && <p className="text-xs text-slate-400">Done: {new Date(rec.completion_date).toLocaleDateString('en-IN')}</p>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{rec.workshop_name || rec.performed_by || '—'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">₹{Number(rec.cost).toLocaleString()}</td>
                    <td className="px-6 py-4"><StatusBadge status={rec.status} /></td>
                    <td className="px-6 py-4">
                      <button onClick={() => openEdit(rec)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRecord ? 'Edit Maintenance Record' : 'Add Maintenance Record'} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bus *</label>
            <select value={form.bus_id} onChange={e => setForm(f => ({ ...f, bus_id: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">Select Bus</option>
              {buses.map(b => <option key={b.id} value={b.id}>{b.registration_number} - {b.model}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Maintenance Type</label>
            <select value={form.maintenance_type} onChange={e => setForm(f => ({ ...f, maintenance_type: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          {[
            { label: 'Performed By', key: 'performed_by', type: 'text' },
            { label: 'Workshop Name', key: 'workshop_name', type: 'text' },
            { label: 'Maintenance Date', key: 'maintenance_date', type: 'date' },
            { label: 'Completion Date', key: 'completion_date', type: 'date' },
            { label: 'Cost (₹)', key: 'cost', type: 'number' },
            { label: 'Invoice Number', key: 'invoice_number', type: 'text' },
            { label: 'Mileage at Service', key: 'mileage_at_service', type: 'number' },
            { label: 'Next Service Mileage', key: 'next_service_mileage', type: 'number' },
            { label: 'Next Service Date', key: 'next_service_date', type: 'date' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input type={type} value={(form as Record<string, unknown>)[key] as string}
                onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Parts Replaced</label>
            <input type="text" value={form.parts_replaced} onChange={e => setForm(f => ({ ...f, parts_replaced: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.bus_id || !form.description}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
            {saving ? 'Saving...' : editRecord ? 'Update Record' : 'Add Record'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
