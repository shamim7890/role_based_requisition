// @/app/dashboard/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  ArrowRight,
  Bell,
  Activity
} from 'lucide-react';

interface RoleBasedLinks {
  [key: string]: { title: string; href: string; description: string }[];
}

export const metadata = {
  title: 'Dashboard - Requisition Management',
  description: 'Your personalized dashboard overview.',
};

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();
  if (!user) {
    redirect('/sign-in');
  }

  const role = sessionClaims?.metadata?.role as string || 'unknown';

  // Build user name
  let userName = 'User';
  if (user.firstName) {
    userName = user.firstName;
  } else if (user.emailAddresses?.[0]?.emailAddress) {
    userName = user.emailAddresses[0].emailAddress.split('@')[0];
  }

  // Role-based navigation links
  const roleBasedLinks: RoleBasedLinks = {
    analyst: [
      { 
        title: 'Create Requisition', 
        href: '/requisitions/new',
        description: 'Start a new procurement request'
      },
      { 
        title: 'My Requisitions', 
        href: '/requisitions',
        description: 'View and manage your submissions'
      },
      { 
        title: 'Create Execory', 
        href: '/execories/new',
        description: 'Submit new execory document'
      },
      { 
        title: 'My Execories', 
        href: '/execories',
        description: 'Track your execory submissions'
      },
    ],
    admin: [
      { 
        title: 'Admin Panel', 
        href: '/admin',
        description: 'Manage users and system settings'
      },
      { 
        title: 'Review Approvals', 
        href: '/approvals',
        description: 'Process pending approvals'
      },
      { 
        title: 'All Requisitions', 
        href: '/requisitions',
        description: 'System-wide requisition overview'
      },
      { 
        title: 'All Execories', 
        href: '/execories',
        description: 'Complete execory database'
      },
    ],
    approver: [
      { 
        title: 'Pending Approvals', 
        href: '/approvals',
        description: 'Review items awaiting your approval'
      },
      { 
        title: 'Requisitions', 
        href: '/requisitions',
        description: 'Browse all requisitions'
      },
      { 
        title: 'Execories', 
        href: '/execories',
        description: 'Browse all execories'
      },
    ],
  };

  const links = roleBasedLinks[role] || roleBasedLinks.analyst;
  const isApprover = ['technical_manager_c', 'technical_manager_m', 'senior_assistant_director', 'quality_assurance_manager'].includes(role);

  // Mock data - replace with real data from your database
  const stats = {
    pending: role === 'analyst' ? 5 : 12,
    active: role === 'analyst' ? 8 : 28,
    completed: role === 'analyst' ? 45 : 156,
    urgent: 3,
  };

  const recentActivity = [
    {
      id: 1,
      type: 'requisition',
      title: 'Office Supplies Request',
      status: 'pending',
      timestamp: '2 hours ago',
    },
    {
      id: 2,
      type: 'execory',
      title: 'Q4 Budget Approval',
      status: 'approved',
      timestamp: '5 hours ago',
    },
    {
      id: 3,
      type: 'requisition',
      title: 'IT Equipment Purchase',
      status: 'in_review',
      timestamp: '1 day ago',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {userName}!
              </h1>
              <p className="text-gray-400 text-lg">
                Here&apos;s what&apos;s happening with your workflow today
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                role === 'admin' ? 'bg-green-600 text-green-100' :
                isApprover ? 'bg-blue-600 text-blue-100' :
                role === 'analyst' ? 'bg-purple-600 text-purple-100' : 'bg-gray-600 text-gray-100'
              }`}>
                {role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur hover:bg-gray-800/70 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Pending</p>
                  <p className="text-3xl font-bold text-white">{stats.pending}</p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur hover:bg-gray-800/70 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-white">{stats.active}</p>
                  <p className="text-xs text-gray-500 mt-1">Active items</p>
                </div>
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur hover:bg-gray-800/70 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Completed</p>
                  <p className="text-3xl font-bold text-white">{stats.completed}</p>
                  <p className="text-xs text-gray-500 mt-1">This month</p>
                </div>
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur hover:bg-gray-800/70 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Urgent</p>
                  <p className="text-3xl font-bold text-white">{stats.urgent}</p>
                  <p className="text-xs text-gray-500 mt-1">Requires attention</p>
                </div>
                <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur h-full">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Quick Actions</CardTitle>
                <CardDescription className="text-gray-400">
                  Jump to your most used features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {links.map((link, index) => (
                    <Link key={index} href={link.href}>
                      <div className="group p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-all cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {link.title}
                          </h3>
                          <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-sm text-gray-400">{link.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity - Takes 1 column */}
          <div>
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur h-full">
              <CardHeader>
                <CardTitle className="text-xl text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Your latest updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'approved' ? 'bg-green-500' :
                        activity.status === 'pending' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {activity.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            activity.status === 'approved' ? 'bg-green-600/20 text-green-400' :
                            activity.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                            'bg-blue-600/20 text-blue-400'
                          }`}>
                            {activity.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">{activity.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button asChild variant="ghost" className="w-full mt-4 text-gray-400 hover:text-white">
                  <Link href="/activity">
                    View All Activity <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Role-Specific Information */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-white">Your Access & Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            {role === 'admin' && (
              <div className="flex items-start gap-4 p-5 bg-green-900/20 border border-green-700/50 rounded-lg">
                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-400 mb-1">Administrator</h3>
                  <p className="text-gray-300 text-sm">
                    You have full system access including user management, approval overrides, analytics, and configuration settings.
                  </p>
                </div>
              </div>
            )}
            {isApprover && (
              <div className="flex items-start gap-4 p-5 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-400 mb-1">Approver</h3>
                  <p className="text-gray-300 text-sm">
                    You can review, approve, or reject requisitions and execories within your authority. Items requiring your approval appear in your queue.
                  </p>
                </div>
              </div>
            )}
            {role === 'analyst' && (
              <div className="flex items-start gap-4 p-5 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-400 mb-1">Analyst</h3>
                  <p className="text-gray-300 text-sm">
                    You can create, edit, and track requisitions and execories. Your submissions are automatically routed through the approval workflow.
                  </p>
                </div>
              </div>
            )}
            {role === 'unknown' && (
              <div className="flex items-start gap-4 p-5 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-1">Role Assignment Required</h3>
                  <p className="text-gray-300 text-sm">
                    Your account role hasn&apos;t been configured yet. Please contact your system administrator to assign appropriate permissions.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}