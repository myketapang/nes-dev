// NES Dashboard - Complete data type mapping for all 85 columns
export interface NESRecord {
  // Core Program & Event Info
  program_name: string;
  custom_program_name: string;
  category_name: string;
  subcategory_name: string;
  program_mode_name: string;
  event_id: string;
  event_description: string;
  location_event: string;
  
  // Date & Time
  event_date: string;
  participation_date: string;
  event_created_at: string;
  event_updated_at: string;
  start_datetime: string;
  end_datetime: string;
  event_year: number;
  event_month: number;
  event_month_name: string;
  event_quarter: string;
  event_week: number;
  event_day_of_week: number;
  event_hour: number;
  time_of_day: string;
  
  
  // Duration
  duration: number;
  duration_hours: number;
  event_duration_hours: number;
  duration_category: string;
  
  // Participant Info
  participant_id: number;
  member_id: number;
  membership_status: string;
  
  // Participant Metrics
  event_total_participants: number;
  target_participants: number;
  actual_participants: number;
  attended_count: number;
  verified_count: number;
  total_new_member: number;
  
  // Demographics
  avg_participant_age: number;
  male_count: number;
  female_count: number;
  gender_known_count: number;
  male_percent: number;
  female_percent: number;
  primary_race: string;
  age_group: string;
  
  // Performance Metrics
  attendance_rate_percent: number;
  target_achievement_percent: number;
  target_status: string;
  
  // Organization Info
  organization_id: string;
  organization_name: string;
  organization_type: string;
  sso_name: string;
  source_name: string;
  trainer_name: string;
  requester_id: string;
  
  // Site/NADI Info
  site_id: number;
  site_id_site: number;
  primary_site_id: number;
  site_name: string;
  site_fullname: string;
  nadi_name: string;
  nadi_location: string;
  site_email: string;
  site_phone: string;
  site_website: string;
  
  // Geospatial
  latitude: number;
  longitude: number;
  
  // Site Technical Info
  technology_name: string;
  bandwidth_name: string;
  site_population: number;
  oku_friendly: string;
  site_active: string;
  site_operate_date: string;
  start_operation_date: number;
  end_operation_date: number;
  
  // Geographic Hierarchy
  state_id: number;
  state_id_site: number;
  state_code: string;
  state_name: string;
  region_id: number;
  region_name: string;
  
  // Event Status
  event_active: boolean;
  event_acknowledged: boolean;
  phase_name: number;
  admin_status_id: number;
  
  // Add parsed_event_date as Date type
  parsed_event_date?: Date;

  // Allow dynamic access
  [key: string]: string | number | boolean | Date | undefined;
}

export interface NESFilters {
  state: string[];
  region: string[];
  category: string[];
  program: string[];
  organization: string[];
  sso: string[];
  membershipStatus: string[];
  targetStatus: string[];
  timeOfDay: string[];
  ageGroup: string[];
  quarter: string[];
  dateStart: string;
  dateEnd: string;
  year: string[];
  month: string[];
}

export interface NESKPIs {
  totalParticipants: number;
  uniqueMembers: number;
  totalEvents: number;
  totalNadi: number;
  avgAttendanceRate: number;
  avgTargetAchievement: number;
  totalNewMembers: number;
  avgParticipantAge: number;
  malePercent: number;
  femalePercent: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  name: string;
  participants: number;
  events: number;
  state: string;
}

export interface StateMetrics {
  state: string;
  stateCode: string;
  participants: number;
  events: number;
  nadiCount: number;
  avgAttendance: number;
}

// Helper types for filter operations
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterOptions {
  state: FilterOption[];
  region: FilterOption[];
  category: FilterOption[];
  program: FilterOption[];
  organization: FilterOption[];
  sso: FilterOption[];
  membershipStatus: FilterOption[];
  targetStatus: FilterOption[];
  timeOfDay: FilterOption[];
  ageGroup: FilterOption[];
  quarter: FilterOption[];
  month: FilterOption[];
  year: FilterOption[];
}

// Type for filter change handler
export type FilterChangeHandler = (key: keyof NESFilters, value: string | string[]) => void;