import { DateFilter } from '@/types/maintenance';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface DateRangeFilterProps {
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  onQuickFilter: (period: string) => void;
}

const QUICK_FILTERS = [
  { label: '7d', value: '7' },
  { label: '30d', value: '30' },
  { label: '90d', value: '90' },
  { label: 'YTD', value: 'ytd' },
  { label: 'This Month', value: 'current-month' },
  { label: 'Last Month', value: 'previous-month' },
  { label: '1 Year', value: '365' },
];

export function DateRangeFilter({ dateFilter, onDateFilterChange, onQuickFilter }: DateRangeFilterProps) {
  const formatDate = (date: Date | null) =>
    date ? date.toISOString().slice(0, 10) : '';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Date Range</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map(qf => (
          <Button
            key={qf.value}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onQuickFilter(qf.value)}
          >
            {qf.label}
          </Button>
        ))}
        {(dateFilter.start || dateFilter.end) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-destructive"
            onClick={() => onDateFilterChange({ start: null, end: null })}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">From</label>
          <input
            type="date"
            value={formatDate(dateFilter.start)}
            onChange={e => {
              const d = e.target.value ? new Date(e.target.value) : null;
              onDateFilterChange({ ...dateFilter, start: d });
            }}
            className="h-8 rounded border border-input bg-background px-2 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">To</label>
          <input
            type="date"
            value={formatDate(dateFilter.end)}
            onChange={e => {
              const d = e.target.value ? new Date(e.target.value) : null;
              onDateFilterChange({ ...dateFilter, end: d });
            }}
            className="h-8 rounded border border-input bg-background px-2 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
