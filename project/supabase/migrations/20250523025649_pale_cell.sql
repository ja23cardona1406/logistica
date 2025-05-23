/*
  # Initial Database Schema

  1. Tables
    - profiles (extends auth.users)
    - sessions (work sessions)
    - shipments and shipment_items
    - processes and process_steps
    - process_executions and process_step_executions
    - alerts
    - exemplary_processes
    - assistant_logs

  2. Security
    - RLS enabled on all tables
    - Policies for user and admin access
    - Role-based access control

  3. Sample Data
    - Basic process templates
    - Example steps
    - Exemplary processes
*/

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('operator', 'admin')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions table (work sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  
  CONSTRAINT sessions_active_check CHECK (
    (active = TRUE AND ended_at IS NULL) OR
    (active = FALSE AND ended_at IS NOT NULL)
  )
);

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'error')),
  type TEXT NOT NULL CHECK (type IN ('import', 'export')),
  client_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  arrival_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shipment items table
CREATE TABLE IF NOT EXISTS shipment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  weight NUMERIC(10, 2),
  description TEXT
);

-- Processes table
CREATE TABLE IF NOT EXISTS processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('import', 'export', 'both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Process steps table
CREATE TABLE IF NOT EXISTS process_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,
  
  UNIQUE (process_id, step_order)
);

-- Process executions table
CREATE TABLE IF NOT EXISTS process_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id),
  shipment_id UUID NOT NULL REFERENCES shipments(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  session_id UUID NOT NULL REFERENCES sessions(id),
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'error')),
  current_step INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Process step executions table
CREATE TABLE IF NOT EXISTS process_step_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_execution_id UUID NOT NULL REFERENCES process_executions(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES process_steps(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'error')),
  completed_at TIMESTAMPTZ,
  error_description TEXT,
  image_url TEXT
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_execution_id UUID NOT NULL REFERENCES process_executions(id),
  step_execution_id UUID REFERENCES process_step_executions(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('error', 'warning', 'info')),
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id)
);

-- Exemplary processes table
CREATE TABLE IF NOT EXISTS exemplary_processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id)
);

-- Assistant logs table
CREATE TABLE IF NOT EXISTS assistant_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  query TEXT NOT NULL,
  detected_intent TEXT NOT NULL,
  confidence NUMERIC(4, 3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exemplary_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Sessions policies
CREATE POLICY "Users can read their own sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions"
  ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Shipments policies
CREATE POLICY "All users can read shipments"
  ON shipments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create shipments"
  ON shipments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update shipments"
  ON shipments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Shipment items policies
CREATE POLICY "All users can read shipment items"
  ON shipment_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Processes policies
CREATE POLICY "All users can read processes"
  ON processes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create processes"
  ON processes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update processes"
  ON processes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Process steps policies
CREATE POLICY "All users can read process steps"
  ON process_steps
  FOR SELECT
  TO authenticated
  USING (true);

-- Process executions policies
CREATE POLICY "Users can read their own process executions"
  ON process_executions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own process executions"
  ON process_executions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own process executions"
  ON process_executions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all process executions"
  ON process_executions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Process step executions policies
CREATE POLICY "Users can read their related step executions"
  ON process_step_executions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM process_executions
      WHERE process_executions.id = process_step_executions.process_execution_id
      AND process_executions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their related step executions"
  ON process_step_executions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM process_executions
      WHERE process_executions.id = process_step_executions.process_execution_id
      AND process_executions.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all step executions"
  ON process_step_executions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Alerts policies
CREATE POLICY "Users can create alerts"
  ON alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all alerts"
  ON alerts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update alerts"
  ON alerts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Exemplary processes policies
CREATE POLICY "All users can read exemplary processes"
  ON exemplary_processes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create exemplary processes"
  ON exemplary_processes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Assistant logs policies
CREATE POLICY "Users can create their own assistant logs"
  ON assistant_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all assistant logs"
  ON assistant_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert sample data for testing
-- Note: In a production environment, this would be handled differently
INSERT INTO processes (id, name, description, type)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Proceso de Importación Estándar', 'Proceso estándar para la importación de mercancías', 'import'),
  ('22222222-2222-2222-2222-222222222222', 'Proceso de Exportación Estándar', 'Proceso estándar para la exportación de mercancías', 'export');

INSERT INTO process_steps (process_id, step_order, title, description, is_critical)
VALUES
  ('11111111-1111-1111-1111-111111111111', 1, 'Verificación de documentos', 'Verificar que todos los documentos de importación estén completos y correctos', true),
  ('11111111-1111-1111-1111-111111111111', 2, 'Inspección física', 'Realizar inspección física de la mercancía', true),
  ('11111111-1111-1111-1111-111111111111', 3, 'Validación de cantidades', 'Verificar que las cantidades recibidas coincidan con la documentación', true),
  ('11111111-1111-1111-1111-111111111111', 4, 'Registro en sistema', 'Registrar la mercancía en el sistema interno', false),
  ('11111111-1111-1111-1111-111111111111', 5, 'Etiquetado', 'Aplicar etiquetas correspondientes a la mercancía', false),
  ('22222222-2222-2222-2222-222222222222', 1, 'Verificación de documentos', 'Verificar que todos los documentos de exportación estén completos y correctos', true),
  ('22222222-2222-2222-2222-222222222222', 2, 'Embalaje', 'Verificar que el embalaje sea adecuado para exportación', true),
  ('22222222-2222-2222-2222-222222222222', 3, 'Etiquetado internacional', 'Aplicar etiquetas internacionales según el destino', true),
  ('22222222-2222-2222-2222-222222222222', 4, 'Registro de salida', 'Registrar la salida de la mercancía en el sistema', false);

INSERT INTO exemplary_processes (process_id, title, description, image_url, created_by)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Importación perfecta de electrónicos', 'Ejemplo de un proceso de importación de electrónicos realizado correctamente', 'https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', '00000000-0000-0000-0000-000000000000'),
  ('22222222-2222-2222-2222-222222222222', 'Exportación a Europa con documentación correcta', 'Proceso ejemplar de exportación a Europa con toda la documentación en regla', 'https://images.pexels.com/photos/1427541/pexels-photo-1427541.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', '00000000-0000-0000-0000-000000000000');