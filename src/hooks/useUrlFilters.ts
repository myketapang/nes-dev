import { useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilterState, DateFilter, FilterKey } from '@/types/maintenance';

const FILTER_KEYS: FilterKey[] = ['status', 'type', 'priority', 'phase', 'nadi', 'state', 'tp', 'dusp'];

export function useUrlFilters(
  filters: FilterState,
  dateFilter: DateFilter,
  setFilterValues: (key: FilterKey, values: Set<string>) => void,
  setDateFilter: (filter: DateFilter) => void
) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync URL to state on mount
  useEffect(() => {
    FILTER_KEYS.forEach(key => {
      const param = searchParams.get(key);
      if (param) {
        const values = param.split(',').filter(Boolean);
        if (values.length > 0) {
          setFilterValues(key, new Set(values));
        }
      }
    });

    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    if (startParam || endParam) {
      setDateFilter({
        start: startParam ? new Date(startParam) : null,
        end: endParam ? new Date(endParam) : null,
      });
    }
  }, []); // Only on mount

  // Sync state to URL
  const syncToUrl = useCallback(() => {
    const params = new URLSearchParams();

    FILTER_KEYS.forEach(key => {
      const values = Array.from(filters[key]);
      if (values.length > 0) {
        params.set(key, values.join(','));
      }
    });

    if (dateFilter.start) {
      params.set('start', dateFilter.start.toISOString().split('T')[0]);
    }
    if (dateFilter.end) {
      params.set('end', dateFilter.end.toISOString().split('T')[0]);
    }

    setSearchParams(params, { replace: true });
  }, [filters, dateFilter, setSearchParams]);

  // Debounced URL sync
  useEffect(() => {
    const timer = setTimeout(syncToUrl, 300);
    return () => clearTimeout(timer);
  }, [syncToUrl]);

  const hasUrlFilters = useMemo(() => {
    return FILTER_KEYS.some(key => searchParams.has(key)) || 
           searchParams.has('start') || 
           searchParams.has('end');
  }, [searchParams]);

  return { hasUrlFilters };
}
