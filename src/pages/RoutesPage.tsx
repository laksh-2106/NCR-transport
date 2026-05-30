import { useEffect, useState } from 'react';
import { Plus, Search, MapPin, CreditCard as Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, Route } from '../lib/supabase';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';

const ROUTE_TYPES = ['ordinary', 'express', 'premium', 'school', 'night'];
const STATUS_OPTIONS = ['active', 'inactive', 'suspended'];

const emptyForm = {
  route_number: '', route_name: '', origin: '', destination: '',
  total_distance_km: 0, estimated_duration_mins: 60, base_fare: 0,
  status: 'active', route_type: 'ordinary', peak_hours: '',
  total_stops: 0, description: '',
};

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRoute, setEditRoute] = useState<Route | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchRoutes(); }, []);

  async function fetchRoutes() {
    setLoading(true);
    const { data } = await supabase.from('routes').select('*').order('route_number');
    setRoutes(data ?? []);
    setLoading(false);
  }

  function openAdd() { setEditRoute(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(r: Route) {
    setEditRoute(r);
    setForm({
      route_number: r.route_number, route_name: r.route_name, origin: r.origin,
      destination: r.destination, total_distance_km: r.total_distance_km,
      estimated_duration_mins: r.estimated_duration_mins, base_fare: r.base_fare,
      status: r.status, route_type: r.route_type, peak_hours: r.peak_hours,
      total_stops: r.total_stops, description: r.description,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, updated_at: new Date().toISOString() };
    if (editRoute) {
      await supabase.from('routes').update(payload).eq('id', editRoute.id);
    } else {
      await supabase.from('routes').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchRoutes();
  }

  async function handleDelete(id: string) {
    await supabase.from('routes').delete().eq('id', id);
    setDeleteId(null);
    fetchRoutes();
  }

  const filtered = routes.filter(r =>
    r.route_number.toLowerCase().includes(search.toLowerCase()) ||
    r.route_name.toLowerCase().includes(search.toLowerCase()) ||
    r.origin.toLowerCase().includes(search.toLowerCase()) ||
    r.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Route Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{routes.length} routes configured</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Route
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text" placeholder="Search routes by number, name, origin, or destination..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No routes found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(route => (
              <div key={route.id}>
                <div className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <button onClick={() => setExpandedId(expandedId === route.id ? null : route.id)} className="text-slate-400 hover:text-slate-600">
                    {expandedId === route.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div className="w-16 shrink-0">
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">{route.route_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{route.route_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{route.origin} → {route.destination}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-sm text-slate-500">
                    <span>{route.total_distance_km} km</span>
                    <span>{route.estimated_duration_mins} min</span>
                    <span>₹{route.base_fare}</span>
                    <span className="capitalize text-xs bg-slate-100 px-2 py-0.5 rounded-full">{route.route_type}</span>
                  </div>
                  <StatusBadge status={route.status} />
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(route)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(route.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {expandedId === route.id && (
                  <div className="px-6 pb-4 bg-slate-50/30 border-t border-slate-50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-slate-400">Total Stops</p>
                        <p className="text-sm font-medium text-slate-700 mt-0.5">{route.total_stops}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Peak Hours</p>
                        <p className="text-sm font-medium text-slate-700 mt-0.5">{route.peak_hours || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-slate-400">Description</p>
                        <p className="text-sm text-slate-700 mt-0.5">{route.description || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRoute ? 'Edit Route' : 'Add New Route'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Route Number *', key: 'route_number', type: 'text' },
            { label: 'Route Name *', key: 'route_name', type: 'text' },
            { label: 'Origin *', key: 'origin', type: 'text' },
            { label: 'Destination *', key: 'destination', type: 'text' },
            { label: 'Distance (km)', key: 'total_distance_km', type: 'number' },
            { label: 'Duration (mins)', key: 'estimated_duration_mins', type: 'number' },
            { label: 'Base Fare (₹)', key: 'base_fare', type: 'number' },
            { label: 'Total Stops', key: 'total_stops', type: 'number' },
            { label: 'Peak Hours', key: 'peak_hours', type: 'text' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input type={type} value={(form as Record<string, unknown>)[key] as string}
                onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Route Type</label>
            <select value={form.route_type} onChange={e => setForm(f => ({ ...f, route_type: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              {ROUTE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.route_number || !form.route_name}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
            {saving ? 'Saving...' : editRoute ? 'Update Route' : 'Add Route'}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Route" size="sm">
        <p className="text-slate-600 text-sm">Are you sure you want to delete this route? This action cannot be undone.</p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
