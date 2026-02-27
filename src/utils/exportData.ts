import * as XLSX from 'xlsx';
import { MaintenanceTicket } from '@/types/maintenance';

function formatTicketForExport(item: MaintenanceTicket) {
  return {
    'REFID MCMC': item.refid_mcmc,
    'NADI': item.nadi,
    'State': item.state,
    'TP': item.tp,
    'DUSP': item.dusp,
    'Phase': item.phase,
    'Maintenance Type': item.maintenance_type,
    'Description': item.title,
    'Status': item.status,
    'Priority': item.priority,
    'Registered Date': item.registered_date_parsed 
      ? item.registered_date_parsed.toLocaleDateString() 
      : 'N/A',
    'Updated Date': item.updated_date_parsed 
      ? item.updated_date_parsed.toLocaleDateString() 
      : 'N/A',
  };
}

export function exportToExcel(data: MaintenanceTicket[], filename = 'maintenance_data.xlsx'): boolean {
  if (data.length === 0) return false;

  const exportData = data.map(formatTicketForExport);
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Maintenance Data');
  XLSX.writeFile(workbook, filename);
  
  return true;
}

export function exportToCSV(data: MaintenanceTicket[], filename = 'maintenance_data.csv'): boolean {
  if (data.length === 0) return false;

  const exportData = data.map(formatTicketForExport);
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return true;
}
