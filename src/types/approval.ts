export interface ApprovalRecord {
  event_status_name: string;
  site_profile_name_tp: string;
  sso_name: string;
}

export interface StatusSummary {
  status: string;
  count: number;
}

export interface CrosstabRow {
  name: string;
  requestApproval: number;
  submitted: number;
}

export interface ApprovalData {
  generatedAt: string;
  source: string;
  statusSummary: StatusSummary[];
  siteCrosstab: CrosstabRow[];
  ssoCrosstab: CrosstabRow[];
  totals: {
    site: { requestApproval: number; submitted: number };
    sso: { requestApproval: number; submitted: number };
  };
}
