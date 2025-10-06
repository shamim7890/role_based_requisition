// @/app/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Users, Shield, Zap, FileText, Clock, ArrowRight } from 'lucide-react';

interface RoleBasedLinks {
  [key: string]: { title: string; href: string; icon?: string }[];
}

export const metadata = {
  title: 'Requisition Management System',
  description: 'Streamline your procurement workflow with our intelligent requisition management platform.',
};

export default async function LandingPage() {
  const { userId, sessionClaims } = await auth();
  
  // Check if user is authenticated
  if (!userId) {
    return <PublicLandingPage />;
  }

  const user = await currentUser();
  if (!user) {
    return <PublicLandingPage />;
  }

  const role = sessionClaims?.metadata?.role as string || 'unknown';

  // Build user name
  let userName = 'Unknown User';
  if (user.firstName || user.lastName) {
    userName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  } else if (user.emailAddresses?.[0]?.emailAddress) {
    userName = user.emailAddresses[0].emailAddress;
  }

  // Role-based navigation links
  const roleBasedLinks: RoleBasedLinks = {
    analyst: [
      { title: 'Create Requisition', href: '/requisitions/new' },
      { title: 'View Requisitions', href: '/requisitions' },
      { title: 'Create Execory', href: '/execories/new' },
      { title: 'View Execories', href: '/execories' },
    ],
    admin: [
      { title: 'Admin Panel', href: '/admin' },
      { title: 'Approvals', href: '/approvals' },
      { title: 'All Requisitions', href: '/requisitions' },
      { title: 'All Execories', href: '/execories' },
    ],
    approver: [
      { title: 'Pending Approvals', href: '/approvals' },
      { title: 'View Requisitions', href: '/requisitions' },
      { title: 'View Execories', href: '/execories' },
    ],
  };

  const links = roleBasedLinks[role] || roleBasedLinks.analyst;
  const isApprover = ['technical_manager_c', 'technical_manager_m', 'senior_assistant_director', 'quality_assurance_manager'].includes(role);

  return <AuthenticatedDashboard userName={userName} role={role} links={links} isApprover={isApprover} />;
}

// Public Landing Page Component
function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-500/10 blur-3xl rounded-full" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Streamline Your{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Requisition Workflow
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-10 leading-relaxed">
              Modern procurement management made simple. Track, approve, and manage requisitions with intelligent automation and real-time collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 h-auto">
                <Link href="/sign-up">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 text-lg px-8 py-6 h-auto">
                <Link href="/sign-in">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Everything You Need</h2>
          <p className="text-xl text-gray-400">Powerful features designed for modern procurement teams</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature Cards */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur hover:bg-gray-800/70 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-400" />
              </div>
              <CardTitle className="text-xl text-white">Automated Routing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Requisitions automatically route to the right approvers based on your organizational hierarchy.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur hover:bg-gray-800/70 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle className="text-xl text-white">Real-Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Monitor requisition status in real-time with instant notifications and updates.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur hover:bg-gray-800/70 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <CardTitle className="text-xl text-white">Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Secure permissions system ensures users only see what they need to see.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur hover:bg-gray-800/70 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-yellow-400" />
              </div>
              <CardTitle className="text-xl text-white">Document Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Attach and manage all related documents in one centralized location.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur hover:bg-gray-800/70 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-600/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-pink-400" />
              </div>
              <CardTitle className="text-xl text-white">Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Work together seamlessly with comments, mentions, and shared workflows.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur hover:bg-gray-800/70 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-cyan-400" />
              </div>
              <CardTitle className="text-xl text-white">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Complete visibility into every action with comprehensive audit logs.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join teams already streamlining their procurement process
            </p>
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 h-auto">
              <Link href="/sign-up">
                Create Your Account <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Authenticated Dashboard Component
function AuthenticatedDashboard({ 
  userName, 
  role, 
  links, 
  isApprover 
}: { 
  userName: string; 
  role: string; 
  links: RoleBasedLinks[string]; 
  isApprover: boolean;
}) {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Greeting */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-white mb-3">Welcome back, {userName}!</h1>
          <p className="text-xl text-gray-400">
            Your role: <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
              role === 'admin' ? 'bg-green-600 text-green-100' :
              isApprover ? 'bg-blue-600 text-blue-100' :
              role === 'analyst' ? 'bg-purple-600 text-purple-100' : 'bg-gray-600 text-gray-100'
            }`}>
              {role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
          </p>
        </div>

        {/* Quick Actions Card */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Quick Actions</CardTitle>
            <CardDescription className="text-gray-400">Jump to your most used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {links.map((link, index) => (
                <Button key={index} asChild variant="secondary" className="justify-start h-auto py-4 px-5 bg-gray-700 hover:bg-gray-600 text-left text-base group">
                  <Link href={link.href}>
                    {link.title}
                    <ArrowRight className="ml-auto h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role-Specific Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl">Your Permissions & Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {role === 'admin' && (
              <div className="p-5 bg-green-900/30 border border-green-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-green-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-green-400 mb-2">Admin Access</h3>
                    <p className="text-gray-300">Full system control: Manage users, override approvals, and view all data across the platform.</p>
                  </div>
                </div>
              </div>
            )}
            {isApprover && (
              <div className="p-5 bg-blue-900/30 border border-blue-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-blue-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-400 mb-2">Approver Workflow</h3>
                    <p className="text-gray-300">Review and approve requisitions in sequence. Track pending items in your approvals dashboard.</p>
                  </div>
                </div>
              </div>
            )}
            {role === 'analyst' && (
              <div className="p-5 bg-purple-900/30 border border-purple-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="h-6 w-6 text-purple-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-purple-400 mb-2">Analyst Tools</h3>
                    <p className="text-gray-300">Create and track your requisitions. All requests automatically route for approval based on workflow rules.</p>
                  </div>
                </div>
              </div>
            )}
            {role === 'unknown' && (
              <div className="p-5 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-yellow-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-yellow-400 mb-2">Role Not Set</h3>
                    <p className="text-gray-300">Contact an administrator to assign your role for full access to the platform.</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Link */}
        <div className="mt-8 text-center">
          <Link href="/profile">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}