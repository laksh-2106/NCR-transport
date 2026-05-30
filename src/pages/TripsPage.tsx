import { useEffect, useState } from 'react';
import { Plus, Search, Calendar, CreditCard as Edit2, Filter } from 'lucide-react';
import { supabase, Trip, Bus, Driver, Route } from '../lib/supabase';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';

const TRIP_STATUSES = ['scheduled', 'in-progress', 'completed', 'cancelled', 'delayed'];

const emptyForm = {
  trip_number: '', route_id: '', bus_id: '', driver_id: '',
  trip_date: new Date().toISOString().split('T')[0],
  scheduled_departure: '06:00', scheduled_arrival: '07:00',
  actual_departure: '', actual_arrival: '', status: 'scheduled',
  passengers_count: 0, revenue_collected: 0, fuel_consumed_liters: 0,
  start_mileage: 0, end_mileage: 0, delay_minutes: 0, delay_reason: '', notes: '',
};

type TripWithRelations = Trip & {
  routes: { route_name: string; origin: string; destination: string } | null;
  buses: { registration_number: string } | null;
  drivers: { first_name: string; last_name: string } | null;
};

export default function TripsPage() {
  const [trips, setTrips] = useState<TripWithRelations[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTrip, setEditTrip] = useState<TripWithRelations | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [dateFilter]);

  async function fetchAll() {
    setLoading(true);
    const [tripsRes, busesRes, driversRes, routesRes] = await Promise.all([
      supabase.from('trips')
        .select('*, routes(route_name, origin, destination), buses(registration_number), drivers(first_name, last_name)')
        .eq('trip_date', dateFilter)
        .order('scheduled_departure'),
      supabase.from('buses').select('*').eq('status', 'active'),
      supabase.from('drivers').select('*').eq('status', 'active'),
      supabase.from('routes').select('*').eq('status', 'active'),
    ]);
    setTrips((tripsRes.data as unknown as TripWithRelations[]) ?? []);
    setBuses(busesRes.data ?? []);
    setDrivers(driversRes.data ?? []);
    setRoutes(routesRes.data ?? []);
    setLoading(false);
  }

  function generateTripNumber() {
    return `TRP-${Date.now().toString(36).toUpperCase()}`;
  }

  function openAdd() {
    setEditTrip(null);
    setForm({ ...emptyForm, trip_date: dateFilter, trip_number: generateTripNumber() });
    setModalOpen(true);
  }

  function openEdit(t: TripWithRelations) {
    setEditTrip(t);
    setForm({
      trip_number: t.trip_number, route_id: t.route_id, bus_id: t.bus_id,
      driver_id: t.driver_id, trip_date: t.trip_date,
      scheduled_departure: t.scheduled_departure, scheduled_arrival: t.scheduled_arrival,
      actual_departure: t.actual_departure ?? '', actual_arrival: t.actual_arrival ?? '',
      status: t.status, passengers_count: t.passengers_count,
      revenue_collected: t.revenue_collected, fuel_consumed_liters: t.fuel_consumed_liters ?? 0,
      start_mileage: t.start_mileage ?? 0, end_mileage: t.end_mileage ?? 0,
      delay_minutes: t.delay_minutes ?? 0, delay_reason: t.delay_reason, notes: t.notes,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      actual_departure: form.actual_departure || null,
      actual_arrival: form.actual_arrival || null,
      updated_at: new Date().toISOString(),
    };
    if (editTrip) {
      await supabase.from('trips').update(payload).eq('id', editTrip.id);
    } else {
      await supabase.from('trips').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchAll();
  }

  const filtered = trips.filter(t => {
    const matchSearch = t.trip_number.toLowerCase().includes(search.toLowerCase()) ||
      (t.routes?.origin ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.routes?.destination ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.buses?.registration_number ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = trips.reduce((s, t) => s + t.revenue_collected, 0);
  const totalPassengers = trips.reduce((s, t) => s + t.passengers_count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Trip Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{trips.length} trips on selected date</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Log Trip
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-xs text-slate-500">Total Trips</p>
          <p className="text-2xl font-bold text-slate-800 mt-0.5">{trips.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-xs text-slate-500">Revenue</p>
          <p className="text-2xl font-bold text-emerald-700 mt-0.5">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-xs text-slate-500">Passengers</p>
          <p className="text-2xl font-bold text-blue-700 mt-0.5">{totalPassengers.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search trips..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="all">All Status</option>
            {TRIP_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No trips found for this date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trip #</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Route</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bus · Driver</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Departure</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Passengers</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Revenue</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(trip => (
                  <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{trip.trip_number}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{trip.routes?.route_name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{trip.routes?.origin} → {trip.routes?.destination}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{trip.buses?.registration_number ?? '—'}</p>
                      <p className="text-xs text-slate-400">{trip.drivers ? `${trip.drivers.first_name} ${trip.drivers.last_name}` : '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{trip.scheduled_departure}</p>
                      {trip.actual_departure && <p className="text-xs text-slate-400">Actual: {trip.actual_departure}</p>}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{trip.passengers_count}</td>
                    <td className="px-6 py-4 font-medium text-emerald-700">₹{Number(trip.revenue_collected).toLocaleString()}</td>
                    <td className="px-6 py-4"><StatusBadge status={trip.status} /></td>
                    <td className="px-6 py-4">
                      <button onClick={() => openEdit(trip)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTrip ? 'Update Trip' : 'Log New Trip'} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trip Number</label>
            <input type="text" value={form.trip_number} onChange={e => setForm(f => ({ ...f, trip_number: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trip Date</label>
            <input type="date" value={form.trip_date} onChange={e => setForm(f => ({ ...f, trip_date: e.target.value }))}
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Bus *</label>
            <select value={form.bus_id} onChange={e => setForm(f => ({ ...f, bus_id: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">Select Bus</option>
              {buses.map(b => <option key={b.id} value={b.id}>{b.registration_number} - {b.model}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Driver *</label>
            <select value={form.driver_id} onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">Select Driver</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name} ({d.employee_id})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {TRIP_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          {[
            { label: 'Scheduled Departure', key: 'scheduled_departure', type: 'time' },
            { label: 'Scheduled Arrival', key: 'scheduled_arrival', type: 'time' },
            { label: 'Actual Departure', key: 'actual_departure', type: 'time' },
            { label: 'Actual Arrival', key: 'actual_arrival', type: 'time' },
            { label: 'Passengers Count', key: 'passengers_count', type: 'number' },
            { label: 'Revenue Collected (₹)', key: 'revenue_collected', type: 'number' },
            { label: 'Fuel Consumed (L)', key: 'fuel_consumed_liters', type: 'number' },
            { label: 'Start Mileage', key: 'start_mileage', type: 'number' },
            { label: 'End Mileage', key: 'end_mileage', type: 'number' },
            { label: 'Delay (mins)', key: 'delay_minutes', type: 'number' },
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Delay Reason</label>
            <input type="text" value={form.delay_reason} onChange={e => setForm(f => ({ ...f, delay_reason: e.target.value }))}
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
          <button onClick={handleSave} disabled={saving || !form.route_id || !form.bus_id || !form.driver_id}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
            {saving ? 'Saving...' : editTrip ? 'Update Trip' : 'Log Trip'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
