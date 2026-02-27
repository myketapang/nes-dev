import { useMemo, useCallback, useState } from 'react';
import { Footer } from '@/components/dashboard/Footer';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  BarChart3, 
  FileSpreadsheet, 
  FileText,
  Moon,
  Sun,
  Building2,
  Users,
  ClipboardList,
  Calendar,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  UserCheck,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApprovalData } from '@/hooks/useApprovalData';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { CrosstabRow, StatusSummary } from '@/types/approval';

// Modern chart color palette
const CHART_COLORS = {
  primary: [
    'hsl(217, 91%, 60%)',  // Blue
    'hsl(142, 76%, 36%)',  // Green
    'hsl(38, 92%, 50%)',   // Amber
    'hsl(0, 84%, 60%)',    // Red
    'hsl(280, 65%, 60%)',  // Purple
    'hsl(172, 66%, 50%)',  // Teal
  ],
  gradients: {
    requestApproval: 'url(#requestApprovalGradient)',
    submitted: 'url(#submittedGradient)',
  }
};

// Custom gradient definitions
const GradientDefs = () => (
  <defs>
    <linearGradient id="requestApprovalGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="hsl(217, 91%, 65%)" />
      <stop offset="100%" stopColor="hsl(217, 91%, 50%)" />
    </linearGradient>
    <linearGradient id="submittedGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="hsl(142, 76%, 45%)" />
      <stop offset="100%" stopColor="hsl(142, 76%, 30%)" />
    </linearGradient>
    <linearGradient id="ssoBarGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
      <stop offset="100%" stopColor="hsl(217, 91%, 45%)" />
    </linearGradient>
    <linearGradient id="ssoSubmittedGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="hsl(142, 76%, 45%)" />
      <stop offset="100%" stopColor="hsl(142, 76%, 30%)" />
    </linearGradient>
    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.8} />
      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="statusGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
      <stop offset="100%" stopColor="hsl(217, 91%, 40%)" />
    </linearGradient>
  </defs>
);

