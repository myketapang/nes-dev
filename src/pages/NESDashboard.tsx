import { useNESData } from '@/hooks/useNESData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Calendar,
  MapPin,
  TrendingUp,
  RefreshCw,
  UserCheck,
  Target,
  Clock,
  UserPlus,
  Activity,
  Map,
  Filter,
  Download,
  AlertCircle,
  AlertTriangle,
  Info,
  List,
  BookOpen,
  Target as TargetIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { NESFilterPanel } from '@/components/nes/NESFilterPanel';
import { NESMap } from '@/components/nes/NESMap';
import {
  ParticipantOverviewChart,
  StatePerformanceChart,
  ProgramCategoryRadar,
  DemographicsDashboard,
  PerformanceScatterChart,
  TopSSOChart,
  OverviewDashboard,
  ProgramListTable,
} from '@/components/nes/NESCharts';
import type { NESKPIs, GeoPoint, StateMetrics } from '@/types/nes';

// ─── empty defaults (avoids undefined checks everywhere) ──────────────────────
const EMPTY_KPIS: NESKPIs = {
  totalParticipants: 0, uniqueMembers: 0, totalEvents: 0, totalNadi: 0,
  avgAttendanceRate: 0, avgTargetAchievement: 0, totalNewMembers: 0,
  avgParticipantAge: 0, malePercent: 0, femalePercent: 0,
};

