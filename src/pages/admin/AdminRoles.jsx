import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Users, Plus, Edit, Trash2, Check, X, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import moment from 'moment';

const defaultRoles = [
  {
    name: 'Super Admin',
    key: 'super_admin',
    description: 'Full access to all features and settings',
    permissions: ['all'],
    color: 'bg-red-500/10 text-red-500',
    isSystem: true,
  },
  {
    name: 'Admin',
    key: 'admin',
    description: 'Full admin access except system settings',
    permissions: ['dashboard', 'users.view', 'users.edit', 'odds.*', 'matches.*', 'content.*', 'seo.*', 'blog.*', 'plans.*', 'payments.*', 'media.*', 'api.*', 'settings.view', 'reports'],
    color: 'bg-purple-500/10 text-purple-500',
    isSystem: true,
  },
  {
    name: 'Editor',
    key: 'editor',
    description: 'Manage content, blog posts, and SEO',
    permissions: ['dashboard', 'content.*', 'blog.*', 'seo.*', 'homepage.*', 'media.upload'],
    color: 'bg-blue-500/10 text-blue-500',
    isSystem: true,
  },
  {
    name: 'Odds Manager',
    key: 'odds_manager',
    description: 'Manage matches and betting odds',
    permissions: ['dashboard', 'odds.*', 'matches.*', 'sports.*', 'reports.odds'],
    color: 'bg-green-500/10 text-green-500',
    isSystem: true,
  },
  {
    name: 'SEO Manager',
    key: 'seo_manager',
    description: 'Manage SEO settings and analytics',
    permissions: ['dashboard', 'seo.*', 'reports.seo'],
    color: 'bg-yellow-500/10 text-yellow-500',
    isSystem: true,
  },
  {
    name: 'User',
    key: 'user',
    description: 'Standard user with limited access',
    permissions: ['profile', 'odds.view.free'],
    color: 'bg-gray-500/10 text-gray-500',
    isSystem: true,
  },
];

const permissionGroups = [
  {
    label: 'Dashboard',
    permissions: ['dashboard'],
  },
  {
    label: 'Users',
    permissions: ['users.view', 'users.edit', 'users.delete'],
  },
  {
    label: 'Odds',
    permissions: ['odds.view', 'odds.create', 'odds.edit', 'odds.delete'],
  },
  {
    label: 'Matches',
    permissions: ['matches.view', 'matches.create', 'matches.edit', 'matches.delete'],
  },
  {
    label: 'Content',
    permissions: ['content.view', 'content.create', 'content.edit', 'content.delete'],
  },
  {
    label: 'Blog',
    permissions: ['blog.view', 'blog.create', 'blog.edit', 'blog.delete'],
  },
  {
    label: 'SEO',
    permissions: ['seo.view', 'seo.edit'],
  },
  {
    label: 'Media',
    permissions: ['media.view', 'media.upload', 'media.delete'],
  },
  {
    label: 'Payments',
    permissions: ['payments.view', 'payments.refund'],
  },
  {
    label: 'API Settings',
    permissions: ['api.view', 'api.edit'],
  },
  {
    label: 'Settings',
    permissions: ['settings.view', 'settings.edit'],
  },
  {
    label: 'Reports',
    permissions: ['reports', 'reports.odds', 'reports.seo', 'reports.users'],
  },
  {
    label: 'Sports',
    permissions: ['sports.view', 'sports.edit'],
  },
  {
    label: 'Plans',
    permissions: ['plans.view', 'plans.edit'],
  },
  {
    label: 'Messages',
    permissions: ['messages.view', 'messages.reply'],
  },
];

