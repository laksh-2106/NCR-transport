import { useEffect, useState } from 'react';
import { Plus, Search, AlertTriangle, Edit2, Filter } from 'lucide-react';
import { supabase, Incident, Bus, Driver } from '../lib/supabase';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';

const INCIDENT_TYPES = ['minor_accident', 'major_accident', 'breakdown', 'theft', 'vandalism', 'passenger_complaint', 'traffic_violation', 'other'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['reported', 'under-investigation', 'resolved', 'closed'];

const emptyForm = {
  incident_number: '', bus_id: '', driver_id: '',
  incident_date: new Date().toISOString().split('T')[0], incident_time: '',
  incident_type: 'minor_accident', location: '', description: '',
  severity: 'low', injuries_reported: false, injuries_count: 0,
  property_damage: false, damage_estimate: 0,
  police_report_number: '', insurance_claim_number: '',
  status: 'reported', resolution: '',
};

type IncidentWithRelations = Incident & {
  buses: { registration_number: string } | null;
  drivers: { first_name: string; last_name: string } | null;
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentWithRelations[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editIncident, setEditIncident] = useState<IncidentWithRelations | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [incRes, busRes, driverRes] = await Promise.all([
      supabase.from('incidents')
        .select('*, buses(registration_number), drivers(first_name, last_name)')
        .order('incident_date', { ascending: false }),
      supabase.from('buses').select('*').order('registration_number'),
      supabase.from('drivers').select('*').order('first_name'),
    ]);
    setIncidents((incRes.data as unknown as IncidentWithRelations[]) ?? []);
    setBuses(busRes.data ?? []);
    setDrivers(driverRes.data ?? []);
    setLoading(false);
  }

  function generateIncidentNumber() {
    return `INC-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
  }

  function openAdd() {
    setEditIncident(null);
    setForm({ ...emptyForm, incident_number: generateIncidentNumber() });
    setModalOpen(true);
  }

  function openEdit(inc: IncidentWithRelations) {
    setEditIncident(inc);
    setForm({
      incident_number: inc.incident_number, bus_id: inc.bus_id ?? '',
      driver_id: inc.driver_id ?? '',
      incident_date: inc.incident_date, incident_time: inc.incident_time ?? '',
      incident_type: inc.incident_type, location: inc.location,
      description: inc.description, severity: inc.severity,
      injuries_reported: inc.injuries_reported, injuries_count: inc.injuries_count ?? 0,
      property_damage: inc.property_damage, damage_estimate: inc.damage_estimate ?? 0,
      police_report_number: inc.police_report_number,
      insurance_claim_number: inc.insurance_claim_number,
      status: inc.status, resolution: inc.resolution,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      bus_id: form.bus_id || null,
      driver_id: form.driver_id || null,
      incident_time: form.incident_time || null,
      updated_at: new Date().toISOString(),
    };
    if (editIncident) {
      await supabase.from('incidents').update(payload).eq('id', editIncident.id);
    } else {
      await supabase.from('incidents').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchAll();
  }

  const openCount = incidents.filter(i => ['reported', 'under-investigation'].includes(i.status)).length;

  const filtered = incidents.filter(inc => {
    const matchSearch = inc.incident_number.toLowerCase().includes(search.toLowerCase()) ||
      inc.location.toLowerCase().includes(search.toLowerCase()) ||
      inc.description.toLowerCase().includes(search.toLowerCase()) ||
      (inc.buses?.registration_number ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || inc.status === statusFilter;
    const matchSeverity = severityFilter === 'all' || inc.severity === severityFilter;
    return matchSearch && matchStatus && matchSeverity;
  });

  const severityColor = (s: string) => ({
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  }[s] ?? 'bg-slate-100 text-slate-600');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Incident Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">{incidents.length} total · {openCount} open</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Report Incident
        </button>
      </div>

      {openCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 font-medium">{openCount} incident{openCount > 1 ? 's' : ''} require{openCount === 1 ? 's' : ''} attention</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search incidents..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="all">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="all">All Severity</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No incidents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Incident #</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date & Location</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bus · Driver</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Severity</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(inc => (
                  <tr key={inc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{inc.incident_number}</td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{new Date(inc.incident_date).toLocaleDateString('en-IN')}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{inc.location || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full capitalize">
                        {inc.incident_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{inc.buses?.registration_number ?? '—'}</p>
                      <p className="text-xs text-slate-400">{inc.drivers ? `${inc.drivers.first_name} ${inc.drivers.last_name}` : '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${severityColor(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={inc.status} /></td>
                    <td className="px-6 py-4">
                      <button onClick={() => openEdit(inc)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editIncident ? 'Update Incident' : 'Report Incident'} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Incident Number</label>
            <input type="text" value={form.incident_number} onChange={e => setForm(f => ({ ...f, incident_number: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Incident Date *</label>
            <input type="date" value={form.incident_date} onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Incident Time</label>
            <input type="time" value={form.incident_time} onChange={e => setForm(f => ({ ...f, incident_time: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Incident Type</label>
            <select value={form.incident_type} onChange={e => setForm(f => ({ ...f, incident_type: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bus</label>
            <select value={form.bus_id} onChange={e => setForm(f => ({ ...f, bus_id: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">Select Bus (Optional)</option>
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
            <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
            <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Street address, landmark..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="injuries" checked={form.injuries_reported}
              onChange={e => setForm(f => ({ ...f, injuries_reported: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-blue-600" />
            <label htmlFor="injuries" className="text-sm font-medium text-slate-700">Injuries Reported</label>
          </div>
          <div>
            {form.injuries_reported && (
              <>
                <label className="block text-sm font-medium text-slate-700 mb-1">Injuries Count</label>
                <input type="number" value={form.injuries_count}
                  onChange={e => setForm(f => ({ ...f, injuries_count: Number(e.target.value) }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="damage" checked={form.property_damage}
              onChange={e => setForm(f => ({ ...f, property_damage: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-blue-600" />
            <label htmlFor="damage" className="text-sm font-medium text-slate-700">Property Damage</label>
          </div>
          <div>
            {form.property_damage && (
              <>
                <label className="block text-sm font-medium text-slate-700 mb-1">Damage Estimate (₹)</label>
                <input type="number" value={form.damage_estimate}
                  onChange={e => setForm(f => ({ ...f, damage_estimate: Number(e.target.value) }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Police Report #</label>
            <input type="text" value={form.police_report_number} onChange={e => setForm(f => ({ ...f, police_report_number: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Claim #</label>
            <input type="text" value={form.insurance_claim_number} onChange={e => setForm(f => ({ ...f, insurance_claim_number: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Resolution</label>
            <textarea rows={2} value={form.resolution} onChange={e => setForm(f => ({ ...f, resolution: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.description || !form.location}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
            {saving ? 'Saving...' : editIncident ? 'Update Incident' : 'Report Incident'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
