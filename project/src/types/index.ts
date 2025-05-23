export interface User {
  id: string;
  email: string;
  role: 'operator' | 'admin';
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  active: boolean;
}

export interface Shipment {
  id: string;
  tracking_code: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  type: 'import' | 'export';
  client_name: string;
  destination: string;
  arrival_date: string;
  items: ShipmentItem[];
  created_at: string;
}

export interface ShipmentItem {
  id: string;
  shipment_id: string;
  name: string;
  quantity: number;
  unit: string;
  weight: number;
  description: string;
}

export interface Process {
  id: string;
  name: string;
  description: string;
  type: 'import' | 'export' | 'both';
  steps: ProcessStep[];
  created_at: string;
  updated_at: string;
}

export interface ProcessStep {
  id: string;
  process_id: string;
  order: number;
  title: string;
  description: string;
  image_url?: string;
  is_critical: boolean;
}

export interface ProcessExecution {
  id: string;
  process_id: string;
  shipment_id: string;
  user_id: string;
  session_id: string;
  status: 'in_progress' | 'completed' | 'error';
  current_step: number;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
}

export interface ProcessStepExecution {
  id: string;
  process_execution_id: string;
  step_id: string;
  status: 'pending' | 'completed' | 'error';
  completed_at: string | null;
  error_description: string | null;
  image_url?: string;
}

export interface Alert {
  id: string;
  process_execution_id: string;
  step_execution_id: string | null;
  user_id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

export interface ExemplaryProcess {
  id: string;
  process_id: string;
  title: string;
  description: string;
  image_url: string;
  video_url?: string;
  created_at: string;
  created_by: string;
}

export interface NLPQuery {
  query: string;
  context?: string;
}

export interface NLPResponse {
  intent: string;
  confidence: number;
  answer?: string;
  processId?: string;
  stepId?: string;
  imageUrl?: string;
}