export default function NESDashboard() {
  const {
    filteredData,
    isLoading,
    loadingProgress,
    loadingStage,
    error,
    filters,
    filterOptions,
    activeFilterCount,
    lastRefresh,
    updateFilter,
    resetFilters,
    refreshData,
    clearCache,
    dataLoaded,
    recordCount,
    getFilteredCount,
    calculateKPIs,
    getStateMetrics,
    getGeoPoints,
  } = useNESData();

  const [isMapExpanded,       setIsMapExpanded]       = useState(false);
  const [currentKPIs,         setCurrentKPIs]         = useState<NESKPIs>(EMPTY_KPIS);
  const [currentGeoPoints,    setCurrentGeoPoints]    = useState<GeoPoint[]>([]);
  const [currentStateMetrics, setCurrentStateMetrics] = useState<StateMetrics[]>([]);
  const [filteredCount,       setFilteredCount]       = useState(0);
  const [kpisLoading,         setKpisLoading]         = useState(false);

  // Throttle re-fetches so rapid filter changes don't stack up
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!dataLoaded) return;
    setKpisLoading(true);
    try {
      const [count, kpiResults, stateResults, geoResults] = await Promise.all([
        getFilteredCount(),
        calculateKPIs(),
        getStateMetrics(),
        getGeoPoints(500),
      ]);
      setFilteredCount(count);
      setCurrentKPIs(kpiResults);
      setCurrentStateMetrics(stateResults);
      setCurrentGeoPoints(geoResults);
    } catch (err) {
      console.error('loadDashboardData error', err);
    } finally {
      setKpisLoading(false);
    }
  }, [dataLoaded, getFilteredCount, calculateKPIs, getStateMetrics, getGeoPoints]);

  // Debounce dashboard reload on filter changes
  useEffect(() => {
    if (!dataLoaded) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(loadDashboardData, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [dataLoaded, filters, loadDashboardData]);

  // Limit rows sent to chart components to avoid layout jank
  const displayData = filteredData.slice(0, 1000);

  const getLoadingMessage = () => {
    switch (loadingStage) {
      case 'initializing': return 'Initializing database engine…';
      case 'checking':     return 'Checking for cached data…';
      case 'downloading':  return 'Streaming data from S3…';
      case 'loading-db':   return 'Building in-memory database…';
      case 'ready':        return 'Ready';
      default:             return 'Loading dashboard…';
    }
  };

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-6">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div
                className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"
                style={{ animationDuration: '1.5s' }}
              />
              <Activity className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
            </div>
            <p className="text-xl font-semibold text-foreground mb-2">{getLoadingMessage()}</p>
            <p className="text-sm text-muted-foreground">{loadingProgress}% complete</p>
          </div>
          <div className="w-80 max-w-full">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{loadingStage.replace(/-/g, ' ')}</span>
              <span>{loadingProgress}%</span>
            </div>
          </div>
          {loadingStage === 'loading-db' && recordCount > 0 && (
            <p className="text-xs text-muted-foreground text-center max-w-md">
              Loaded {recordCount.toLocaleString()} records…
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Error screen ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="max-w-md w-full border-destructive/20">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-lg font-medium text-foreground">Data Loading Failed</p>
            <p className="text-sm text-muted-foreground font-mono text-left bg-muted p-3 rounded">
              {error}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button onClick={refreshData} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={clearCache} className="gap-2">
                Clear Cache &amp; Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── No data screen ─────────────────────────────────────────────────────────
  if (!dataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">No Data Available</p>
            <p className="text-sm text-muted-foreground">
              Data is being loaded. Please wait…
            </p>
            <Button onClick={refreshData} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Load Data
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Derived flags ──────────────────────────────────────────────────────────
  const hasDemographicsData = displayData.some(
    d => d.age_group || d.time_of_day || d.male_count > 0 || d.female_count > 0,
  );
  const hasMapData   = currentGeoPoints.length > 0;
  const hasChartData = displayData.length > 0;

  const hasProgramListData = () => {
    if (!displayData.length) return false;
    return displayData.some(d => d.category_name || d.program_name);
  };

  const availableYears  = filterOptions.year?.map(y => y.value)  ?? [];
  const availableMonths = filterOptions.month?.map(m => m.value) ?? [];

  // ── KPI card definitions ───────────────────────────────────────────────────
  const primaryKpis = [
    { label:'Total Participants', value: currentKPIs.totalParticipants?.toLocaleString() ?? '0', icon:Users,     color:'text-primary',      bgColor:'bg-primary/10' },
    { label:'Unique Members',     value: currentKPIs.uniqueMembers?.toLocaleString()     ?? '0', icon:UserCheck, color:'text-accent',        bgColor:'bg-accent/10' },
    { label:'Total Events',       value: currentKPIs.totalEvents?.toLocaleString()       ?? '0', icon:Calendar,  color:'text-blue-600',      bgColor:'bg-blue-100 dark:bg-blue-900/20' },
    { label:'NADI Sites',         value: currentKPIs.totalNadi?.toLocaleString()         ?? '0', icon:MapPin,    color:'text-amber-600',     bgColor:'bg-amber-100 dark:bg-amber-900/20' },
    { label:'New Members',        value: Math.round(currentKPIs.totalNewMembers ?? 0).toLocaleString(), icon:UserPlus, color:'text-emerald-600', bgColor:'bg-emerald-100 dark:bg-emerald-900/20' },
  ];

  const performanceKpis = [
    { label:'Attendance Rate',     value:`${currentKPIs.avgAttendanceRate ?? 0}%`,    icon:TrendingUp, color:'text-green-600' },
    { label:'Target Achievement',  value:`${currentKPIs.avgTargetAchievement ?? 0}%`, icon:Target,     color:'text-primary' },
    { label:'Avg Participant Age', value: currentKPIs.avgParticipantAge ? `${currentKPIs.avgParticipantAge} yrs` : 'N/A', icon:Clock, color:'text-purple-600' },
    { label:'Gender Balance',
      value: currentKPIs.malePercent ? `${currentKPIs.malePercent}% M` : 'N/A',
      description: currentKPIs.femalePercent ? `${currentKPIs.femalePercent}% F` : undefined,
      icon:Users, color:'text-pink-600' },
  ];

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            NES Analytics V3.0 Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            National Empowerment Scheme
            {' · '}{recordCount.toLocaleString()} records total
            {' · '}
            {kpisLoading
              ? <span className="animate-pulse">calculating…</span>
              : <>{filteredCount.toLocaleString()} matching</>}
            {' · '}Last updated: {lastRefresh.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2 px-3 py-1">
            <Filter className="w-3 h-3" />
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
          </Badge>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading} className="gap-2 h-9">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-9" onClick={clearCache}>
            <Download className="w-4 h-4" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}>
        <NESFilterPanel
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={updateFilter}
          onReset={resetFilters}
          activeCount={activeFilterCount}
          availableYears={availableYears}
          availableMonths={availableMonths}
        />
      </motion.div>

      {/* Demographic data warning */}
      {!hasDemographicsData && hasChartData && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Limited Demographic Data</p>
              <p className="text-sm text-amber-800 dark:text-amber-400 mt-1">
                Age group, time of day, or gender data is absent in the current filter selection.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {primaryKpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.4, delay: i * 0.05 }}
            whileHover={{ y:-2, transition:{ duration:0.2 } }}
          >
            <Card className={`hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 ${kpisLoading ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
                </div>
                <p className={`text-2xl lg:text-3xl font-bold ${kpi.color}`}>
                  {kpisLoading ? <span className="animate-pulse">…</span> : kpi.value}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Performance KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceKpis.map(kpi => (
          <Card key={kpi.label} className={`border border-border/50 ${kpisLoading ? 'opacity-60' : ''}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-semibold">
                  {kpisLoading ? <span className="animate-pulse">…</span> : kpi.value}
                </p>
                {'description' in kpi && kpi.description && (
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview"     className="gap-2"><Activity className="w-4 h-4" />Overview</TabsTrigger>
          <TabsTrigger value="programs"     className="gap-2"><List    className="w-4 h-4" />Programs</TabsTrigger>
          <TabsTrigger value="geography"    className="gap-2"><Map     className="w-4 h-4" />Geography</TabsTrigger>
          <TabsTrigger value="demographics" className="gap-2"><Users   className="w-4 h-4" />Demographics</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" />Comprehensive Overview</CardTitle>
              <CardDescription>
                {filteredCount.toLocaleString()} records match current filters — displaying first {Math.min(displayData.length, 1000).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasChartData
                ? <OverviewDashboard data={displayData} />
                : <EmptyChart label="No overview data for the current selection." />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Programs */}
        <TabsContent value="programs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" />Program Performance Analysis</CardTitle>
              <CardDescription>Detailed breakdown of programs with participants and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {hasProgramListData()
                ? <ProgramListTable data={displayData} />
                : <EmptyChart icon={<BookOpen className="w-12 h-12 text-muted-foreground" />} label="No program/category data in the current selection." />}
            </CardContent>
          </Card>

          {hasProgramListData() && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TargetIcon className="w-5 h-5" />Program Category Analysis</CardTitle>
                  <CardDescription>Performance across different program categories</CardDescription>
                </CardHeader>
                <CardContent><ProgramCategoryRadar data={displayData} /></CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>Key metrics for program performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        label: 'Total Programs',
                        value: new Set(displayData.map(d => d.category_name || d.program_name).filter(Boolean)).size,
                      },
                      {
                        label: 'Avg Participants / Program',
                        value: Math.round(
                          displayData.length /
                          Math.max(1, new Set(displayData.map(d => d.category_name || d.program_name).filter(Boolean)).size)
                        ),
                      },
                    ].map(item => (
                      <div key={item.label} className="p-4 rounded-lg border">
                        <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                        <p className="text-2xl font-bold">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Geography */}
        <TabsContent value="geography" className="space-y-6">
          <div className={isMapExpanded ? 'fixed inset-0 z-50 bg-background p-4' : ''}>
            <Card className={isMapExpanded ? 'h-full' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Map className="w-5 h-5" />NADI Geographic Distribution
                  </CardTitle>
                  {hasMapData && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                      onClick={() => setIsMapExpanded(v => !v)}>
                      <span className="text-lg">{isMapExpanded ? '−' : '+'}</span>
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {hasMapData
                    ? `Interactive map — ${currentGeoPoints.length} NADI locations`
                    : 'No geographic coordinates in this selection'}
                </CardDescription>
              </CardHeader>
              <CardContent className={isMapExpanded ? 'h-[calc(100vh-180px)]' : 'h-[500px]'}>
                {hasMapData
                  ? (
                    <div className="relative h-full w-full rounded-lg overflow-hidden border">
                      <NESMap geoPoints={currentGeoPoints} stateMetrics={currentStateMetrics} />
                    </div>
                  )
                  : <EmptyChart label="Latitude/longitude data missing for the current selection." />}
              </CardContent>
            </Card>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${isMapExpanded ? 'hidden' : ''}`}>
            <Card>
              <CardHeader>
                <CardTitle>Top SSO Organizations</CardTitle>
                <CardDescription>Performance by SSO implementing partners</CardDescription>
              </CardHeader>
              <CardContent>
                {hasChartData
                  ? <TopSSOChart data={displayData} />
                  : <EmptyChart label="No SSO data available." />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>State Performance Analysis</CardTitle>
                <CardDescription>Top states by participation and achievement</CardDescription>
              </CardHeader>
              <CardContent>
                {hasChartData
                  ? <StatePerformanceChart data={displayData} />
                  : <EmptyChart label="No state performance data available." />}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Demographics */}
        <TabsContent value="demographics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Demographics Dashboard</CardTitle>
              <CardDescription>
                {hasDemographicsData
                  ? 'Age, gender, and time patterns across participants'
                  : 'Demographic data not available in current dataset'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasDemographicsData
                ? <DemographicsDashboard data={displayData} />
                : <EmptyChart icon={<Info className="w-12 h-12 text-muted-foreground" />}
                    label="No demographic data (age group / gender) in the current selection." />}
            </CardContent>
          </Card>

          {/* {hasChartData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Correlation Analysis</CardTitle>
                  <CardDescription>Relationship between attendance and target achievement</CardDescription>
                </CardHeader>
                <CardContent><PerformanceScatterChart data={displayData} /></CardContent>
              </Card>
            </div>
          )} */}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.5, delay:0.5 }}
        className="pt-6 border-t"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary inline-block" />
              Active Filters: {activeFilterCount}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
              Showing {filteredCount.toLocaleString()} of {recordCount.toLocaleString()} records
            </span>
          </div>
          <div className="text-right">
            <p>Last updated: {lastRefresh.toLocaleString()}</p>
            <p className="text-xs">{new Date(lastRefresh).toISOString().split('T')[0]}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── tiny helper component ────────────────────────────────────────────────────
function EmptyChart({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-center p-8 gap-4">
      {icon ?? <AlertTriangle className="w-12 h-12 text-muted-foreground" />}
      <p className="text-sm text-muted-foreground max-w-xs">{label}</p>
    </div>
  );
}