export default function AdminRoles() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [userRoles, setUserRoles] = useState({});

  const load = async () => {
    const u = await base44.entities.User.list('-created_date', 200);
    setUsers(u);
    const rolesMap = {};
    u.forEach(user => {
      rolesMap[user.id] = user.role || 'user';
    });
    setUserRoles(rolesMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await base44.entities.User.update(userId, { role: newRole });
      setUserRoles(prev => ({ ...prev, [userId]: newRole }));
      toast.success('Role updated');
      await load();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const quickUpgrade = async (user, tier) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    await base44.entities.User.update(user.id, {
      membership_type: tier,
      membership_status: 'active',
      membership_expiry_date: expiry.toISOString(),
    });
    toast.success(`${user.full_name || user.email} upgraded to ${tier}`);
    await load();
  };

  const getRoleColor = (role) => {
    const defaultRole = defaultRoles.find(r => r.key === role);
    return defaultRole?.color || 'bg-gray-500/10 text-gray-500';
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
    editors: users.filter(u => u.role === 'editor').length,
    oddsManagers: users.filter(u => u.role === 'odds_manager').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Roles & Permissions</h1>
          <p className="text-sidebar-foreground/50 mt-1">Manage user roles and access control.</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="text-xs text-sidebar-foreground/50 mb-1">Total Users</div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">{stats.total}</div>
        </div>
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="text-xs text-sidebar-foreground/50 mb-1">Admins</div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">{stats.admins}</div>
        </div>
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="text-xs text-sidebar-foreground/50 mb-1">Editors</div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">{stats.editors}</div>
        </div>
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="text-xs text-sidebar-foreground/50 mb-1">Odds Managers</div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">{stats.oddsManagers}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <h2 className="font-heading text-lg font-semibold text-sidebar-foreground mb-4">System Roles</h2>
          <div className="space-y-3">
            {defaultRoles.map(role => (
              <div key={role.key} className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold uppercase', role.color)}>
                    {role.name}
                  </span>
                  {role.isSystem && <Badge variant="outline" className="text-[10px]">System</Badge>}
                </div>
                <p className="text-xs text-sidebar-foreground/50 mb-3">{role.description}</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 5).map(p => (
                    <span key={p} className="text-[10px] px-1.5 py-0.5 bg-sidebar-border rounded text-sidebar-foreground/50">{p}</span>
                  ))}
                  {role.permissions.length > 5 && (
                    <span className="text-[10px] px-1.5 py-0.5 text-sidebar-foreground/50">+{role.permissions.length - 5} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="font-heading text-lg font-semibold text-sidebar-foreground mb-4">Permission Groups</h2>
          <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
            <div className="space-y-4">
              {permissionGroups.map(group => (
                <div key={group.label} className="flex items-center justify-between py-2 border-b border-sidebar-border last:border-0">
                  <span className="text-sm font-medium text-sidebar-foreground">{group.label}</span>
                  <div className="flex gap-2">
                    {group.permissions.map(p => (
                      <span key={p} className="text-[10px] px-2 py-1 bg-sidebar-border/50 rounded text-sidebar-foreground/60 font-mono">{p.split('.').pop()}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold text-sidebar-foreground mb-4">User Role Management</h2>
        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-sidebar-accent animate-pulse rounded-xl" />)}</div>
        ) : (
          <div className="bg-sidebar-accent rounded-xl border border-sidebar-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sidebar-border text-left">
                  <th className="p-3 text-xs font-medium text-sidebar-foreground/50">User</th>
                  <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Current Role</th>
                  <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Membership</th>
                  <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Joined</th>
                  <th className="p-3 text-xs font-medium text-sidebar-foreground/50 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-sidebar-border last:border-0 hover:bg-sidebar-border/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sidebar-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-sidebar-primary">{(user.full_name || user.email || '?')[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-sidebar-foreground">{user.full_name || user.email}</div>
                          <div className="text-xs text-sidebar-foreground/40">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <select
                        value={userRoles[user.id] || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg border border-sidebar-border bg-sidebar-bg text-sidebar-foreground"
                      >
                        {defaultRoles.map(r => (
                          <option key={r.key} value={r.key}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase',
                        user.membership_type === 'vip' ? 'bg-yellow-500/10 text-yellow-400' :
                        user.membership_type === 'premium' ? 'bg-sidebar-primary/10 text-sidebar-primary' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {user.membership_type || 'free'}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-sidebar-foreground/60">{moment(user.created_date).format('MMM D, YYYY')}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        {user.membership_type !== 'premium' && (
                          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => quickUpgrade(user, 'premium')}>
                            Make Premium
                          </Button>
                        )}
                        {user.membership_type !== 'vip' && (
                          <Button size="sm" variant="ghost" className="text-xs h-7 text-yellow-500" onClick={() => quickUpgrade(user, 'vip')}>
                            <Crown className="w-3 h-3 mr-1" /> Make VIP
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
