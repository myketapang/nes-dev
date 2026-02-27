import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { ApprovalData, ApprovalRecord, StatusSummary, CrosstabRow } from '@/types/approval';

const DATA_URL = 'https://nes-analytics.s3.ap-southeast-5.amazonaws.com/storage/report/approvalTP.csv';

// Generate demo data for immediate display
const generateDemoData = (): ApprovalData => {
  const myt = new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' });
  
  return {
    generatedAt: myt,
    source: 'Demo Data',
    statusSummary: [
      { status: 'Request Approval', count: 145 },
      { status: 'Submitted', count: 312 },
      { status: 'Pending', count: 45 },
      { status: 'Approved', count: 89 },
    ],
    siteCrosstab: [
      { name: 'Site Alpha', requestApproval: 25, submitted: 48 },
      { name: 'Site Beta', requestApproval: 32, submitted: 61 },
      { name: 'Site Gamma', requestApproval: 18, submitted: 39 },
      { name: 'Site Delta', requestApproval: 41, submitted: 75 },
      { name: 'Site Epsilon', requestApproval: 29, submitted: 89 },
    ],
    ssoCrosstab: [
      { name: 'Ahmad Razak', requestApproval: 15, submitted: 28 },
      { name: 'Siti Nurhaliza', requestApproval: 22, submitted: 45 },
      { name: 'John Tan', requestApproval: 18, submitted: 32 },
      { name: 'Mary Lee', requestApproval: 30, submitted: 52 },
      { name: 'Raj Kumar', requestApproval: 25, submitted: 48 },
      { name: 'Nurul Aina', requestApproval: 35, submitted: 67 },
    ],
    totals: {
      site: { requestApproval: 145, submitted: 312 },
      sso: { requestApproval: 145, submitted: 272 },
    },
  };
};

function processCSVData(records: ApprovalRecord[]): ApprovalData {
  const myt = new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' });

  // Status Summary
  const statusCounts: Record<string, number> = {};
  records.forEach(r => {
    const status = r.event_status_name || 'Unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  const statusSummary: StatusSummary[] = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  // Site Profile Crosstab
  const siteCounts: Record<string, { requestApproval: number; submitted: number }> = {};
  records.forEach(r => {
    const site = r.site_profile_name_tp || 'Unknown';
    if (!siteCounts[site]) {
      siteCounts[site] = { requestApproval: 0, submitted: 0 };
    }
    if (r.event_status_name === 'Request Approval') {
      siteCounts[site].requestApproval++;
    } else if (r.event_status_name === 'Submitted') {
      siteCounts[site].submitted++;
    }
  });
  const siteCrosstab: CrosstabRow[] = Object.entries(siteCounts)
    .map(([name, counts]) => ({ name, ...counts }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Program Name Crosstab
  const ssoCounts: Record<string, { requestApproval: number; submitted: number }> = {};
  records.forEach(r => {
    const sso = r.sso_name || 'Unknown';
    if (!ssoCounts[sso]) {
      ssoCounts[sso] = { requestApproval: 0, submitted: 0 };
    }
    if (r.event_status_name === 'Request Approval') {
      ssoCounts[sso].requestApproval++;
    } else if (r.event_status_name === 'Submitted') {
      ssoCounts[sso].submitted++;
    }
  });
  const ssoCrosstab: CrosstabRow[] = Object.entries(ssoCounts)
    .map(([name, counts]) => ({ name, ...counts }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Totals
  const siteTotals = siteCrosstab.reduce(
    (acc, row) => ({
      requestApproval: acc.requestApproval + row.requestApproval,
      submitted: acc.submitted + row.submitted,
    }),
    { requestApproval: 0, submitted: 0 }
  );

  const ssoTotals = ssoCrosstab.reduce(
    (acc, row) => ({
      requestApproval: acc.requestApproval + row.requestApproval,
      submitted: acc.submitted + row.submitted,
    }),
    { requestApproval: 0, submitted: 0 }
  );

  return {
    generatedAt: myt,
    statusSummary,
    siteCrosstab,
    ssoCrosstab,
    totals: {
      site: siteTotals,
      sso: ssoTotals,
    },
  };
}

export function useApprovalData() {
  const [data, setData] = useState<ApprovalData>(() => generateDemoData());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealData, setIsRealData] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(DATA_URL, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const text = await response.text();
      const workbook = XLSX.read(text, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ApprovalRecord[];

      if (jsonData.length > 0) {
        const processedData = processCSVData(jsonData);
        setData(processedData);
        setIsRealData(true);
      }
    } catch (err) {
      console.log('Using demo data:', err);
      // Keep demo data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isRealData,
    refetch: fetchData,
  };
}
