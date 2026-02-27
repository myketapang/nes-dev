import { useCallback } from 'react';
import { useMaintenanceData } from '@/hooks/useMaintenanceData';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { exportToExcel, exportToCSV } from '@/utils/exportData';
import { Header } from '@/components/dashboard/Header';
import { KpiSection } from '@/components/dashboard/KpiSection';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { FilterPanel } from '@/components/dashboard/FilterPanel';
import { StatusChart, TypeChart, PriorityChart, TimeSeriesChart, PhaseChart } from '@/components/dashboard/Charts';
import { DataTable } from '@/components/dashboard/DataTable';
import { Footer } from '@/components/dashboard/Footer';
import { LoadingState, ErrorState } from '@/components/dashboard/LoadingState';
import { ChartSkeleton, KpiSkeleton, FilterSkeleton } from '@/components/dashboard/Skeletons';
import { toast } from '@/hooks/use-toast';
import { FilterKey } from '@/types/maintenance';

const Index = () => {
  const {
    filteredData,
    allData,
    isLoading,
    error,
    filters,
    dateFilter,
    filterOptions,
    latestDataDate,
    activeFilterCount,
    toggleFilter,
    setFilterValues,
    setDateFilter,
    setQuickDateFilter,
    resetFilters,
  } = useMaintenanceData();

  useUrlFilters(filters, dateFilter, setFilterValues, setDateFilter);

  const handleDownloadExcel = useCallback(() => {
    if (filteredData.length === 0) {
      toast({
        title: "No data to export",
        description: "Please adjust your filters to include some records.",
        variant: "destructive",
      });
      return;
    }

    const success = exportToExcel(filteredData);
    if (success) {
      toast({
        title: "Excel export complete",
        description: `Downloaded ${filteredData.length} records as .xlsx`,
      });
    }
  }, [filteredData]);

  const handleDownloadCSV = useCallback(() => {
    if (filteredData.length === 0) {
      toast({
        title: "No data to export",
        description: "Please adjust your filters to include some records.",
        variant: "destructive",
      });
      return;
    }

    const success = exportToCSV(filteredData);
    if (success) {
      toast({
        title: "CSV export complete",
        description: `Downloaded ${filteredData.length} records as .csv`,
      });
    }
  }, [filteredData]);

  const handleReset = useCallback(() => {
    resetFilters();
    toast({
      title: "Filters cleared",
      description: `Showing all ${allData.length} records.`,
    });
  }, [resetFilters, allData.length]);

  const handleChartDrillDown = useCallback((filterKey: string, filterValue: string) => {
    const keyMap: Record<string, FilterKey> = {
      'status': 'status',
      'type': 'type',
      'priority': 'priority',
      'phase': 'phase',
    };
    
    const key = keyMap[filterKey];
    if (key) {
      toggleFilter(key, filterValue);
      toast({
        title: "Filter applied",
        description: `Filtered by ${filterKey}: ${filterValue}`,
      });
    }
  }, [toggleFilter]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const showSkeletons = allData.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <Header
        latestDataDate={latestDataDate}
        onDownloadExcel={handleDownloadExcel}
        onDownloadCSV={handleDownloadCSV}
        totalRecords={allData.length}
        filteredRecords={filteredData.length}
      />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* KPI Section */}
        <div className="border border-border rounded-lg p-4 bg-card">
          {showSkeletons ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
              {[...Array(4)].map((_, i) => <KpiSkeleton key={i} />)}
            </div>
          ) : (
            <KpiSection data={filteredData} />
          )}
        </div>

        {/* Date Range Filter */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <DateRangeFilter
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            onQuickFilter={setQuickDateFilter}
          />
        </div>

        {/* Filter Panel */}
        <div className="border border-border rounded-lg p-4 bg-card">
          {showSkeletons ? (
            <FilterSkeleton />
          ) : (
            <FilterPanel
              filters={filters}
              filterOptions={filterOptions}
              onToggleFilter={toggleFilter}
              onSetFilterValues={setFilterValues}
              activeCount={activeFilterCount}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Charts Section */}
        {showSkeletons ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-border rounded-lg p-4 bg-card">
                <ChartSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* First Row of Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="border border-border rounded-lg p-4 bg-card">
                <StatusChart data={filteredData} onDrillDown={handleChartDrillDown} />
              </div>
              <div className="border border-border rounded-lg p-4 bg-card">
                <PriorityChart data={filteredData} onDrillDown={handleChartDrillDown} />
              </div>
            </div>
            
            {/* Second Row of Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="border border-border rounded-lg p-4 bg-card">
                <TimeSeriesChart data={filteredData} />
              </div>
              <div className="border border-border rounded-lg p-4 bg-card">
                <TypeChart data={filteredData} onDrillDown={handleChartDrillDown} />
              </div>
            </div>
            
            {/* Full Width Chart */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <PhaseChart data={filteredData} onDrillDown={handleChartDrillDown} />
            </div>
          </>
        )}

        {/* Data Table */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <DataTable data={filteredData} />
        </div>
      </main>

      
    </div>
  );
};

export default Index;