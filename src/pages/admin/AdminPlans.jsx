import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const empty = { name: '', slug: '', price: '', duration_days: '', features: '', description: '', is_popular: false, status: 'active', tier: 'free', display_order: 0, currency: 'USD' };

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const p = await base44.entities.MembershipPlan.list('display_order');
    setPlans(p); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, price: parseFloat(form.price) || 0, duration_days: parseInt(form.duration_days) || 30, display_order: parseInt(form.display_order) || 0 };
    if (editing) await base44.entities.MembershipPlan.update(editing.id, data);
    else await base44.entities.MembershipPlan.create(data);
    toast.success('Plan saved');
    setOpen(false); await load(); setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this plan?')) return;
    await base44.entities.MembershipPlan.delete(id);
    await load();
  };

  const tierColors = { free: 'text-muted-foreground', premium: 'text-sidebar-primary', vip: 'text-yellow-400' };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Membership Plans</h1>
          <p className="text-sidebar-foreground/50 mt-1">Create and manage subscription tiers.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> New Plan</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-sidebar-accent animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p.id} className="bg-sidebar-accent rounded-xl border border-sidebar-border p-5 relative">
              {p.is_popular && <span className="absolute -top-2 right-4 px-2 py-0.5 bg-sidebar-primary text-sidebar-primary-foreground text-[10px] font-bold rounded-full uppercase">Popular</span>}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`text-xs font-bold uppercase ${tierColors[p.tier]}`}>{p.tier}</span>
                  <h3 className="font-heading text-xl font-bold text-sidebar-foreground mt-0.5">{p.name}</h3>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground" onClick={() => openEdit(p)}><Edit className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div className="font-heading text-3xl font-bold text-sidebar-foreground mb-1">${p.price}</div>
              <div className="text-xs text-sidebar-foreground/50 mb-3">{p.duration_days} days · {p.currency}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${p.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
      {plans.length === 0 && !loading && (
        <div className="text-center py-16 text-sidebar-foreground/40 text-sm bg-sidebar-accent rounded-xl border border-sidebar-border mt-4">No plans yet.</div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Plan' : 'New Plan'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} /></div>
              <div><Label>Tier</Label>
                <Select value={form.tier} onValueChange={v => setForm(p => ({...p, tier: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Price ($)</Label><Input type="number" value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))} /></div>
              <div><Label>Duration (days)</Label><Input type="number" value={form.duration_days} onChange={e => setForm(p => ({...p, duration_days: e.target.value}))} /></div>
              <div><Label>Order</Label><Input type="number" value={form.display_order} onChange={e => setForm(p => ({...p, display_order: e.target.value}))} /></div>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} /></div>
            <div><Label>Features (comma-separated)</Label><Textarea rows={3} value={form.features} onChange={e => setForm(p => ({...p, features: e.target.value}))} placeholder="Access all odds, Premium analysis, ..." /></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={form.is_popular} onCheckedChange={v => setForm(p => ({...p, is_popular: v}))} /><Label>Popular Badge</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.status === 'active'} onCheckedChange={v => setForm(p => ({...p, status: v ? 'active' : 'inactive'}))} /><Label>Active</Label></div>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Plan'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}