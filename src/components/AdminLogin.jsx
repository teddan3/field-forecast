import { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DEV_USERS = [
  { id: 'dev-admin-001', email: 'admin@fieldforecast.dev', password: 'admin123', name: 'Admin User', role: 'admin', membership_type: 'premium' },
  { id: 'dev-editor-001', email: 'editor@fieldforecast.dev', password: 'editor123', name: 'Editor User', role: 'editor', membership_type: 'free' },
  { id: 'dev-odds-001', email: 'odds@fieldforecast.dev', password: 'odds123', name: 'Odds Manager', role: 'odds_manager', membership_type: 'free' },
  { id: 'dev-seo-001', email: 'seo@fieldforecast.dev', password: 'seo123', name: 'SEO Manager', role: 'seo_manager', membership_type: 'free' },
  { id: 'dev-user-001', email: 'user@fieldforecast.dev', password: 'user123', name: 'Regular User', role: 'user', membership_type: 'free' },
];

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const user = DEV_USERS.find(u => u.email === email && u.password === password);
    
    if (user) {
      localStorage.setItem('dev_user', JSON.stringify(user));
      toast.success(`Logged in as ${user.name} (${user.role})`);
      window.location.reload();
    } else {
      toast.error('Invalid credentials');
      setLoading(false);
    }
  };

  const quickLogin = (user) => {
    localStorage.setItem('dev_user', JSON.stringify(user));
    toast.success(`Logged in as ${user.name} (${user.role})`);
    window.location.reload();
  };

  const roleColors = {
    admin: 'bg-red-500/10 text-red-500 border-red-500/20',
    editor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    odds_manager: 'bg-green-500/10 text-green-500 border-green-500/20',
    seo_manager: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    user: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sidebar-primary/20 border border-sidebar-primary/30 mb-4">
            <Shield className="w-8 h-8 text-sidebar-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Field Forecast</h1>
          <p className="text-slate-400">Field Forecast Admin Dashboard</p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
            <Lock className="w-3 h-3" />
            Development Mode
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <Label className="text-slate-300">Email</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fieldforecast.dev"
                  className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-10 pr-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-slate-800/50 text-slate-500">Quick Login</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-2">
            {DEV_USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => quickLogin(user)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border transition-all hover:scale-[1.02]',
                  roleColors[user.role]
                )}
              >
                <div className="text-left">
                  <div className="font-medium text-sm">{user.name}</div>
                  <div className="text-xs opacity-60">{user.email}</div>
                </div>
                <span className="text-xs font-bold uppercase">{user.role}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Development credentials only. Not for production use.
        </p>
      </div>
    </div>
  );
}
