import { useEffect, useState } from 'react';
import { Plus, Search, Clock, CreditCard as Edit2, Trash2 } from 'lucide-react';
import { supabase, Schedule, Bus, Driver, Route } from '../lib/supabase';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const emptyForm = {
  schedule_name: '', route_id: '', bus_id: '', driver_id: '',
  departure_time: '06:00', arrival_time: '07:00',
  days_of_operation: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  status: 'active', effective_from: new Date().toISOString().split('T')[0],
  effective_until: '', notes: '',
};

type ScheduleWithRelations = Schedule & {
  routes: { route_name: string; origin: string; destination: string } | null;
  buses: { registration_number: string } | null;
  drivers: { first_name: string; last_name: string } | null;
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleWithRelations[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<ScheduleWithRelations | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [schRes, busRes, driverRes, routeRes] = await Promise.all([
      supabase.from('schedules')
        .select('*, routes(route_name, origin, destination), buses(registration_number), drivers(first_name, last_name)')
        .order('departure_time'),
      supabase.from('buses').select('*').eq('status', 'active'),
      supabase.from('drivers').select('*').eq('status', 'active'),
      supabase.from('routes').select('*').eq('status', 'active'),
    ]);
    setSchedules((schRes.data as unknown as ScheduleWithRelations[]) ?? []);
    setBuses(busRes.data ?? []);
    setDrivers(driverRes.data ?? []);
    setRoutes(routeRes.data ?? []);
    setLoading(false);
  }

  function openAdd() { setEditSchedule(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(s: ScheduleWithRelations) {
    setEditSchedule(s);
    setForm({
      schedule_name: s.schedule_name, route_id: s.route_id, bus_id: s.bus_id ?? '',
      driver_id: s.driver_id ?? '', departure_time: s.departure_time,
      arrival_time: s.arrival_time, days_of_operation: s.days_of_operation,
      status: s.status, effective_from: s.effective_from ?? '',
      effective_until: s.effective_until ?? '', notes: s.notes,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      bus_id: form.bus_id || null,
      driver_id: form.driver_id || null,
      effective_from: form.effective_from || null,
      effective_until: form.effective_until || null,
      updated_at: new Date().toISOString(),
    };
    if (editSchedule) {
      await supabase.from('schedules').update(payload).eq('id', editSchedule.id);
    } else {
      await supabase.from('schedules').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchAll();
  }

  async function handleDelete(id: string) {
    await supabase.from('schedules').delete().eq('id', id);
    setDeleteId(null);
    fetchAll();
  }

  function toggleDay(day: string) {
    setForm(f => ({
      ...f,
      days_of_operation: f.days_of_operation.includes(day)
        ? f.days_of_operation.filter(d => d !== day)
        : [...f.days_of_operation, day],
    }));
  }

  const filtered = schedules.filter(s =>
    s.schedule_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.routes?.route_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (s.routes?.origin ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Schedule Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{schedules.length} schedules configured</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Schedule
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search schedules..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No schedules found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Schedule</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Route</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bus · Driver</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Timing</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Days</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(sch => (
                  <tr key={sch.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{sch.schedule_name}</td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{sch.routes?.route_name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{sch.routes?.origin} → {sch.routes?.destination}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{sch.buses?.registration_number ?? '—'}</p>
                      <p className="text-xs text-slate-400">{sch.drivers ? `${sch.drivers.first_name} ${sch.drivers.last_name}` : '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{sch.departure_time} - {sch.arrival_time}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-0.5 flex-wrap">
                        {DAY_SHORT.map((d, i) => (
                          <span key={d} className={`text-xs px-1.5 py-0.5 rounded font-medium ${sch.days_of_operation.includes(DAYS[i]) ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-300'}`}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={sch.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(sch)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(sch.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editSchedule ? 'Edit Schedule' : 'Add New Schedule'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Schedule Name *</label>
            <input type="text" value={form.schedule_name} onChange={e => setForm(f => ({ ...f, schedule_name: e.target.value }))}
              placeholder="e.g. Morning Express - Route 42"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Route *</label>
            <select value={form.route_id} onChange={e => setForm(f => ({ ...f, route_id: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">Select Route</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.route_number} - {r.route_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bus</label>
            <select value={form.bus_id} onChange={e => setForm(f => ({ ...f, bus_id: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">Select Bus (Optional)</option>
              {buses.map(b => <option key={b.id} value={b.id}>{b.registration_number}</option>)}
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Departure Time *</label>
            <input type="time" value={form.departure_time} onChange={e => setForm(f => ({ ...f, departure_time: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Arrival Time *</label>
            <input type="time" value={form.arrival_time} onChange={e => setForm(f => ({ ...f, arrival_time: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Effective From</label>
            <input type="date" value={form.effective_from} onChange={e => setForm(f => ({ ...f, effective_from: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Effective Until</label>
            <input type="date" value={form.effective_until} onChange={e => setForm(f => ({ ...f, effective_until: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Days of Operation</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(day => (
                <button key={day} type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${form.days_of_operation.includes(day) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {day.slice(0, 3)}
                </button>
              ))}
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
          <button onClick={handleSave} disabled={saving || !form.schedule_name || !form.route_id}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
            {saving ? 'Saving...' : editSchedule ? 'Update Schedule' : 'Add Schedule'}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Schedule" size="sm">
        <p className="text-slate-600 text-sm">Are you sure you want to delete this schedule?</p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
