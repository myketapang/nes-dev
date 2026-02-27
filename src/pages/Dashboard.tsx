import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wrench, 
  ClipboardList, 
  ArrowRight,
  BarChart3,
  Activity,
  MapPin,
  Users,
  Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';

const modules = [
  {
    title: 'Nes Analytics V3.0 Dashboard',
    description: 'Comprehensive National Empowerment Scheme analytics with interactive maps and visualizations.',
    href: '/nes-dashboard',
    icon: BarChart3,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
  },
  {
    title: 'Maintenance Analytics',
    description: 'Track and analyze maintenance tickets across all NADI centers.',
    href: '/maintenance-analytics',
    icon: Wrench,
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    textColor: 'text-orange-700 dark:text-orange-300',
  },
  {
    title: 'Approval Analysis',
    description: 'Review approval workflows and status by site and SSO.',
    href: '/approval-analysis',
    icon: ClipboardList,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
  },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Welcome back, <span className="text-primary capitalize">{user || 'User'}</span>!
                </h1>
                <p className="text-muted-foreground">
                  Access your Nes Analytics V3.0 dashboards and insights from the modules below.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-blue-gradient shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Dashboard Modules', value: '3', icon: Activity, color: 'text-primary' },
          { label: 'Active NADIs', value: '1,099+', icon: MapPin, color: 'text-success' },
          { label: 'Participants Tracked', value: '300K+', icon: Users, color: 'text-purple-500' },
          { label: 'Events Analyzed', value: '50K+', icon: Calendar, color: 'text-warning' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="gov-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div> */}

      {/* Modules Grid */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Analytics Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((module, index) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${module.bgColor}`}>
                      <module.icon className={`w-6 h-6 ${module.textColor}`} />
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-4">{module.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col justify-between flex-1">
                  <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                  <Link to={module.href}>
                    <Button 
                      className={`w-full bg-gradient-to-r ${module.color} text-white hover:opacity-90`}
                    >
                      Open Dashboard
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Access to NES */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="gov-card border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Nes Analytics V3.0 Dashboard</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Access comprehensive analytics with interactive maps, demographic insights, and performance metrics.
                </p>
              </div>
              <Link to="/nes-dashboard">
                <Button className="bg-blue-gradient text-white hover:opacity-90 gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Open NES Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div> */}
    </div>
  );
}
