import { FilterState, FilterOptions, FilterKey } from '@/types/maintenance';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, SlidersHorizontal } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterState;
  filterOptions: FilterOptions;
  onToggleFilter: (key: FilterKey, value: string) => void;
  onSetFilterValues: (key: FilterKey, values: Set<string>) => void;
  activeCount: number;
  onReset: () => void;
}

const FILTER_LABELS: Record<FilterKey, string> = {
  status: 'Status',
  type: 'Type',
  priority: 'Priority',
  phase: 'Phase',
  nadi: 'NADI',
  state: 'State',
  tp: 'TP',
  dusp: 'DUSP',
};

export function FilterPanel({
  filters,
  filterOptions,
  onToggleFilter,
  activeCount,
  onReset,
}: FilterPanelProps) {
  const filterKeys = Object.keys(filters) as FilterKey[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs">{activeCount} active</Badge>
          )}
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs gap-1">
            <X className="w-3 h-3" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filterKeys.map(key => {
          const options = filterOptions[key];
          if (!options || options.length === 0) return null;

          return (
            <div key={key} className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {FILTER_LABELS[key]}
              </p>
              <div className="flex flex-wrap gap-1">
                {options.slice(0, 8).map(option => {
                  const isActive = filters[key].has(option);
                  return (
                    <button
                      key={option}
                      onClick={() => onToggleFilter(key, option)}
                      className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
                {options.length > 8 && (
                  <span className="px-2 py-0.5 text-xs text-muted-foreground">
                    +{options.length - 8} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
