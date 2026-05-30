import { useEffect, useState } from 'react';
import { Plus, Search, Fuel, CreditCard as Edit2, Filter } from 'lucide-react';
import { supabase, FuelRecord, Bus, Driver } from '../lib/supabase';
import Modal from '../components/ui/Modal';

const emptyForm = {
  bus_id: '', driver_id: '', fuel_date: new Date().toISOString().split('T')[0],
  liters_filled: 0, cost_per_liter: 0, total_cost: 0,
  mileage_at_fill: 0, fuel_station: '', fuel_type: 'diesel', notes: '',
};

type FuelWithRelations = FuelRecord & {
  buses: { registration_number: string; model: string } | null;
  drivers: { first_name: string; last_name: string } | null;
};

export default function FuelPage() {
  const [records, setRecords] = useState<FuelWithRelations[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busFilter, setBusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<FuelWithRelations | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [fuelRes, busRes, driverRes] = await Promise.all([
      supabase.from('fuel_records')
        .select('*, buses(registration_number, model), drivers(first_name, last_name)')
        .order('fuel_date', { ascending: false }),
      supabase.from('buses').select('*').order('registration_number'),
      supabase.from('drivers').select('*').eq('status', 'active').order('first_name'),
    ]);
    setRecords((fuelRes.data as unknown as FuelWithRelations[]) ?? []);
    setBuses(busRes.data ?? []);
    setDrivers(driverRes.data ?? []);
    setLoading(false);
  }

  function openAdd() { setEditRecord(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(r: FuelWithRelations) {
    setEditRecord(r);
    setForm({
      bus_id: r.bus_id, driver_id: r.driver_id ?? '',
      fuel_date: r.fuel_date, liters_filled: r.liters_filled,
      cost_per_liter: r.cost_per_liter, total_cost: r.total_cost,
      mileage_at_fill: r.mileage_at_fill ?? 0, fuel_station: r.fuel_station,
      fuel_type: r.fuel_type, notes: r.notes,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      driver_id: form.driver_id || null,
      total_cost: form.liters_filled * form.cost_per_liter,
    };
    if (editRecord) {
      await supabase.from('fuel_records').update(payload).eq('id', editRecord.id);
    } else {
      await supabase.from('fuel_records').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchAll();
  }

  const totalCost = records.reduce((s, r) => s + r.total_cost, 0);
  const totalLiters = records.reduce((s, r) => s + r.liters_filled, 0);

  const filtered = records.filter(r => {
    const matchSearch = (r.buses?.registration_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
      r.fuel_station.toLowerCase().includes(search.toLowerCase());
    const matchBus = busFilter === 'all' || r.bus_id === busFilter;
    return matchSearch && matchBus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fuel Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalLiters.toLocaleString()} L · ₹{totalCost.toLocaleString('en-IN')} total</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-xs text-slate-500">Total Records</p>
          <p className="text-2xl font-bold text-slate-800 mt-0.5">{records.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-xs text-slate-500">Total Liters</p>
          <p className="text-2xl font-bold text-blue-700 mt-0.5">{totalLiters.toLocaleString()} L</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-xs text-slate-500">Total Spent</p>
          <p className="text-2xl font-bold text-amber-700 mt-0.5">₹{totalCost.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by bus or station..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select value={busFilter} onChange={e => setBusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="all">All Buses</option>
            {buses.map(b => <option key={b.id} value={b.id}>{b.registration_number}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Fuel className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No fuel records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bus</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Driver</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fuel Station</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Liters</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rate</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-700">{new Date(rec.fuel_date).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{rec.buses?.registration_number ?? '—'}</p>
                      <p className="text-xs text-slate-400">{rec.buses?.model ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {rec.drivers ? `${rec.drivers.first_name} ${rec.drivers.last_name}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{rec.fuel_station || '—'}</td>
                    <td className="px-6 py-4 font-medium text-blue-700">{rec.liters_filled} L</td>
                    <td className="px-6 py-4 text-slate-600">₹{rec.cost_per_liter}/L</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">₹{Number(rec.total_cost).toLocaleString()}</td>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRecord ? 'Edit Fuel Record' : 'Add Fuel Entry'} size="lg">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Driver</label>
            <select value={form.driver_id} onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">Select Driver (Optional)</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
          </div>
          {[
            { label: 'Date *', key: 'fuel_date', type: 'date' },
            { label: 'Fuel Station', key: 'fuel_station', type: 'text' },
            { label: 'Liters Filled *', key: 'liters_filled', type: 'number' },
            { label: 'Cost per Liter (₹) *', key: 'cost_per_liter', type: 'number' },
            { label: 'Mileage at Fill', key: 'mileage_at_fill', type: 'number' },
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Type</label>
            <select value={form.fuel_type} onChange={e => setForm(f => ({ ...f, fuel_type: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="diesel">Diesel</option>
              <option value="cng">CNG</option>
              <option value="petrol">Petrol</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-blue-800">
                Calculated Total: ₹{(form.liters_filled * form.cost_per_liter).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.bus_id || !form.liters_filled}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
            {saving ? 'Saving...' : editRecord ? 'Update Entry' : 'Add Entry'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
