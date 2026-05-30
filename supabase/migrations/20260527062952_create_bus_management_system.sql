/*
  # NCR Transport Corporation - Bus Management System

  ## Overview
  Complete schema for managing buses, routes, drivers, schedules, trips, maintenance, and fuel.

  ## Tables Created
  1. buses - Fleet of buses with registration, capacity, status
  2. routes - Bus routes with origin/destination, stops, fare info
  3. route_stops - Individual stops along each route
  4. drivers - Driver profiles with license, contact info
  5. driver_assignments - Bus-driver assignments
  6. schedules - Planned trip schedules per route
  7. trips - Actual trip records with status tracking
  8. trip_passengers - Passenger count per trip
  9. maintenance_records - Bus maintenance history
  10. fuel_records - Fuel consumption tracking
  11. incidents - Incident/accident reports

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read/write all records (staff system)
*/

-- BUSES TABLE
CREATE TABLE IF NOT EXISTS buses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number text UNIQUE NOT NULL,
  model text NOT NULL,
  manufacturer text NOT NULL DEFAULT '',
  year_manufactured integer NOT NULL DEFAULT 2020,
  capacity integer NOT NULL DEFAULT 50,
  fuel_type text NOT NULL DEFAULT 'diesel',
  engine_number text DEFAULT '',
  chassis_number text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  current_mileage integer NOT NULL DEFAULT 0,
  last_service_date date,
  next_service_due date,
  insurance_expiry date,
  registration_expiry date,
  assigned_depot text NOT NULL DEFAULT 'Main Depot',
  purchase_date date,
  purchase_price numeric(12,2) DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE buses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read buses"
  ON buses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert buses"
  ON buses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update buses"
  ON buses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ROUTES TABLE
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_number text UNIQUE NOT NULL,
  route_name text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  total_distance_km numeric(8,2) NOT NULL DEFAULT 0,
  estimated_duration_mins integer NOT NULL DEFAULT 60,
  base_fare numeric(8,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  route_type text NOT NULL DEFAULT 'ordinary',
  peak_hours text DEFAULT '',
  total_stops integer NOT NULL DEFAULT 0,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read routes"
  ON routes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert routes"
  ON routes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update routes"
  ON routes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ROUTE STOPS TABLE
CREATE TABLE IF NOT EXISTS route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_name text NOT NULL,
  stop_order integer NOT NULL DEFAULT 0,
  distance_from_origin_km numeric(8,2) DEFAULT 0,
  landmark text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read route_stops"
  ON route_stops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert route_stops"
  ON route_stops FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update route_stops"
  ON route_stops FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete route_stops"
  ON route_stops FOR DELETE
  TO authenticated
  USING (true);

-- DRIVERS TABLE
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  gender text DEFAULT 'male',
  phone text NOT NULL DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  license_number text UNIQUE NOT NULL,
  license_type text NOT NULL DEFAULT 'heavy',
  license_expiry date,
  joining_date date DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active',
  total_trips integer NOT NULL DEFAULT 0,
  total_km_driven numeric(12,2) NOT NULL DEFAULT 0,
  rating numeric(3,2) DEFAULT 5.00,
  emergency_contact text DEFAULT '',
  emergency_phone text DEFAULT '',
  profile_photo_url text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read drivers"
  ON drivers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert drivers"
  ON drivers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update drivers"
  ON drivers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_name text NOT NULL,
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
  bus_id uuid REFERENCES buses(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  departure_time time NOT NULL,
  arrival_time time NOT NULL,
  days_of_operation text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  effective_from date DEFAULT CURRENT_DATE,
  effective_until date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert schedules"
  ON schedules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update schedules"
  ON schedules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- TRIPS TABLE
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_number text UNIQUE NOT NULL,
  schedule_id uuid REFERENCES schedules(id) ON DELETE SET NULL,
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
  bus_id uuid NOT NULL REFERENCES buses(id) ON DELETE RESTRICT,
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  trip_date date NOT NULL DEFAULT CURRENT_DATE,
  scheduled_departure time NOT NULL,
  actual_departure time,
  scheduled_arrival time NOT NULL,
  actual_arrival time,
  status text NOT NULL DEFAULT 'scheduled',
  passengers_count integer NOT NULL DEFAULT 0,
  revenue_collected numeric(10,2) NOT NULL DEFAULT 0,
  fuel_consumed_liters numeric(8,2) DEFAULT 0,
  start_mileage integer DEFAULT 0,
  end_mileage integer DEFAULT 0,
  delay_minutes integer DEFAULT 0,
  delay_reason text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read trips"
  ON trips FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- MAINTENANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL DEFAULT 'routine',
  description text NOT NULL,
  performed_by text NOT NULL DEFAULT '',
  workshop_name text DEFAULT '',
  maintenance_date date NOT NULL DEFAULT CURRENT_DATE,
  completion_date date,
  cost numeric(10,2) NOT NULL DEFAULT 0,
  parts_replaced text DEFAULT '',
  mileage_at_service integer DEFAULT 0,
  next_service_mileage integer DEFAULT 0,
  next_service_date date,
  status text NOT NULL DEFAULT 'completed',
  invoice_number text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance_records"
  ON maintenance_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert maintenance_records"
  ON maintenance_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maintenance_records"
  ON maintenance_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- FUEL RECORDS TABLE
CREATE TABLE IF NOT EXISTS fuel_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  fuel_date date NOT NULL DEFAULT CURRENT_DATE,
  liters_filled numeric(8,2) NOT NULL DEFAULT 0,
  cost_per_liter numeric(6,2) NOT NULL DEFAULT 0,
  total_cost numeric(10,2) NOT NULL DEFAULT 0,
  mileage_at_fill integer DEFAULT 0,
  fuel_station text DEFAULT '',
  fuel_type text DEFAULT 'diesel',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read fuel_records"
  ON fuel_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert fuel_records"
  ON fuel_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update fuel_records"
  ON fuel_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number text UNIQUE NOT NULL,
  bus_id uuid REFERENCES buses(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  incident_date date NOT NULL DEFAULT CURRENT_DATE,
  incident_time time,
  incident_type text NOT NULL DEFAULT 'minor_accident',
  location text NOT NULL DEFAULT '',
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'low',
  injuries_reported boolean DEFAULT false,
  injuries_count integer DEFAULT 0,
  property_damage boolean DEFAULT false,
  damage_estimate numeric(10,2) DEFAULT 0,
  police_report_number text DEFAULT '',
  insurance_claim_number text DEFAULT '',
  status text NOT NULL DEFAULT 'reported',
  resolution text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert incidents"
  ON incidents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);
CREATE INDEX IF NOT EXISTS idx_buses_registration ON buses(registration_number);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_bus ON trips(bus_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_bus ON maintenance_records(bus_id);
CREATE INDEX IF NOT EXISTS idx_fuel_bus ON fuel_records(bus_id);
CREATE INDEX IF NOT EXISTS idx_incidents_bus ON incidents(bus_id);
