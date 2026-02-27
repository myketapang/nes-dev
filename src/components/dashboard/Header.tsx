import { Download, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  latestDataDate: Date | null;
  onDownloadExcel: () => void;
  onDownloadCSV: () => void;
  totalRecords: number;
  filteredRecords: number;
}

export function Header({
  latestDataDate,
  onDownloadExcel,
  onDownloadCSV,
  totalRecords,
  filteredRecords,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-border/50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">Maintenance Analytics</h1>
            <p className="text-xs text-muted-foreground">
              {filteredRecords.toLocaleString()} of {totalRecords.toLocaleString()} records
              {latestDataDate && ` · Updated ${latestDataDate.toLocaleDateString()}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:block">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDownloadExcel} className="gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDownloadCSV} className="gap-2">
                  <FileText className="w-4 h-4" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
