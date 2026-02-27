export interface MaintenanceAction {
  maintenance_action_id: number;
  action_text: string;
  action: string;
  files: string[];
  created_at: string;
}

export interface MaintenanceTicket {
  title: string;
  maintenance_description: string;
  refid_mcmc: string;
  nadi: string;
  state: string;
  tp: string;
  dusp: string;
  status: string;
  requester: string;
  maintenance_type: string;
  phase: string;
  priority: string;
  registered_date: string;
  updated_date: string;
  registered_date_parsed: Date | null;
  updated_date_parsed: Date | null;
  registered_month: string;
  image_url?: string;
  maintenance_actions?: MaintenanceAction[];
}

export interface FilterState {
  status: Set<string>;
  type: Set<string>;
  priority: Set<string>;
  phase: Set<string>;
  nadi: Set<string>;
  state: Set<string>;
  tp: Set<string>;
  dusp: Set<string>;
}

export interface DateFilter {
  start: Date | null;
  end: Date | null;
}

export interface FilterOptions {
  status: string[];
  type: string[];
  priority: string[];
  phase: string[];
  nadi: string[];
  state: string[];
  tp: string[];
  dusp: string[];
}

export type FilterKey = keyof FilterState;
