import { Link, useNavigate } from 'react-router-dom';
import { useSSOData } from '@/hooks/useSSOData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  ArrowLeft, 
  RefreshCw,
  UserCheck,
  FileText,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import {
  StateDistributionChart,
  MembershipStatusChart,
  MonthlyTrendChart,
  TopNadiChart,
  QuarterlyChart,
  OrganizationTypeChart,
} from '@/components/membership/MembershipCharts';
import { CrosstabTable } from '@/components/membership/CrosstabTable';
import { ParticipationTable } from '@/components/membership/MembershipTables';
import { MembershipFilterPanel } from '@/components/membership/MembershipFilterPanel';
import { SSODropdown } from '@/components/membership/SSODropdown';

export default function SSODashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const {
    ssoFilteredData,
    filteredData,
    isLoading,
    error,
    currentSSO,
    filters,
    filterOptions,
    kpis,
    programReport,
    availableSSOSources,
    lastRefresh,
    updateFilter,
    resetFilters,
    refreshData,
  } = useSSOData();

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'sso' && value !== 'All' && value !== ''
  ).length;

  const displayData = filteredData.length > 0 ? filteredData : ssoFilteredData;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSSOSelect = (sso: string) => {
    if (sso) {
      navigate(`/sso-dashboard?source=${encodeURIComponent(sso)}`);
    } else {
      navigate('/sso-dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={refreshData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpiCards = [
    { 
      label: 'Total Participants', 
      value: kpis.totalParticipants, 
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/5',
    },
    { 
      label: 'Unique Members', 
      value: kpis.uniqueMembers, 
      icon: UserCheck,
      color: 'text-accent',
      bgColor: 'bg-accent/5',
    },
    { 
      label: 'Total Events', 
      value: kpis.totalEvents, 
      icon: Calendar,
      color: 'text-success',
      bgColor: 'bg-success/5',
    },
    { 
      label: 'NADI Sites', 
      value: kpis.totalNadi, 
      icon: MapPin,
      color: 'text-warning',
      bgColor: 'bg-warning/5',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-border shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Navigation & Title */}
            <div className="flex items-center gap-4">
              <Link 
                to="/membership" 
                className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-bold text-foreground">
                    SSO Analytics
                  </h1>
                  {currentSSO && (
                    <Badge className="bg-primary text-primary-foreground">
                      {currentSSO}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Detailed program analytics</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {activeFilterCount} filters
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* SSO Dropdown Selector */}
        <Card className="gov-card border-l-4 border-l-accent">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium text-foreground">Select Program:</span>
              <SSODropdown
                availableSSOSources={availableSSOSources}
                currentSSO={currentSSO}
                onSelect={handleSSOSelect}
              />
            </div>
          </CardContent>
        </Card>

        {/* Filter Panel */}
        <MembershipFilterPanel
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={updateFilter}
          onReset={resetFilters}
          activeCount={activeFilterCount}
          showSSO={false}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, index) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className={`kpi-card ${kpi.bgColor} border border-border/50`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        {kpi.label}
                      </p>
                      <p className={`text-3xl font-bold number-display ${kpi.color}`}>
                        {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                      <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="gov-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Member Rate</p>
                <p className="text-2xl font-bold text-success number-display">{kpis.memberRate.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gov-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-info/10">
                <Users className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg per Event</p>
                <p className="text-2xl font-bold text-info number-display">{kpis.avgParticipantsPerEvent.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="gov-card">
            <CardHeader className="gov-card-header">
              <CardTitle className="gov-card-title">Membership Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <MembershipStatusChart data={displayData} />
            </CardContent>
          </Card>
          <Card className="gov-card">
            <CardHeader className="gov-card-header">
              <CardTitle className="gov-card-title">Organization Type</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <OrganizationTypeChart data={displayData} />
            </CardContent>
          </Card>
          <Card className="gov-card">
            <CardHeader className="gov-card-header">
              <CardTitle className="gov-card-title">Quarterly Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <QuarterlyChart data={displayData} />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="gov-card">
            <CardHeader className="gov-card-header">
              <CardTitle className="gov-card-title">Distribution by State</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <StateDistributionChart data={displayData} />
            </CardContent>
          </Card>
          <Card className="gov-card">
            <CardHeader className="gov-card-header">
              <CardTitle className="gov-card-title">Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <MonthlyTrendChart data={displayData} />
            </CardContent>
          </Card>
        </div>

        {/* Top NADI */}
        <Card className="gov-card">
          <CardHeader className="gov-card-header">
            <CardTitle className="gov-card-title">Top NADI Sites</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <TopNadiChart data={displayData} />
          </CardContent>
        </Card>

        {/* Program Report */}
        <Card className="gov-card">
          <CardHeader className="gov-card-header">
            <CardTitle className="gov-card-title flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Program Events
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[400px]">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Program Name</th>
                    <th>Event Date</th>
                    <th className="text-right">Participants</th>
                  </tr>
                </thead>
                <tbody>
                  {programReport.length > 0 ? (
                    programReport.map((row, i) => (
                      <tr key={i}>
                        <td className="font-medium max-w-[300px] truncate">{row.programName}</td>
                        <td>{row.eventDate}</td>
                        <td className="text-right font-semibold number-display">{row.participants.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                        No program data available for this SSO
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>
            <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border bg-muted/30">
              Showing {programReport.length} events
            </div>
          </CardContent>
        </Card>

        {/* Crosstab */}
        <CrosstabTable
          data={displayData}
          rowKey="nadi_name"
          colKey="membership_status"
          title="NADI Sites vs Membership Status"
        />

        {/* Participation Table */}
        <ParticipationTable data={displayData} />

        {/* Footer */}
        <div className="text-center py-4 text-xs text-muted-foreground">
          Last updated: {lastRefresh.toLocaleString()} • SSO: {currentSSO || 'All Programs'}
        </div>
      </main>
    </div>
  );
}
