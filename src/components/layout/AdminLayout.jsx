import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Trophy, Calendar, FileText, Search, Users, Mail, CreditCard, Settings, ChevronLeft, Shield, Newspaper, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import useCurrentUser from '../../hooks/useCurrentUser';
import { useEffect } from 'react';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/odds', label: 'Odds', icon: Trophy },
  { to: '/admin/matches', label: 'Matches', icon: Calendar },
  { to: '/admin/content', label: 'Pages & CMS', icon: FileText },
  { to: '/admin/homepage', label: 'Homepage', icon: Home },
  { to: '/admin/seo', label: 'SEO', icon: Search },
  { to: '/admin/blog', label: 'Blog', icon: Newspaper },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/plans', label: 'Plans', icon: CreditCard },
  { to: '/admin/contacts', label: 'Messages', icon: Mail },
  { to: '/admin/sports', label: 'Sports/Leagues', icon: Settings },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAdmin, loading } = useCurrentUser();

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/');
  }, [loading, isAdmin, navigate]);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-sidebar">
      <div className="w-8 h-8 border-4 border-sidebar-border border-t-sidebar-primary rounded-full animate-spin" />
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-sidebar text-sidebar-foreground">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-sidebar-border">
        <div className="p-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold">Alpha Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {adminLinks.map(link => {
            const Icon = link.icon;
            const active = link.end ? pathname === link.to : pathname.startsWith(link.to) && pathname !== '/admin';
            const isExactAdmin = link.to === '/admin' && pathname === '/admin';
            const isActive = link.end ? isExactAdmin : active;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border px-4 h-14 flex items-center justify-between">
        <span className="font-heading text-sm font-bold">Alpha Admin</span>
        <Link to="/" className="text-xs text-sidebar-foreground/60">Back to site</Link>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border flex overflow-x-auto">
        {adminLinks.slice(0, 6).map(link => {
          const Icon = link.icon;
          const active = link.end ? pathname === link.to : pathname.startsWith(link.to) && pathname !== '/admin';
          const isExactAdmin = link.to === '/admin' && pathname === '/admin';
          const isActive = link.end ? isExactAdmin : active;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2 text-[10px] min-w-0',
                isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0 mt-14 lg:mt-0 mb-16 lg:mb-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}