// Enhanced custom tooltip with proper z-index
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 rounded-lg p-4 shadow-2xl backdrop-blur-sm z-[100] relative">
        <p className="font-semibold text-sm text-foreground mb-3 border-b pb-2">
          {label || payload[0].payload?.fullName || payload[0].name}
        </p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            const total = entry.payload?.requestApproval + entry.payload?.submitted;
            const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
            
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground">
                    {entry.value.toLocaleString()}
                  </span>
                  {/* <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
                    {percentage}%
                  </span> */}
                </div>
              </div>
            );
          })}
        </div>
        {payload[0]?.payload?.efficiency && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Efficiency</span>
              <span className="text-sm font-bold text-purple-600">
                {payload[0].payload.efficiency.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Sorting types
type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

type SortableStatusSummary = StatusSummary & { id: number };
type SortableCrosstabRow = CrosstabRow & { id: number, efficiency?: number };

const ApprovalAnalysis = () => {
  const { data, isLoading, isRealData, refetch } = useApprovalData();
  const [isDark, setIsDark] = useState(false);
  const [statusSortConfig, setStatusSortConfig] = useState<SortConfig>({ key: 'status', direction: 'asc' });
  const [siteSortConfig, setSiteSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [ssoSortConfig, setSsoSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  // Sorting functions - FIXED TYPE ERROR
  const sortStatusData = (data: StatusSummary[]): SortableStatusSummary[] => {
    const sortableData = data.map((item, index) => ({ ...item, id: index }));
    
    return sortableData.sort((a, b) => {
      if (statusSortConfig.key === 'status') {
        return statusSortConfig.direction === 'asc' 
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      } else if (statusSortConfig.key === 'count') {
        return statusSortConfig.direction === 'asc' 
          ? a.count - b.count
          : b.count - a.count;
      }
      return 0;
    });
  };

  const sortCrosstabData = (data: CrosstabRow[], sortConfig: SortConfig): SortableCrosstabRow[] => {
    const sortableData = data.map((item, index) => ({ 
      ...item, 
      id: index,
      efficiency: item.submitted > 0 ? (item.submitted / (item.requestApproval + item.submitted)) * 100 : 0
    }));
    
    return sortableData.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      if (sortConfig.key === 'name') {
        aValue = a.name;
        bValue = b.name;
      } else if (sortConfig.key === 'requestApproval') {
        aValue = a.requestApproval;
        bValue = b.requestApproval;
      } else if (sortConfig.key === 'submitted') {
        aValue = a.submitted;
        bValue = b.submitted;
      } else if (sortConfig.key === 'efficiency') {
        aValue = a.efficiency || 0;
        bValue = b.efficiency || 0;
      } else {
        return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue; // FIXED: Changed b.value to bValue
      }
      
      return 0;
    });
  };

  const handleStatusSort = (key: string) => {
    setStatusSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSiteSort = (key: string) => {
    setSiteSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSsoSort = (key: string) => {
    setSsoSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: string, config: SortConfig) => {
    if (config.key !== key) return null;
    return config.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 ml-1" />
      : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  // Calculate totals
  const totalEvents = useMemo(() => 
    data.statusSummary.reduce((sum, item) => sum + item.count, 0),
    [data.statusSummary]
  );

  // Prepare stacked area data
  const areaChartData = useMemo(() => {
    if (data.siteCrosstab.length === 0) return [];
    
    return data.siteCrosstab.map(site => ({
      name: site.name.length > 15 ? site.name.substring(0, 15) + '...' : site.name,
      requestApproval: site.requestApproval,
      submitted: site.submitted,
      total: site.requestApproval + site.submitted,
    }));
  }, [data.siteCrosstab]);

  // Get sorted data
  const sortedStatusData = useMemo(() => 
    sortStatusData(data.statusSummary),
    [data.statusSummary, statusSortConfig]
  );

  const sortedSiteData = useMemo(() => 
    sortCrosstabData(data.siteCrosstab, siteSortConfig),
    [data.siteCrosstab, siteSortConfig]
  );

  const sortedSsoData = useMemo(() => 
    sortCrosstabData(data.ssoCrosstab, ssoSortConfig),
    [data.ssoCrosstab, ssoSortConfig]
  );

  // Prepare data for beautiful horizontal bar chart - Show ALL SSOs
  const ssoBarChartData = useMemo(() => {
    // Show all SSOs, not just top 10
    const allSsoData = sortedSsoData.map(sso => ({
      ...sso,
      displayName: sso.name.length > 30 ? sso.name.substring(0, 30) + '...' : sso.name,
      fullName: sso.name,
      efficiency: sso.submitted > 0 ? (sso.submitted / (sso.requestApproval + sso.submitted)) * 100 : 0,
    }));
    
    return allSsoData;
  }, [sortedSsoData]);

  // Calculate dynamic chart height based on number of SSOs
  const ssoChartHeight = useMemo(() => {
    const baseHeight = 420;
    const additionalHeight = Math.max(0, (ssoBarChartData.length - 10) * 20);
    return baseHeight + additionalHeight;
  }, [ssoBarChartData.length]);

  // Export functions
  const exportStatusSummary = useCallback((type: 'xlsx' | 'csv') => {
    const ws = XLSX.utils.json_to_sheet(sortedStatusData.map(({ id, ...rest }) => rest));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Status Summary');
    XLSX.writeFile(wb, `status_summary.${type}`);
    toast({ title: 'Export complete', description: `Status summary exported as .${type}` });
  }, [sortedStatusData]);

  const exportSiteCrosstab = useCallback((type: 'xlsx' | 'csv') => {
    const exportData = [
      ...sortedSiteData.map(({ id, ...row }) => ({
        'TP Name': row.name,
        'Pending': row.requestApproval,
        'Request': row.submitted,
        'Total Request': (row.requestApproval || 0) + (row.submitted || 0), 
      })),
      {
        'Program Name': 'Total',
        'Request Approval': data.totals.site.requestApproval,
        'Submitted': data.totals.site.submitted,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Site Crosstab');
    XLSX.writeFile(wb, `site_crosstab.${type}`);
    toast({ title: 'Export complete', description: `Site crosstab exported as .${type}` });
  }, [sortedSiteData, data.totals.site]);

  const exportSSOCrosstab = useCallback((type: 'xlsx' | 'csv') => {
    const exportData = [
      ...sortedSsoData.map(({ id, ...row }) => ({
        'Program Name': row.name,
        'Request Approval': row.requestApproval,
        'Submitted': row.submitted,
        'Efficiency %': row.efficiency?.toFixed(1),
      })),
      {
        'Program Name': 'Total',
        'Request Approval': data.totals.sso.requestApproval,
        'Submitted': data.totals.sso.submitted,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SSO Crosstab');
    XLSX.writeFile(wb, `sso_crosstab.${type}`);
    toast({ title: 'Export complete', description: `SSO crosstab exported as .${type}` });
  }, [sortedSsoData, data.totals.sso]);

  const handleRefresh = useCallback(() => {
    refetch();
    toast({ title: 'Refreshing data...', description: 'Fetching latest data from source.' });
  }, [refetch]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-muted/50">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground tracking-tight">
                  Approval Analysis Dashboard
                </h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <Badge variant="secondary" className="gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {data.generatedAt}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Source: {data.source}
                  </span>
                  {!isRealData && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Demo Data
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-10 w-10 rounded-lg hover:bg-muted/50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="h-10 w-10 rounded-lg hover:bg-muted/50"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-md border-border/50 bg-gradient-to-br from-blue-500/5 to-blue-600/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Events</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalEvents.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-border/50 bg-gradient-to-br from-green-500/5 to-green-600/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Submitted</p>
                  <p className="text-2xl font-bold text-green-600">
                    {data.totals.site.submitted.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-border/50 bg-gradient-to-br from-amber-500/5 to-amber-600/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">In Progress</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {data.statusSummary.find(s => s.status === 'Request Approval')?.count.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-border/50 bg-gradient-to-br from-purple-500/5 to-purple-600/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Completion Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {data.totals.site.submitted > 0 
                      ? `${((data.totals.site.submitted / (data.totals.site.requestApproval + data.totals.site.submitted)) * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 1: Event Status Summary */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-600/10">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Program Status Overview</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Overview of approval request statuses</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportStatusSummary('xlsx')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportStatusSummary('csv')}>
                  <FileText className="w-4 h-4 mr-2" />
                  CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Table */}
              <div className="overflow-auto">
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
                          onClick={() => handleStatusSort('status')}
                        >
                          <div className="flex items-center font-medium">
                            Status
                            {getSortIcon('status', statusSortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50 transition-colors py-3"
                          onClick={() => handleStatusSort('count')}
                        >
                          <div className="flex items-center justify-end font-medium">
                            Count
                            {getSortIcon('count', statusSortConfig)}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        [...Array(4)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        sortedStatusData.map((row) => {
                          const getStatusIcon = () => {
                            switch(row.status.toLowerCase()) {
                              case 'submitted':
                              case 'approved':
                              case 'complete':
                                return <CheckCircle className="w-4 h-4 text-green-600" />;
                              case 'request approval':
                              case 'pending':
                              case 'in progress':
                                return <Clock className="w-4 h-4 text-amber-600" />;
                              case 'rejected':
                              case 'cancelled':
                                return <XCircle className="w-4 h-4 text-red-600" />;
                              default:
                                return <AlertCircle className="w-4 h-4 text-blue-600" />;
                            }
                          };

                          return (
                            <TableRow 
                              key={row.id} 
                              className="hover:bg-muted/30 transition-colors border-b-border/50"
                            >
                              <TableCell className="font-medium py-3">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon()}
                                  {row.status}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold py-3">
                                {row.count.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                    <TableFooter className="bg-muted/20">
                      <TableRow>
                        <TableCell className="font-bold py-3">Total</TableCell>
                        <TableCell className="text-right font-bold text-lg py-3">
                          {totalEvents.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>

              {/* Enhanced Donut Chart with Radial Bars - FIXED TOOLTIP */}
              <div className="h-[320px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart style={{ position: 'relative', zIndex: 10 }}>
                    <GradientDefs />
                    <Pie
                      data={data.statusSummary}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                      label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
                      labelLine={false}
                    >
                      {data.statusSummary.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS.primary[index % CHART_COLORS.primary.length]}
                          className="hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={<CustomTooltip />} 
                      wrapperStyle={{ zIndex: 100 }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => (
                        <span className="text-sm text-muted-foreground font-medium">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Enhanced center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-center p-4 rounded-full bg-gradient-to-br from-blue-500/5 to-indigo-600/5">
                    <p className="text-3xl font-bold text-foreground bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {totalEvents.toLocaleString()}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground mt-1">Total Events</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Site Profile Crosstab */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-600/10">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Technology Partner (TP)</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Request vs Submitted across TPs</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportSiteCrosstab('xlsx')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportSiteCrosstab('csv')}>
                  <FileText className="w-4 h-4 mr-2" />
                  CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Table */}
              <div className="overflow-auto">
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30 sticky top-0">
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
                          onClick={() => handleSiteSort('name')}
                        >
                          <div className="flex items-center font-medium">
                            Technology Partner (TP)
                            {getSortIcon('name', siteSortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50 transition-colors py-3"
                          onClick={() => handleSiteSort('requestApproval')}
                        >
                          <div className="flex items-center justify-end font-medium">
                            Pending
                            {getSortIcon('requestApproval', siteSortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50 transition-colors py-3"
                          onClick={() => handleSiteSort('submitted')}
                        >
                          <div className="flex items-center justify-end font-medium">
                            Submitted
                            {getSortIcon('submitted', siteSortConfig)}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        [...Array(5)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        sortedSiteData.map((row) => (
                          <TableRow 
                            key={row.id} 
                            className="hover:bg-muted/30 transition-colors border-b-border/50"
                          >
                            <TableCell className="font-medium py-3">{row.name}</TableCell>
                            <TableCell className="text-right font-semibold py-3">
                              <span className="text-blue-600">{row.requestApproval.toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="text-right font-semibold py-3">
                              <span className="text-green-600">{row.submitted.toLocaleString()}</span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter className="bg-muted/20">
                      <TableRow>
                        <TableCell className="font-bold py-3">Total</TableCell>
                        <TableCell className="text-right font-bold text-blue-600 py-3">
                          {data.totals.site.requestApproval.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600 py-3">
                          {data.totals.site.submitted.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>

              {/* Enhanced Composed Chart */}
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={sortedSiteData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <GradientDefs />
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--border))" 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                      interval={0}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      label={{ 
                        value: 'Count', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fill: 'hsl(var(--muted-foreground))' }
                      }}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      wrapperStyle={{ zIndex: 100 }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      formatter={(value) => (
                        <span className="text-sm font-medium text-muted-foreground">{value}</span>
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="submitted"
                      fill="url(#areaGradient)"
                      stroke="hsl(142, 76%, 36%)"
                      strokeWidth={2}
                      name="Submitted"
                      fillOpacity={0.6}
                    />
                    <Bar
                      dataKey="requestApproval"
                      name="Requests"
                      fill="hsl(217, 91%, 60%)"
                      radius={4}
                      barSize={40}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: SSO Performance Metrics */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-600/10">
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Program Performance Analysis</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Showing all {sortedSsoData.length} Programs • Individual approval efficiency metrics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportSSOCrosstab('xlsx')}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportSSOCrosstab('csv')}>
                    <FileText className="w-4 h-4 mr-2" />
                    CSV (.csv)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Table */}
              <div className="overflow-auto">
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30 sticky top-0">
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
                          onClick={() => handleSsoSort('name')}
                        >
                          <div className="flex items-center font-medium">
                            Company Name
                            {getSortIcon('name', ssoSortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50 transition-colors py-3"
                          onClick={() => handleSsoSort('requestApproval')}
                        >
                          <div className="flex items-center justify-end font-medium">
                            Requests
                            {getSortIcon('requestApproval', ssoSortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50 transition-colors py-3"
                          onClick={() => handleSsoSort('submitted')}
                        >
                          <div className="flex items-center justify-end font-medium">
                            Submitted
                            {getSortIcon('submitted', ssoSortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50 transition-colors py-3"
                          onClick={() => handleSsoSort('efficiency')}
                        >
                          <div className="flex items-center justify-end font-medium">
                            Efficiency
                            {getSortIcon('efficiency', ssoSortConfig)}
                            <Target className="w-3 h-3 ml-1" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        [...Array(6)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        sortedSsoData.map((row) => {
                          const efficiency = row.efficiency || 0;
                          let efficiencyColor = "text-green-600";
                          if (efficiency < 50) efficiencyColor = "text-red-600";
                          else if (efficiency < 75) efficiencyColor = "text-amber-600";
                          
                          return (
                            <TableRow 
                              key={row.id} 
                              className="hover:bg-muted/30 transition-colors border-b-border/50"
                            >
                              <TableCell className="font-medium py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                  {row.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold py-3">
                                <span className="text-blue-600">{row.requestApproval.toLocaleString()}</span>
                              </TableCell>
                              <TableCell className="text-right font-semibold py-3">
                                <span className="text-green-600">{row.submitted.toLocaleString()}</span>
                              </TableCell>
                              <TableCell className="text-right font-semibold py-3">
                                <span className={`${efficiencyColor} flex items-center justify-end gap-1`}>
                                  {efficiency.toFixed(1)}%
                                  {efficiency >= 75 && <TrendingUp className="w-3 h-3" />}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                    <TableFooter className="bg-muted/20">
                      <TableRow>
                        <TableCell className="font-bold py-3">Total</TableCell>
                        <TableCell className="text-right font-bold text-blue-600 py-3">
                          {data.totals.sso.requestApproval.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600 py-3">
                          {data.totals.sso.submitted.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-purple-600 py-3">
                          {data.totals.sso.submitted > 0 
                            ? `${((data.totals.sso.submitted / (data.totals.sso.requestApproval + data.totals.sso.submitted)) * 100).toFixed(1)}%`
                            : '0%'}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>

              {/* Beautiful Horizontal Bar Chart - Shows ALL SSOs - FIXED */}
              <div style={{ height: `${ssoChartHeight}px` }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">Approval Performance</h3>
                    <p className="text-xs text-muted-foreground">
                      Requests vs Submitted by SSO • {ssoBarChartData.length} SSOs
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-blue-600"></div>
                      <span className="text-xs text-muted-foreground">Requests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-gradient-to-r from-green-500 to-green-600"></div>
                      <span className="text-xs text-muted-foreground">Submitted</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart
                    data={ssoBarChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 140, bottom: 10 }}
                  >
                    <GradientDefs />
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--border))" 
                      horizontal={false}
                    />
                    <XAxis 
                      type="number" 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="displayName"
                      width={135}
                      tick={{ 
                        fontSize: 11, 
                        fill: 'hsl(var(--foreground))',
                        fontWeight: 500 
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      wrapperStyle={{ zIndex: 100 }}
                    />
                    <Bar 
                      dataKey="requestApproval" 
                      name="Request Approval"
                      fill="hsl(217, 91%, 60%)"
                      radius={4}
                      barSize={20}
                    />
                    <Bar 
                      dataKey="submitted" 
                      name="Submitted"
                      fill="hsl(142, 76%, 36%)"
                      radius={4}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Performance Summary */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Top Performer</p>
                      <p className="text-sm font-semibold text-foreground truncate" title={ssoBarChartData.length > 0 
                        ? ssoBarChartData.reduce((max, sso) => 
                            sso.efficiency > (max.efficiency || 0) ? sso : max
                          ).name
                        : 'N/A'}>
                        {ssoBarChartData.length > 0 
                          ? ssoBarChartData.reduce((max, sso) => 
                              sso.efficiency > (max.efficiency || 0) ? sso : max
                            ).displayName
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Avg Efficiency</p>
                      <p className="text-sm font-semibold text-green-600">
                        {ssoBarChartData.length > 0 
                          ? `${(ssoBarChartData.reduce((sum, sso) => sum + (sso.efficiency || 0), 0) / ssoBarChartData.length).toFixed(1)}%`
                          : '0%'}
                      </p>
                    </div>
                    {/* <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Volume</p>
                      <p className="text-sm font-semibold text-blue-600">
                        {(data.totals.sso.requestApproval + data.totals.sso.submitted).toLocaleString()}
                      </p>
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      
    </div>
  );
};

export default ApprovalAnalysis;