import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Bus = {
  id: string;
  registration_number: string;
  model: string;
  manufacturer: string;
  year_manufactured: number;
  capacity: number;
  fuel_type: string;
  engine_number: string;
  chassis_number: string;
  status: string;
  current_mileage: number;
  last_service_date: string | null;
  next_service_due: string | null;
  insurance_expiry: string | null;
  registration_expiry: string | null;
  assigned_depot: string;
  purchase_date: string | null;
  purchase_price: number;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Route = {
  id: string;
  route_number: string;
  route_name: string;
  origin: string;
  destination: string;
  total_distance_km: number;
  estimated_duration_mins: number;
  base_fare: number;
  status: string;
  route_type: string;
  peak_hours: string;
  total_stops: number;
  description: string;
  created_at: string;
  updated_at: string;
};

export type RouteStop = {
  id: string;
  route_id: string;
  stop_name: string;
  stop_order: number;
  distance_from_origin_km: number;
  landmark: string;
  created_at: string;
};

export type Driver = {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string;
  phone: string;
  email: string;
  address: string;
  license_number: string;
  license_type: string;
  license_expiry: string | null;
  joining_date: string | null;
  status: string;
  total_trips: number;
  total_km_driven: number;
  rating: number;
  emergency_contact: string;
  emergency_phone: string;
  profile_photo_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Schedule = {
  id: string;
  schedule_name: string;
  route_id: string;
  bus_id: string | null;
  driver_id: string | null;
  departure_time: string;
  arrival_time: string;
  days_of_operation: string[];
  status: string;
  effective_from: string | null;
  effective_until: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  routes?: Route;
  buses?: Bus;
  drivers?: Driver;
};

export type Trip = {
  id: string;
  trip_number: string;
  schedule_id: string | null;
  route_id: string;
  bus_id: string;
  driver_id: string;
  trip_date: string;
  scheduled_departure: string;
  actual_departure: string | null;
  scheduled_arrival: string;
  actual_arrival: string | null;
  status: string;
  passengers_count: number;
  revenue_collected: number;
  fuel_consumed_liters: number | null;
  start_mileage: number | null;
  end_mileage: number | null;
  delay_minutes: number | null;
  delay_reason: string;
  notes: string;
  created_at: string;
  updated_at: string;
  routes?: Route;
  buses?: Bus;
  drivers?: Driver;
};

export type MaintenanceRecord = {
  id: string;
  bus_id: string;
  maintenance_type: string;
  description: string;
  performed_by: string;
  workshop_name: string;
  maintenance_date: string;
  completion_date: string | null;
  cost: number;
  parts_replaced: string;
  mileage_at_service: number | null;
  next_service_mileage: number | null;
  next_service_date: string | null;
  status: string;
  invoice_number: string;
  notes: string;
  created_at: string;
  updated_at: string;
  buses?: Bus;
};

export type FuelRecord = {
  id: string;
  bus_id: string;
  driver_id: string | null;
  trip_id: string | null;
  fuel_date: string;
  liters_filled: number;
  cost_per_liter: number;
  total_cost: number;
  mileage_at_fill: number | null;
  fuel_station: string;
  fuel_type: string;
  notes: string;
  created_at: string;
  buses?: Bus;
  drivers?: Driver;
};

export type Incident = {
  id: string;
  incident_number: string;
  bus_id: string | null;
  driver_id: string | null;
  trip_id: string | null;
  incident_date: string;
  incident_time: string | null;
  incident_type: string;
  location: string;
  description: string;
  severity: string;
  injuries_reported: boolean;
  injuries_count: number | null;
  property_damage: boolean;
  damage_estimate: number | null;
  police_report_number: string;
  insurance_claim_number: string;
  status: string;
  resolution: string;
  created_at: string;
  updated_at: string;
  buses?: Bus;
  drivers?: Driver;
};
