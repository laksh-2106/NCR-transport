import { useEffect, useState } from 'react';
import { Plus, Search, Users, CreditCard as Edit2, Trash2, Star, Phone } from 'lucide-react';
import { supabase, Driver } from '../lib/supabase';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';

const LICENSE_TYPES = ['heavy', 'light', 'heavy_transport', 'passenger'];
const STATUS_OPTIONS = ['active', 'inactive', 'on_leave', 'suspended'];

const emptyForm = {
  employee_id: '', first_name: '', last_name: '', date_of_birth: '',
  gender: 'male', phone: '', email: '', address: '',
  license_number: '', license_type: 'heavy', license_expiry: '',
  joining_date: new Date().toISOString().split('T')[0],
  status: 'active', emergency_contact: '', emergency_phone: '', notes: '',
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchDrivers(); }, []);

  async function fetchDrivers() {
    setLoading(true);
    const { data } = await supabase.from('drivers').select('*').order('first_name');
    setDrivers(data ?? []);
    setLoading(false);
  }

  function openAdd() { setEditDriver(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(d: Driver) {
    setEditDriver(d);
    setForm({
      employee_id: d.employee_id, first_name: d.first_name, last_name: d.last_name,
      date_of_birth: d.date_of_birth ?? '', gender: d.gender, phone: d.phone,
      email: d.email, address: d.address, license_number: d.license_number,
      license_type: d.license_type, license_expiry: d.license_expiry ?? '',
      joining_date: d.joining_date ?? '', status: d.status,
      emergency_contact: d.emergency_contact, emergency_phone: d.emergency_phone, notes: d.notes,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      date_of_birth: form.date_of_birth || null,
      license_expiry: form.license_expiry || null,
      joining_date: form.joining_date || null,
      updated_at: new Date().toISOString(),
    };
    if (editDriver) {
      await supabase.from('drivers').update(payload).eq('id', editDriver.id);
    } else {
      await supabase.from('drivers').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchDrivers();
  }

  async function handleDelete(id: string) {
    await supabase.from('drivers').delete().eq('id', id);
    setDeleteId(null);
    fetchDrivers();
  }

  const filtered = drivers.filter(d => {
    const name = `${d.first_name} ${d.last_name}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) ||
      d.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      d.license_number.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search);
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Driver Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{drivers.length} drivers registered</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Driver
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by name, employee ID, license, phone..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No drivers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Driver</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee ID</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">License</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trips</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rating</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(driver => {
                  const licenseExpired = driver.license_expiry && new Date(driver.license_expiry) < new Date();
                  return (
                    <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                            {driver.first_name[0]}{driver.last_name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{driver.first_name} {driver.last_name}</p>
                            <p className="text-xs text-slate-400 capitalize">{driver.license_type} vehicle</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">{driver.employee_id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {driver.phone || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-600 font-mono text-xs">{driver.license_number}</p>
                        {driver.license_expiry && (
                          <p className={`text-xs mt-0.5 ${licenseExpired ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                            {licenseExpired ? 'EXPIRED' : `Exp: ${new Date(driver.license_expiry).toLocaleDateString('en-IN')}`}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{driver.total_trips.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-slate-700 font-medium">{Number(driver.rating).toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={driver.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(driver)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(driver.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editDriver ? 'Edit Driver' : 'Add New Driver'} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Employee ID *', key: 'employee_id', type: 'text' },
            { label: 'First Name *', key: 'first_name', type: 'text' },
            { label: 'Last Name *', key: 'last_name', type: 'text' },
            { label: 'Date of Birth', key: 'date_of_birth', type: 'date' },
            { label: 'Phone *', key: 'phone', type: 'tel' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'License Number *', key: 'license_number', type: 'text' },
            { label: 'License Expiry', key: 'license_expiry', type: 'date' },
            { label: 'Joining Date', key: 'joining_date', type: 'date' },
            { label: 'Emergency Contact', key: 'emergency_contact', type: 'text' },
            { label: 'Emergency Phone', key: 'emergency_phone', type: 'tel' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input type={type} value={(form as Record<string, unknown>)[key] as string}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
            <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">License Type</label>
            <select value={form.license_type} onChange={e => setForm(f => ({ ...f, license_type: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {LICENSE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.employee_id || !form.first_name || !form.last_name}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
            {saving ? 'Saving...' : editDriver ? 'Update Driver' : 'Add Driver'}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Driver" size="sm">
        <p className="text-slate-600 text-sm">Are you sure you want to delete this driver record? This action cannot be undone.</p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
