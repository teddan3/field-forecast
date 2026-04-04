import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff, Mail, UserPlus, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import localDb from '@/lib/localDb';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = localDb.users.login(form.email, form.password);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      localDb.activity.log({
        user_id: result.user.id,
        user_name: result.user.full_name || result.user.email,
        action: 'login',
        entity_type: 'User',
        description: `User logged in`,
      });
      toast.success(`Welcome back, ${result.user.full_name || result.user.email}!`);
      window.location.reload();
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    const result = localDb.users.create({
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      role: 'user',
      membership_type: 'free',
      membership_status: 'active',
    });
    
    if (result.error) {
      toast.error(result.error);
    } else {
      localDb.users.login(form.email, form.password);
      localDb.activity.log({
        user_id: result.id,
        user_name: result.full_name,
        action: 'create',
        entity_type: 'User',
        description: `New user registered`,
      });
      toast.success('Account created successfully!');
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </Link>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Field Forecast</h1>
          <p className="text-slate-400">
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg mb-6">
            <button
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                mode === 'login'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                mode === 'signup'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Sign Up
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-slate-300">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter password"
                    className="pl-10 pr-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                    required
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
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label className="text-slate-300">Full Name</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="John Doe"
                    className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="pl-10 pr-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                    required
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
              <div>
                <Label className="text-slate-300">Confirm Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirm_password}
                    onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                    placeholder="Confirm your password"
                    className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          )}

          {mode === 'login' && (
            <p className="text-center text-slate-400 text-sm mt-6">
              Demo credentials: <br />
              <span className="text-slate-300">admin@fieldforecast.com / admin123</span>
            </p>
          )}
        </div>

        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mt-6 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
