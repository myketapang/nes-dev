import { useState, useMemo } from 'react';
import { MaintenanceTicket } from '@/types/maintenance';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps {
  data: MaintenanceTicket[];
}

const PAGE_SIZE = 20;

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  Open: 'warning',
  Closed: 'success',
  'In Progress': 'default',
};

export function DataTable({ data }: DataTableProps) {
  const [page, setPage] = useState(0);

  const paged = useMemo(() => data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [data, page]);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Ticket Data ({data.length.toLocaleString()} records)
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span>Page {page + 1} of {totalPages}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border overflow-auto max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>NADI</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              paged.map((ticket, i) => (
                <TableRow key={`${ticket.refid_mcmc}-${i}`}>
                  <TableCell className="font-mono text-xs">{ticket.refid_mcmc}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs">{ticket.title}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[ticket.status] ?? 'outline'} className="text-xs">
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{ticket.priority}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{ticket.maintenance_type}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{ticket.nadi}</TableCell>
                  <TableCell className="text-xs">{ticket.state}</TableCell>
                  <TableCell className="text-xs">
                    {ticket.registered_date_parsed
                      ? ticket.registered_date_parsed.toLocaleDateString()
                      : ticket.registered_date}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
