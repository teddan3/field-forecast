import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, Crown, Shield, ChevronDown, LogOut, User, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/AuthContext';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/all-odds', label: 'All Leagues' },
  { to: '/free-odds', label: 'Free Odds' },
  { to: '/premium-odds', label: 'Premium' },
  { to: '/faq', label: 'FAQ' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading, isPremium, isVip, isAdmin, logout, subscriptionActive } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="public/field_logo.jpeg"
              alt="Field Forecast Logo"
              className="h-10 w-auto max-w-[160px] object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="font-heading text-xl font-bold tracking-tight hidden sm:block">
              Field Forecast
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
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

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {isVip && subscriptionActive && (
                  <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/10 text-gold text-xs font-semibold">
                    <Crown className="w-3 h-3" /> VIP
                  </span>
                )}
                {isPremium && !isVip && subscriptionActive && (
                  <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <Crown className="w-3 h-3" /> Premium
                  </span>
                )}
                {user.is_affiliate && user.role !== 'admin' && (
                  <Link
                    to="/affiliate"
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-semibold"
                  >
                    <Gift className="w-3 h-3" /> Affiliate
                  </Link>
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
                  <DropdownMenuContent align="end" className="w-52">
                    {user && (
                      <>
                        <div className="px-2 py-1.5 text-sm font-medium truncate">
                          {user.name || user.email}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard" className="cursor-pointer">
                            <User className="w-4 h-4 mr-2" /> Dashboard
                          </Link>
                        </DropdownMenuItem>
                        {!subscriptionActive && (
                          <DropdownMenuItem asChild>
                            <Link to="/pricing" className="cursor-pointer">
                              <Crown className="w-4 h-4 mr-2 text-primary" /> Upgrade
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {user.is_affiliate && (
                          <DropdownMenuItem asChild>
                            <Link to="/affiliate" className="cursor-pointer">
                              <Gift className="w-4 h-4 mr-2 text-green-600" /> Affiliate
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="hidden sm:flex">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            <button
              className="lg:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-card">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 text-sm rounded-md ${
                  pathname === link.to
                    ? 'text-primary bg-primary/5 font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm text-muted-foreground"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
            {user && isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm text-muted-foreground"
              >
                Admin Panel
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}