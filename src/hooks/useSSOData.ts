import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ParticipantRecord, MembershipFilters, MembershipKPIs } from '@/types/membership';

// Load from local project file
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

export function useSSOData() {
  const [searchParams] = useSearchParams();
  const ssoFromUrl = searchParams.get('source') || '';

  const [allData, setAllData] = useState<ParticipantRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSSO, setCurrentSSO] = useState(ssoFromUrl);
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

  useEffect(() => {
    setCurrentSSO(ssoFromUrl);
  }, [ssoFromUrl]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${CSV_URL}?t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const text = await response.text();
      const parsed = parseCSV(text);
      const processed = preprocessData(parsed);
      setAllData(processed);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching SSO data:', err);
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

  // Data filtered by SSO source
  const ssoFilteredData = useMemo(() => {
    if (!currentSSO) return allData;
    return allData.filter(row => row.sso_name === currentSSO);
  }, [allData, currentSSO]);

  // Data filtered by both SSO and user filters
  const filteredData = useMemo(() => {
    return ssoFilteredData.filter(row => {
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
        (filters.membershipStatus === 'All' || row.membership_status === filters.membershipStatus) &&
        (filters.quarter === 'All' || row.event_quarter === filters.quarter);
    });
  }, [ssoFilteredData, filters]);

  const filterOptions = useMemo(() => {
    return {
      nadi: [...new Set(ssoFilteredData.map(d => d.nadi_name))].filter(Boolean).sort(),
      state: [...new Set(ssoFilteredData.map(d => d.state_name))].filter(Boolean).sort(),
      region: [...new Set(ssoFilteredData.map(d => d.region_name))].filter(Boolean).sort(),
      sso: [...new Set(allData.map(d => d.sso_name))].filter(Boolean).sort(),
      organization: [...new Set(ssoFilteredData.map(d => d.organization_name))].filter(Boolean).sort(),
      membershipStatus: [...new Set(ssoFilteredData.map(d => d.membership_status))].filter(Boolean).sort(),
      quarter: [...new Set(ssoFilteredData.map(d => d.event_quarter))].filter(Boolean).sort(),
    };
  }, [ssoFilteredData, allData]);

  const kpis = useMemo((): MembershipKPIs => {
    const data = filteredData.length > 0 ? filteredData : ssoFilteredData;
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
  }, [filteredData, ssoFilteredData]);

  // Program report data
  const programReport = useMemo(() => {
    const data = filteredData.length > 0 ? filteredData : ssoFilteredData;
    const grouped: Record<string, { programName: string; eventDate: string; participants: number }> = {};

    data.forEach(d => {
      const key = `${d.program_name}-${d.event_date}`;
      if (!grouped[key]) {
        grouped[key] = {
          programName: d.program_name || 'Unknown',
          eventDate: d.event_date || 'Unknown',
          participants: 0,
        };
      }
      grouped[key].participants++;
    });

    return Object.values(grouped).sort((a, b) => b.eventDate.localeCompare(a.eventDate)).slice(0, 50);
  }, [filteredData, ssoFilteredData]);

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

  const availableSSOSources = useMemo(() => {
    return [...new Set(allData.map(d => d.sso_name))].filter(Boolean).sort();
  }, [allData]);

  return {
    allData,
    ssoFilteredData,
    filteredData,
    isLoading,
    error,
    currentSSO,
    filters,
    filterOptions,
    kpis,
    programReport,
    availableSSOSources,
    lastRefresh,
    updateFilter,
    resetFilters,
    refreshData,
  };
}
