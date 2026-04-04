import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Crown, Shield, ChevronDown, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import localDb from '@/lib/localDb';
import useCurrentUser from '../../hooks/useCurrentUser';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/free-odds', label: 'Free Odds' },
  { to: '/premium-odds', label: 'Premium Odds' },
  { to: '/sports', label: 'Sports' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, isPremium, isVip, isAdmin, logout } = useCurrentUser();

  const handleLogout = () => {
    localDb.users.logout();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight">Field Forecast</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname === link.to
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isVip && (
              <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/10 text-gold text-xs font-semibold">
                <Crown className="w-3 h-3" /> VIP
              </span>
            )}
            {isPremium && !isVip && (
              <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Crown className="w-3 h-3" /> Premium
              </span>
            )}

            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Shield className="w-3.5 h-3.5 mr-1.5" />
                  Admin
                </Button>
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-medium truncate">{user.full_name || user.email}</div>
                    <DropdownMenuSeparator />
                  </>
                )}
                {!isPremium && (
                  <DropdownMenuItem asChild>
                    <Link to="/pricing" className="cursor-pointer">
                      <Crown className="w-4 h-4 mr-2 text-primary" /> Upgrade
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile toggle */}
            <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-card">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 text-sm rounded-md ${
                  pathname === link.to ? 'text-primary bg-primary/5 font-medium' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-muted-foreground">
                Admin Panel
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}