import { useState, useEffect, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { MaintenanceTicket, FilterState, DateFilter, FilterOptions, FilterKey } from '@/types/maintenance';

const DATA_URL = 'https://nes-analytics.s3.ap-southeast-5.amazonaws.com/maintainance/maintence.csv';

// Demo data for immediate display
const generateDemoData = (): MaintenanceTicket[] => {
  const statuses = ['Open', 'Closed', 'In Progress'];
  const priorities = ['High', 'Medium', 'Low'];
  const types = ['Hardware Repair', 'Software Update', 'Network Issue', 'Electrical', 'Air Conditioning', 'Security System', 'Plumbing', 'General Maintenance'];
  const phases = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'];
  const states = ['Selangor', 'Kuala Lumpur', 'Johor', 'Penang', 'Sarawak', 'Sabah', 'Perak', 'Pahang'];
  const nadis = ['NADI Centrum', 'NADI Taman', 'NADI Komuniti', 'NADI Bandar', 'NADI Desa'];
  const tps = ['TP Alpha', 'TP Beta', 'TP Gamma', 'TP Delta'];
  const dusps = ['DUSP One', 'DUSP Two', 'DUSP Three', 'DUSP Four'];
  const requesters = ['Ahmad Razak', 'Siti Nurhaliza', 'John Tan', 'Mary Lee', 'Raj Kumar', 'Nurul Aina'];
  const descriptions = [
    'Equipment malfunction requiring immediate attention',
    'Routine maintenance check and servicing',
    'System upgrade and configuration update',
    'Preventive maintenance scheduled work',
    'Emergency repair due to component failure',
    'Performance optimization and tuning',
  ];

  const data: MaintenanceTicket[] = [];
  const now = new Date();

  for (let i = 0; i < 250; i++) {
    const regDate = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const updDate = new Date(regDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    data.push({
      title: `Maintenance ticket ${i + 1}`,
      maintenance_description: descriptions[Math.floor(Math.random() * descriptions.length)],
      refid_mcmc: `MCMC-${String(i + 1).padStart(5, '0')}`,
      nadi: nadis[Math.floor(Math.random() * nadis.length)],
      state: states[Math.floor(Math.random() * states.length)],
      tp: tps[Math.floor(Math.random() * tps.length)],
      dusp: dusps[Math.floor(Math.random() * dusps.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      requester: requesters[Math.floor(Math.random() * requesters.length)],
      maintenance_type: types[Math.floor(Math.random() * types.length)],
      phase: phases[Math.floor(Math.random() * phases.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      registered_date: regDate.toISOString(),
      updated_date: updDate.toISOString(),
      registered_date_parsed: regDate,
      updated_date_parsed: updDate,
      registered_month: regDate.toISOString().slice(0, 7),
    });
  }
  return data;
};

function findCol(data: Record<string, unknown>[], candidates: string[]): string | null {
  if (!data.length) return null;
  const colsLower = Object.keys(data[0]).reduce((acc, c) => {
    acc[String(c).toLowerCase().trim()] = String(c).trim();
    return acc;
  }, {} as Record<string, string>);
  
  for (const cand of candidates) {
    if (colsLower[cand.toLowerCase()]) {
      return colsLower[cand.toLowerCase()];
    }
  }
  return null;
}

function preprocessData(data: Record<string, unknown>[]): MaintenanceTicket[] {
  if (!data || data.length === 0) return [];

  const renameMap = {
    title: findCol(data, ['title', 'ticket_title']),
    maintenance_description: findCol(data, ['maintenance_description', 'description', 'desc']),
    refid_mcmc: findCol(data, ['refid_mcmc']),
    nadi: findCol(data, ['Nadi', 'pedi_name', 'nadi']),
    state: findCol(data, ['state']),
    tp: findCol(data, ['tp']),
    dusp: findCol(data, ['dusp']),
    status: findCol(data, ['status', 'maintenance_status', 'maintenance_status_name']),
    requester: findCol(data, ['requester', 'requested_by', 'requestor', 'requester_by']),
    maintenance_type: findCol(data, ['maintenance_type', 'maintenance_type_name', 'type']),
    phase: findCol(data, ['phase_by', 'phase', 'phase_name']),
    priority: findCol(data, ['priority_name', 'priority', 'priorities']),
    registered_date: findCol(data, ['registered_date', 'registered', 'created_at', 'created', 'created_date']),
    updated_date: findCol(data, ['updated_date', 'updated', 'last_updated']),
    image_url: findCol(data, ['image_url', 'maintenance_image', 'image']),
    maintenance_actions: findCol(data, ['maintenance_actions', 'actions']),
  };

  // Define the base URL and token for constructing image URLs
  const BASE_IMAGE_URL = 'https://api.nadi.my/api/attachment/view?file_url=';
  const IMAGE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NHcm91cCI6MywiYXV0aG9yaXplZCI6dHJ1ZSwiY29tcGFueUlEIjoiMSIsImV4cCI6MTc3MTA1MzE5OSwicGVkaUlEIjoiMCIsInVzZXJJRCI6IjI2NjAwMDE5MjUifQ.3EnUGSprDTZTCsZna1THTySaZ5boPkMO4fdVWJXOanE';

  // Function to clean filename by removing /upload/ prefix
  const cleanFileName = (filename: string): string => {
    if (!filename) return '';
    
    // Remove /upload/ prefix if present
    if (filename.startsWith('/upload/')) {
      return filename.substring(8);
    }
    
    // Also handle cases where it might be just "upload/"
    if (filename.startsWith('upload/')) {
      return filename.substring(7);
    }
    
    return filename;
  };

  return data.map(item => {
    const preppedItem: Partial<MaintenanceTicket> = {};
    
    for (const canonical in renameMap) {
      const original = renameMap[canonical as keyof typeof renameMap];
      if (original && item[original] !== undefined && item[original] !== null && String(item[original]).trim() !== '') {
        // Handle maintenance_actions as JSON
        if (canonical === 'maintenance_actions') {
          try {
            const rawValue = item[original];
            if (typeof rawValue === 'string') {
              const actions = JSON.parse(rawValue);
              preppedItem.maintenance_actions = actions.map((action: any) => ({
                ...action,
                files: action.files?.map((file: string) => {
                  if (file && !file.startsWith('http')) {
                    const cleanedFile = cleanFileName(file);
                    const encodedFilename = encodeURIComponent(cleanedFile);
                    return `${BASE_IMAGE_URL}${encodedFilename}&token=${IMAGE_TOKEN}`;
                  }
                  return file;
                }) || []
              }));
            } else if (Array.isArray(rawValue)) {
              preppedItem.maintenance_actions = rawValue.map((action: any) => ({
                ...action,
                files: action.files?.map((file: string) => {
                  if (file && !file.startsWith('http')) {
                    const cleanedFile = cleanFileName(file);
                    const encodedFilename = encodeURIComponent(cleanedFile);
                    return `${BASE_IMAGE_URL}${encodedFilename}&token=${IMAGE_TOKEN}`;
                  }
                  return file;
                }) || []
              }));
            }
          } catch {
            preppedItem.maintenance_actions = [];
          }
        } else if (canonical === 'image_url') {
          const imageValue = String(item[original]).trim();
          if (imageValue && !imageValue.startsWith('http')) {
            const cleanedFilename = cleanFileName(imageValue);
            const encodedFilename = encodeURIComponent(cleanedFilename);
            preppedItem.image_url = `${BASE_IMAGE_URL}${encodedFilename}&token=${IMAGE_TOKEN}`;
          } else {
            preppedItem.image_url = imageValue;
          }
        } else {
          (preppedItem as Record<string, string>)[canonical] = String(item[original]).trim();
        }
      } else {
        if (canonical === 'requester') {
          (preppedItem as Record<string, string>)[canonical] = '';
        } else if (canonical !== 'image_url' && canonical !== 'maintenance_actions') {
          (preppedItem as Record<string, string>)[canonical] = 'Unknown';
        }
      }
    }

    const registeredDate = preppedItem.registered_date !== 'Unknown' 
      ? new Date(preppedItem.registered_date as string) 
      : null;
    preppedItem.registered_date_parsed = registeredDate && !isNaN(registeredDate.getTime()) ? registeredDate : null;

    const updatedDate = preppedItem.updated_date !== 'Unknown' 
      ? new Date(preppedItem.updated_date as string) 
      : null;
    preppedItem.updated_date_parsed = updatedDate && !isNaN(updatedDate.getTime()) ? updatedDate : null;

    preppedItem.registered_month = preppedItem.registered_date_parsed 
      ? preppedItem.registered_date_parsed.toISOString().slice(0, 7) 
      : 'Unknown';

    return preppedItem as MaintenanceTicket;
  });
}

const initialFilterState: FilterState = {
  status: new Set(),
  type: new Set(),
  priority: new Set(),
  phase: new Set(),
  nadi: new Set(),
  state: new Set(),
  tp: new Set(),
  dusp: new Set(),
};

export function useMaintenanceData() {
  const [allData, setAllData] = useState<MaintenanceTicket[]>(() => generateDemoData());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ start: null, end: null });

  useEffect(() => {
    async function loadRealData() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(DATA_URL, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) return;
        
        const text = await response.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

        if (jsonData.length > 0) {
          const processedData = preprocessData(jsonData);
          setAllData(processedData);
        }
      } catch (err) {
        console.log('Using demo data');
      }
    }

    loadRealData();
  }, []);

  const filterOptions = useMemo<FilterOptions>(() => {
    return {
      status: [...new Set(allData.map(d => d.status))].sort(),
      type: [...new Set(allData.map(d => d.maintenance_type))].sort(),
      priority: [...new Set(allData.map(d => d.priority))].sort(),
      phase: [...new Set(allData.map(d => d.phase))].sort(),
      nadi: [...new Set(allData.map(d => d.nadi))].sort(),
      state: [...new Set(allData.map(d => d.state))].sort(),
      tp: [...new Set(allData.map(d => d.tp))].sort(),
      dusp: [...new Set(allData.map(d => d.dusp))].sort(),
    };
  }, [allData]);

  const filteredData = useMemo(() => {
    const keyMap: Record<FilterKey, keyof MaintenanceTicket> = {
      status: 'status',
      type: 'maintenance_type',
      priority: 'priority',
      phase: 'phase',
      nadi: 'nadi',
      state: 'state',
      tp: 'tp',
      dusp: 'dusp',
    };

    return allData.filter(item => {
      let dateMatch = true;
      if (dateFilter.start || dateFilter.end) {
        if (item.registered_date_parsed) {
          const itemDate = item.registered_date_parsed;
          if (dateFilter.start && itemDate < dateFilter.start) {
            dateMatch = false;
          }
          if (dateFilter.end && itemDate > dateFilter.end) {
            dateMatch = false;
          }
        } else {
          dateMatch = false;
        }
      }

      let multiSelectMatch = true;
      for (const [filterKey, dataKey] of Object.entries(keyMap)) {
        const filterSet = filters[filterKey as FilterKey];
        if (filterSet.size > 0) {
          if (!filterSet.has(item[dataKey] as string)) {
            multiSelectMatch = false;
            break;
          }
        }
      }

      return dateMatch && multiSelectMatch;
    });
  }, [allData, filters, dateFilter]);

  const latestDataDate = useMemo(() => {
    let latest: Date | null = null;
    allData.forEach(item => {
      const date = item.updated_date_parsed || item.registered_date_parsed;
      if (date && (!latest || date > latest)) {
        latest = date;
      }
    });
    return latest;
  }, [allData]);

  const toggleFilter = useCallback((key: FilterKey, value: string) => {
    setFilters(prev => {
      const newSet = new Set(prev[key]);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [key]: newSet };
    });
  }, []);

  const setFilterValues = useCallback((key: FilterKey, values: Set<string>) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilterState);
    setDateFilter({ start: null, end: null });
  }, []);

  const setQuickDateFilter = useCallback((period: string) => {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (period) {
      case '7':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90':
        start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '365':
        start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        break;
      case 'ytd':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'current-month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'previous-month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }

    end.setHours(23, 59, 59, 999);
    setDateFilter({ start, end });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.values(filters).forEach(set => {
      count += set.size;
    });
    if (dateFilter.start || dateFilter.end) count++;
    return count;
  }, [filters, dateFilter]);

  return {
    allData,
    filteredData,
    isLoading,
    error,
    filters,
    dateFilter,
    filterOptions,
    latestDataDate,
    activeFilterCount,
    toggleFilter,
    setFilterValues,
    setDateFilter,
    setQuickDateFilter,
    resetFilters,
  };
}
