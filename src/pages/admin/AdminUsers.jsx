import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Crown, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import moment from 'moment';

const membershipColors = {
  free: 'bg-muted text-muted-foreground',
  premium: 'bg-primary/10 text-sidebar-primary',
  vip: 'bg-yellow-500/10 text-yellow-400',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const u = await base44.entities.User.list('-created_date', 100);
    setUsers(u); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    if (!search) return true;
    return `${u.full_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
  });

  const openEdit = (u) => {
    setEditing(u);
    setForm({ role: u.role || 'user', membership_type: u.membership_type || 'free', membership_status: u.membership_status || 'inactive', membership_expiry_date: u.membership_expiry_date || '' });
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.User.update(editing.id, form);
    toast.success('User updated');
    setEditing(null); await load(); setSaving(false);
  };

  const quickUpgrade = async (user, tier) => {
    const expiry = new Date(); expiry.setDate(expiry.getDate() + 30);
    await base44.entities.User.update(user.id, { membership_type: tier, membership_status: 'active', membership_expiry_date: expiry.toISOString() });
    toast.success(`${user.full_name || user.email} upgraded to ${tier}`);
    await load();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Users</h1>
        <p className="text-sidebar-foreground/50 mt-1">Manage members and their access levels.</p>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40" />
        <Input placeholder="Search users..." className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-sidebar-accent animate-pulse rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <div key={u.id} className="flex items-center gap-4 bg-sidebar-accent rounded-xl border border-sidebar-border px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-sidebar-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-sidebar-primary">{(u.full_name || u.email || '?')[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground">{u.full_name || u.email}</div>
                <div className="text-xs text-sidebar-foreground/50">{u.email} · Joined {moment(u.created_date).format('MMM YYYY')}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase', membershipColors[u.membership_type || 'free'])}>
                  {u.membership_type || 'free'}
                </span>
                {u.role === 'admin' && <span className="flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-sidebar-primary/10 text-sidebar-primary font-bold uppercase"><Shield className="w-2.5 h-2.5" /> Admin</span>}
              </div>
              <Button size="sm" variant="ghost" className="text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground" onClick={() => openEdit(u)}>Edit</Button>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-12 text-sidebar-foreground/40 text-sm">No users found.</div>}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit User — {editing?.full_name || editing?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(p => ({...p, role: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['admin','editor','odds_manager','seo_manager','user'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Membership Type</Label>
              <Select value={form.membership_type} onValueChange={v => setForm(p => ({...p, membership_type: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Membership Status</Label>
              <Select value={form.membership_status} onValueChange={v => setForm(p => ({...p, membership_status: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Expiry Date</Label><Input type="date" value={form.membership_expiry_date?.slice(0,10)} onChange={e => setForm(p => ({...p, membership_expiry_date: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}