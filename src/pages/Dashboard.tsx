import { useEffect, useState } from 'react';
import { Bus, Users, Route, MapPin, TrendingUp, AlertTriangle, Fuel, Wrench, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';

type DashboardStats = {
  totalBuses: number;
  activeBuses: number;
  maintenanceBuses: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRoutes: number;
  activeRoutes: number;
  todayTrips: number;
  completedTrips: number;
  totalRevenue: number;
  pendingMaintenance: number;
  openIncidents: number;
};

type RecentTrip = {
  id: string;
  trip_number: string;
  status: string;
  trip_date: string;
  routes: { route_name: string; origin: string; destination: string } | null;
  buses: { registration_number: string } | null;
  drivers: { first_name: string; last_name: string } | null;
};

type UpcomingMaintenance = {
  id: string;
  buses: { registration_number: string; model: string } | null;
  next_service_due: string | null;
  maintenance_type: string;
  status: string;
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBuses: 0, activeBuses: 0, maintenanceBuses: 0,
    totalDrivers: 0, activeDrivers: 0, totalRoutes: 0,
    activeRoutes: 0, todayTrips: 0, completedTrips: 0,
    totalRevenue: 0, pendingMaintenance: 0, openIncidents: 0,
  });
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<UpcomingMaintenance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    const today = new Date().toISOString().split('T')[0];

    const [buses, drivers, routes, trips, maintenance, incidents] = await Promise.all([
      supabase.from('buses').select('status'),
      supabase.from('drivers').select('status'),
      supabase.from('routes').select('status'),
      supabase.from('trips').select('status, revenue_collected').eq('trip_date', today),
      supabase.from('buses').select('id, next_service_due').not('next_service_due', 'is', null).lte('next_service_due', new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]),
      supabase.from('incidents').select('status').in('status', ['reported', 'under-investigation']),
    ]);

    const busData = buses.data ?? [];
    const driverData = drivers.data ?? [];
    const routeData = routes.data ?? [];
    const tripData = trips.data ?? [];

    setStats({
      totalBuses: busData.length,
      activeBuses: busData.filter(b => b.status === 'active').length,
      maintenanceBuses: busData.filter(b => b.status === 'maintenance').length,
      totalDrivers: driverData.length,
      activeDrivers: driverData.filter(d => d.status === 'active').length,
      totalRoutes: routeData.length,
      activeRoutes: routeData.filter(r => r.status === 'active').length,
      todayTrips: tripData.length,
      completedTrips: tripData.filter(t => t.status === 'completed').length,
      totalRevenue: tripData.reduce((s, t) => s + (t.revenue_collected ?? 0), 0),
      pendingMaintenance: maintenance.data?.length ?? 0,
      openIncidents: incidents.data?.length ?? 0,
    });

    const [tripsRes, maintenanceRes] = await Promise.all([
      supabase.from('trips')
        .select('id, trip_number, status, trip_date, routes(route_name, origin, destination), buses(registration_number), drivers(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase.from('buses')
        .select('id, next_service_due, status, registration_number, model')
        .not('next_service_due', 'is', null)
        .order('next_service_due', { ascending: true })
        .limit(5),
    ]);

    setRecentTrips((tripsRes.data as unknown as RecentTrip[]) ?? []);
    setUpcomingMaintenance(
      (maintenanceRes.data ?? []).map(b => ({
        id: b.id,
        buses: { registration_number: b.registration_number, model: b.model },
        next_service_due: b.next_service_due,
        maintenance_type: 'Scheduled Service',
        status: b.status,
      }))
    );
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Operations Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">System Operational</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Fleet"
          value={stats.totalBuses}
          subtitle={`${stats.activeBuses} active · ${stats.maintenanceBuses} in maintenance`}
          icon={<Bus className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Active Drivers"
          value={stats.activeDrivers}
          subtitle={`of ${stats.totalDrivers} total drivers`}
          icon={<Users className="w-6 h-6" />}
          color="emerald"
        />
        <StatCard
          title="Today's Trips"
          value={stats.todayTrips}
          subtitle={`${stats.completedTrips} completed`}
          icon={<Calendar className="w-6 h-6" />}
          color="cyan"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          subtitle="Collected today"
          icon={<TrendingUp className="w-6 h-6" />}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Routes"
          value={stats.activeRoutes}
          subtitle={`of ${stats.totalRoutes} total routes`}
          icon={<Route className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Service Due"
          value={stats.pendingMaintenance}
          subtitle="Buses due in 30 days"
          icon={<Wrench className="w-6 h-6" />}
          color="amber"
        />
        <StatCard
          title="Open Incidents"
          value={stats.openIncidents}
          subtitle="Pending resolution"
          icon={<AlertTriangle className="w-6 h-6" />}
          color={stats.openIncidents > 0 ? 'red' : 'emerald'}
        />
        <StatCard
          title="Fleet Utilization"
          value={stats.totalBuses > 0 ? `${Math.round((stats.activeBuses / stats.totalBuses) * 100)}%` : '0%'}
          subtitle="Active vs total buses"
          icon={<Fuel className="w-6 h-6" />}
          color="cyan"
        />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trips */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent Trips</h2>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <div className="divide-y divide-slate-50">
            {recentTrips.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No trips recorded yet</p>
            ) : recentTrips.map(trip => (
              <div key={trip.id} className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {trip.routes?.origin ?? '—'} → {trip.routes?.destination ?? '—'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {trip.trip_number} · {trip.buses?.registration_number ?? '—'} · {trip.drivers ? `${trip.drivers.first_name} ${trip.drivers.last_name}` : '—'}
                  </p>
                </div>
                <StatusBadge status={trip.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Upcoming Service Due</h2>
            <Wrench className="w-4 h-4 text-slate-400" />
          </div>
          <div className="divide-y divide-slate-50">
            {upcomingMaintenance.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No upcoming maintenance</p>
            ) : upcomingMaintenance.map(item => {
              const dueDate = item.next_service_due ? new Date(item.next_service_due) : null;
              const daysUntil = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000*60*60*24)) : null;
              return (
                <div key={item.id} className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{item.buses?.registration_number ?? '—'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.buses?.model ?? '—'} · {item.maintenance_type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {dueDate && (
                      <p className={`text-xs font-medium ${daysUntil !== null && daysUntil <= 7 ? 'text-red-600' : daysUntil !== null && daysUntil <= 14 ? 'text-amber-600' : 'text-slate-500'}`}>
                        {daysUntil !== null && daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : daysUntil !== null ? `in ${daysUntil}d` : '—'}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">{dueDate?.toLocaleDateString('en-IN') ?? '—'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
