import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import localDb from '@/lib/localDb';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = localDb.users.login(email, password);
      
      if (result.error) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      window.location.href = '/admin';
    } catch (err) {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sidebar-primary/20 border border-sidebar-primary/30 mb-4">
            <Shield className="w-8 h-8 text-sidebar-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Field Forecast</h1>
          <p className="text-slate-400">Admin Dashboard Login</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="text-slate-300">Email</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fieldforecast.com"
                  required
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
                  placeholder="Enter your password"
                  required
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
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-slate-500 text-sm hover:text-slate-300 transition-colors">
            Back to website
          </Link>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Unauthorized access is prohibited. All activities are logged.
        </p>
      </div>
    </div>
  );
}
