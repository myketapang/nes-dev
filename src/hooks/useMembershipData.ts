import { useState, useEffect, useMemo, useCallback } from 'react';
import { ParticipantRecord, MembershipFilters, MembershipKPIs } from '@/types/membership';

// Load from local project file - replace this CSV with Python script output
const CSV_URL = '/data/consolidated_data.csv';

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    data.push(obj);
  }
  return data;
}

// Map CSV columns to ParticipantRecord interface
function preprocessData(data: Record<string, string>[]): ParticipantRecord[] {
  if (data.length === 0) return [];

  return data.map(row => ({
    participant_id: row['participant_id'] || '',
    member_id: row['member_id'] || '',
    participation_date: row['participation_date'] || '',
    event_id: row['event_id'] || '',
    program_name: row['program_name'] || '',
    event_created_at: row['event_created_at'] || '',
    event_total_participants: parseInt(row['event_total_participants']) || 0,
    event_duration_hours: parseFloat(row['event_duration_hours']) || 0,
    event_description: row['event_description'] || '',
    sso_name: row['sso_name'] || row['source_name'] || '',
    site_id: row['site_id'] || '',
    nadi_name: row['nadi_name'] || '',
    nadi_location: row['nadi_location'] || '',
    organization_id: row['organization_id'] || '',
    organization_name: row['organization_name'] || '',
    organization_type: row['organization_type'] || '',
    state_id: row['state_id'] || '',
    state_name: row['state_name'] || '',
    region_id: row['region_id'] || '',
    region_name: row['region_name'] || '',
    membership_status: row['membership_status'] || '',
    event_year: parseInt(row['event_year']) || new Date().getFullYear(),
    event_month: parseInt(row['event_month']) || 1,
    event_month_name: row['event_month_name'] || '',
    event_date: row['event_date'] || '',
    event_quarter: row['event_quarter'] || '',
    source_name: row['source_name'] || row['sso_name'] || '',
  }));
}

export function useMembershipData() {
  const [allData, setAllData] = useState<ParticipantRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [filters, setFilters] = useState<MembershipFilters>({
    nadi: 'All',
    state: 'All',
    region: 'All',
    sso: 'All',
    organization: 'All',
    membershipStatus: 'All',
    quarter: 'All',
    dateStart: '',
    dateEnd: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Add cache-busting timestamp to force reload
      const response = await fetch(`${CSV_URL}?t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const text = await response.text();
      const parsed = parseCSV(text);
      const processed = preprocessData(parsed);
      setAllData(processed);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching membership data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    return allData.filter(row => {
      const rowDate = row.event_date;

      let dateMatch = true;
      if (filters.dateStart && filters.dateEnd) {
        dateMatch = rowDate >= filters.dateStart && rowDate <= filters.dateEnd;
      } else if (filters.dateStart) {
        dateMatch = rowDate >= filters.dateStart;
      } else if (filters.dateEnd) {
        dateMatch = rowDate <= filters.dateEnd;
      }

      return dateMatch &&
        (filters.nadi === 'All' || row.nadi_name === filters.nadi) &&
        (filters.state === 'All' || row.state_name === filters.state) &&
        (filters.region === 'All' || row.region_name === filters.region) &&
        (filters.sso === 'All' || row.sso_name === filters.sso) &&
        (filters.organization === 'All' || row.organization_name === filters.organization) &&
        (filters.membershipStatus === 'All' || row.membership_status === filters.membershipStatus) &&
        (filters.quarter === 'All' || row.event_quarter === filters.quarter);
    });
  }, [allData, filters]);

  const filterOptions = useMemo(() => {
    return {
      nadi: [...new Set(allData.map(d => d.nadi_name))].filter(Boolean).sort(),
      state: [...new Set(allData.map(d => d.state_name))].filter(Boolean).sort(),
      region: [...new Set(allData.map(d => d.region_name))].filter(Boolean).sort(),
      sso: [...new Set(allData.map(d => d.sso_name))].filter(Boolean).sort(),
      organization: [...new Set(allData.map(d => d.organization_name))].filter(Boolean).sort(),
      membershipStatus: [...new Set(allData.map(d => d.membership_status))].filter(Boolean).sort(),
      quarter: [...new Set(allData.map(d => d.event_quarter))].filter(Boolean).sort(),
    };
  }, [allData]);

  const kpis = useMemo((): MembershipKPIs => {
    const data = filteredData.length > 0 ? filteredData : allData;
    // Count UNIQUE participant_ids - normalize by trimming whitespace
    const uniqueParticipants = new Set(
      data.map(d => d.participant_id?.toString().trim()).filter(id => id && id.length > 0)
    ).size;
    // Count UNIQUE member_ids for active memberships
    const uniqueMembers = new Set(
      data.map(d => d.member_id?.toString().trim()).filter(id => id && id.length > 0)
    ).size;
    const uniqueEvents = new Set(data.map(d => d.event_id).filter(Boolean)).size;
    const uniqueNadi = new Set(data.map(d => d.nadi_name).filter(Boolean)).size;
    const members = data.filter(d => d.membership_status === 'Member').length;
    const memberRate = data.length > 0 ? (members / data.length) * 100 : 0;
    const avgParticipants = uniqueEvents > 0 ? uniqueParticipants / uniqueEvents : 0;

    return {
      totalParticipants: uniqueParticipants,
      uniqueMembers,
      totalEvents: uniqueEvents,
      totalNadi: uniqueNadi,
      memberRate,
      avgParticipantsPerEvent: avgParticipants,
    };
  }, [filteredData, allData]);

  const updateFilter = useCallback((key: keyof MembershipFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      nadi: 'All',
      state: 'All',
      region: 'All',
      sso: 'All',
      organization: 'All',
      membershipStatus: 'All',
      quarter: 'All',
      dateStart: '',
      dateEnd: '',
    });
  }, []);

  return {
    allData,
    filteredData,
    isLoading,
    error,
    filters,
    filterOptions,
    kpis,
    lastRefresh,
    updateFilter,
    resetFilters,
    refreshData,
  };
}
