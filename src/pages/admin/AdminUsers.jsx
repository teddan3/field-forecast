import { useState, useEffect } from 'react';
import localDb from '@/lib/localDb';
import { Plus, Edit, Trash2, Search, Crown, Shield, User, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import moment from 'moment';

const roles = [
  { value: 'admin', label: 'Admin', description: 'Full access to all features' },
  { value: 'editor', label: 'Editor', description: 'Manage content and blog' },
  { value: 'odds_manager', label: 'Odds Manager', description: 'Manage matches and odds' },
  { value: 'seo_manager', label: 'SEO Manager', description: 'Manage SEO settings' },
  { value: 'user', label: 'User', description: 'Standard user access' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'user', membership_type: 'free', membership_status: 'active' });
  const [saving, setSaving] = useState(false);
  const [, forceUpdate] = useState(0);

  const load = () => {
    setUsers(localDb.users.getAll());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.full_name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openCreate = () => { setEditing(null); setForm({ full_name: '', email: '', password: '', role: 'user', membership_type: 'free', membership_status: 'active' }); setOpen(true); };
  const openEdit = (u) => { setEditing(u); setForm({ ...u, password: '' }); setOpen(true); };

  const handleSave = () => {
    setSaving(true);
    try {
      if (editing) {
        const { password, ...updateData } = form;
        localDb.users.update(editing.id, password ? { ...updateData, password } : updateData);
        localDb.activity.log({ user_id: 'admin', user_name: 'Admin', action: 'update', entity_type: 'User', entity_name: form.full_name || form.email, description: `Updated user: ${form.email}` });
        toast.success('User updated');
      } else {
        if (!form.password) {
          toast.error('Password is required for new users');
          setSaving(false);
          return;
        }
        localDb.users.create(form);
        localDb.activity.log({ user_id: 'admin', user_name: 'Admin', action: 'create', entity_type: 'User', entity_name: form.full_name || form.email, description: `Created user: ${form.email}` });
        toast.success('User created');
      }
      setOpen(false);
      load();
      forceUpdate(n => n + 1);
    } catch (err) {
      toast.error('Failed to save user');
    }
    setSaving(false);
  };

  const handleDelete = (user) => {
    if (!confirm(`Delete "${user.full_name || user.email}"? This cannot be undone.`)) return;
    localDb.users.delete(user.id);
    localDb.activity.log({ user_id: 'admin', user_name: 'Admin', action: 'delete', entity_type: 'User', entity_name: user.full_name || user.email, description: `Deleted user: ${user.email}` });
    toast.success('User deleted');
    load();
    forceUpdate(n => n + 1);
  };

  const toggleMembership = (user, type) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    localDb.users.update(user.id, {
      membership_type: type,
      membership_status: 'active',
      membership_expiry_date: expiry.toISOString(),
    });
    toast.success(`${user.full_name || user.email} upgraded to ${type}`);
    localDb.activity.log({ user_id: 'admin', user_name: 'Admin', action: 'update', entity_type: 'User', entity_name: user.full_name || user.email, description: `Changed membership to ${type}` });
    load();
    forceUpdate(n => n + 1);
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    premium: users.filter(u => u.membership_type === 'premium' || u.membership_type === 'vip').length,
    free: users.filter(u => u.membership_type === 'free').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Users</h1>
          <p className="text-sidebar-foreground/50 mt-1">Manage registered users and their memberships.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add User</Button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="text-xs text-sidebar-foreground/50 mb-1">Total Users</div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">{stats.total}</div>
        </div>
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="text-xs text-sidebar-foreground/50 mb-1">Admins</div>
          <div className="font-heading text-xl font-bold text-red-500">{stats.admins}</div>
        </div>
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="text-xs text-sidebar-foreground/50 mb-1">Premium</div>
          <div className="font-heading text-xl font-bold text-sidebar-primary">{stats.premium}</div>
        </div>
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="text-xs text-sidebar-foreground/50 mb-1">Free</div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">{stats.free}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40" />
          <Input placeholder="Search users..." className="pl-9 bg-sidebar-accent border-sidebar-border" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36 bg-sidebar-accent border-sidebar-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-sidebar-accent animate-pulse rounded-xl" />)}</div>
      ) : (
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sidebar-border text-left">
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">User</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Role</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Membership</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Status</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Joined</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-sidebar-border last:border-0 hover:bg-sidebar-border/30">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sidebar-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-sidebar-primary">{(u.full_name || u.email || '?')[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-sidebar-foreground">{u.full_name || 'No name'}</div>
                        <div className="text-xs text-sidebar-foreground/50">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={cn(
                      'text-xs',
                      u.role === 'admin' && 'border-red-500/30 text-red-500',
                      u.role === 'editor' && 'border-blue-500/30 text-blue-500',
                      u.role === 'user' && 'border-gray-500/30 text-gray-500'
                    )}>
                      {u.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                      {u.role === 'editor' && <Edit className="w-3 h-3 mr-1" />}
                      {u.role}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge className={cn(
                      'text-xs',
                      u.membership_type === 'vip' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
                      u.membership_type === 'premium' && 'bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary/30',
                      u.membership_type === 'free' && 'bg-gray-500/10 text-gray-500 border-gray-500/30'
                    )}>
                      {u.membership_type === 'vip' && <Crown className="w-3 h-3 mr-1" />}
                      {u.membership_type === 'premium' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {u.membership_type}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase',
                      u.membership_status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    )}>{u.membership_status}</span>
                  </td>
                  <td className="p-3 text-xs text-sidebar-foreground/50">{moment(u.created_date).format('MMM D, YYYY')}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {u.membership_type !== 'premium' && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleMembership(u, 'premium')}>
                          Make Premium
                        </Button>
                      )}
                      {u.membership_type !== 'vip' && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-yellow-500" onClick={() => toggleMembership(u, 'vip')}>
                          <Crown className="w-3 h-3 mr-1" /> VIP
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => openEdit(u)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(u)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sidebar-foreground/40 text-sm">No users found.</div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} className="mt-1" placeholder="John Doe" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="mt-1" placeholder="john@example.com" />
            </div>
            <div>
              <Label>{editing ? 'New Password (leave blank to keep)' : 'Password'}</Label>
              <Input type="password" value={form.password || ''} onChange={e => setForm(p => ({...p, password: e.target.value}))} className="mt-1" placeholder={editing ? 'Leave blank to keep current' : 'Enter password'} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(p => ({...p, role: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Membership</Label>
              <Select value={form.membership_type} onValueChange={v => setForm(p => ({...p, membership_type: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save User'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
