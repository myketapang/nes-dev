import { NESFilters, FilterOptions } from '@/types/nes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal, X } from 'lucide-react';

interface NESFilterPanelProps {
  filters: NESFilters;
  filterOptions: FilterOptions;
  onFilterChange: (key: keyof NESFilters, value: string | string[]) => void;
  onReset: () => void;
  activeCount: number;
  availableYears?: string[];
  availableMonths?: string[];
}

type MultiFilterKey = Exclude<keyof NESFilters, 'dateStart' | 'dateEnd'>;

const FILTER_CONFIGS: { key: MultiFilterKey; label: string; optionKey: keyof FilterOptions }[] = [
  { key: 'state', label: 'State', optionKey: 'state' },
  { key: 'category', label: 'Category', optionKey: 'category' },
  { key: 'program', label: 'Program', optionKey: 'program' },
  { key: 'organization', label: 'Organization', optionKey: 'organization' },
  { key: 'sso', label: 'SSO', optionKey: 'sso' },
  { key: 'membershipStatus', label: 'Membership', optionKey: 'membershipStatus' },
  { key: 'targetStatus', label: 'Target Status', optionKey: 'targetStatus' },
  { key: 'timeOfDay', label: 'Time of Day', optionKey: 'timeOfDay' },
  { key: 'ageGroup', label: 'Age Group', optionKey: 'ageGroup' },
  { key: 'quarter', label: 'Quarter', optionKey: 'quarter' },
];

export function NESFilterPanel({
  filters,
  filterOptions,
  onFilterChange,
  onReset,
  activeCount,
  availableYears = [],
  availableMonths = [],
}: NESFilterPanelProps) {
  const isActive = (key: MultiFilterKey, value: string) => {
    const v = filters[key] as string[];
    return v.includes(value);
  };

  const handleToggle = (key: MultiFilterKey, value: string) => {
    onFilterChange(key, value);
  };

  return (
    <div className="gov-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Filters</span>
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

      {/* Year & Month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {availableYears.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Year</p>
            <div className="flex flex-wrap gap-1">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => handleToggle('year', year)}
                  className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                    isActive('year', year)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableMonths.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Month</p>
            <div className="flex flex-wrap gap-1">
              {availableMonths.slice(0, 12).map(month => (
                <button
                  key={month}
                  onClick={() => handleToggle('month', month)}
                  className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                    isActive('month', month)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Other filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {FILTER_CONFIGS.map(({ key, label, optionKey }) => {
          const options = filterOptions[optionKey];
          if (!options || options.length === 0) return null;

          return (
            <div key={key} className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {options.slice(0, 10).map(opt => {
                  const value = typeof opt === 'string' ? opt : opt.value;
                  const display = typeof opt === 'string' ? opt : opt.label;
                  return (
                    <button
                      key={value}
                      onClick={() => handleToggle(key, value)}
                      className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                        isActive(key, value)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {display}
                    </button>
                  );
                })}
                {options.length > 10 && (
                  <span className="px-2 py-0.5 text-xs text-muted-foreground">+{options.length - 10}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/50">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date Range</span>
        <input
          type="date"
          value={filters.dateStart ?? ''}
          onChange={e => onFilterChange('dateStart', e.target.value)}
          className="h-7 rounded border border-input bg-background px-2 text-xs"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <input
          type="date"
          value={filters.dateEnd ?? ''}
          onChange={e => onFilterChange('dateEnd', e.target.value)}
          className="h-7 rounded border border-input bg-background px-2 text-xs"
        />
        {(filters.dateStart || filters.dateEnd) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive"
            onClick={() => { onFilterChange('dateStart', ''); onFilterChange('dateEnd', ''); }}
          >
            <X className="w-3 h-3 mr-1" />
            Clear dates
          </Button>
        )}
      </div>
    </div>
  );
}
