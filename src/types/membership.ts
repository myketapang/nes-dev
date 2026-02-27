// Updated to match new consolidated_data.csv schema from Python script
export interface ParticipantRecord {
  // Direct CSV columns
  participant_id: string;
  member_id: string;
  participation_date: string;
  event_id: string;
  program_name: string;
  event_created_at: string;
  event_total_participants: number;
  event_duration_hours: number;
  event_description: string;
  sso_name: string;
  site_id: string;
  nadi_name: string;
  nadi_location: string;
  organization_id: string;
  organization_name: string;
  organization_type: string;
  state_id: string;
  state_name: string;
  region_id: string;
  region_name: string;
  membership_status: string;
  event_year: number;
  event_month: number;
  event_month_name: string;
  event_date: string;
  event_quarter: string;
  source_name: string;
  [key: string]: string | number;
}

export interface MembershipFilters {
  nadi: string;
  state: string;
  region: string;
  sso: string;
  organization: string;
  membershipStatus: string;
  quarter: string;
  dateStart: string;
  dateEnd: string;
}

export interface MembershipKPIs {
  totalParticipants: number;
  uniqueMembers: number;
  totalEvents: number;
  totalNadi: number;
  memberRate: number;
  avgParticipantsPerEvent: number;
}

export interface CrosstabData {
  [key: string]: { [key: string]: number };
}

export interface ChartDataItem {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface TimeSeriesDataItem {
  period: string;
  value: number;
  label?: string;
}

export interface RegionData {
  region: string;
  states: string[];
  count: number;
  percentage: number;
}
