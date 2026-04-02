import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2, Eye, EyeOff, Crown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const workflowColors = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-yellow-500/10 text-yellow-600',
  published: 'bg-green-500/10 text-green-600',
  archived: 'bg-red-500/10 text-red-600',
};

const empty = { match_id: '', home_win: '', draw: '', away_win: '', over_2_5: '', under_2_5: '', both_score_yes: '', both_score_no: '', confidence: 'medium', prediction: '', analysis: '', is_premium: false, is_vip: false, workflow_status: 'draft' };

export default function AdminOdds() {
  const [odds, setOdds] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const load = async () => {
    const [o, m] = await Promise.all([base44.entities.Odd.list('-created_date', 100), base44.entities.Match.list('-match_datetime', 100)]);
    setOdds(o); setMatches(m); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (odd) => { setEditing(odd); setForm({ ...odd }); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      home_win: parseFloat(form.home_win) || 0,
      draw: parseFloat(form.draw) || 0,
      away_win: parseFloat(form.away_win) || 0,
      over_2_5: form.over_2_5 ? parseFloat(form.over_2_5) : null,
      under_2_5: form.under_2_5 ? parseFloat(form.under_2_5) : null,
    };
    if (editing) await base44.entities.Odd.update(editing.id, data);
    else await base44.entities.Odd.create(data);
    toast.success(`Odds ${editing ? 'updated' : 'created'} successfully`);
    setOpen(false); await load(); setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this odd?')) return;
    await base44.entities.Odd.delete(id);
    toast.success('Deleted'); await load();
  };

  const quickPublish = async (odd) => {
    await base44.entities.Odd.update(odd.id, { workflow_status: odd.workflow_status === 'published' ? 'draft' : 'published' });
    await load();
  };

  const filtered = filterStatus === 'all' ? odds : odds.filter(o => o.workflow_status === filterStatus);
  const matchMap = Object.fromEntries(matches.map(m => [m.id, m]));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Odds Management</h1>
          <p className="text-sidebar-foreground/50 mt-1">Add, edit, and publish odds for matches.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Odds</Button>
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-6 bg-sidebar-accent rounded-lg p-1 w-fit">
        {['all', 'draft', 'review', 'published', 'archived'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/50 hover:text-sidebar-foreground'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-sidebar-accent animate-pulse rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(o => {
            const match = matchMap[o.match_id];
            return (
              <div key={o.id} className="flex items-center gap-4 bg-sidebar-accent rounded-xl border border-sidebar-border px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-sidebar-foreground">
                      {match ? `${match.home_team_name} vs ${match.away_team_name}` : `Match: ${o.match_id.slice(0,8)}...`}
                    </span>
                    {o.is_premium && <span className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-primary/10 text-sidebar-primary font-bold">PRO</span>}
                    {o.is_vip && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 font-bold">VIP</span>}
                  </div>
                  <div className="font-mono text-xs text-sidebar-foreground/60">
                    1: {o.home_win?.toFixed(2)} &nbsp; X: {o.draw?.toFixed(2)} &nbsp; 2: {o.away_win?.toFixed(2)}
                  </div>
                </div>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase', workflowColors[o.workflow_status])}>{o.workflow_status}</span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground" onClick={() => quickPublish(o)}>
                    {o.workflow_status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground" onClick={() => openEdit(o)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => handleDelete(o.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="text-center py-12 text-sidebar-foreground/40 text-sm">No odds found.</div>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Odds' : 'Add Odds'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Match</Label>
              <Select value={form.match_id} onValueChange={v => setForm(p => ({...p, match_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Select match" /></SelectTrigger>
                <SelectContent>
                  {matches.map(m => <SelectItem key={m.id} value={m.id}>{m.home_team_name} vs {m.away_team_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Home Win (1)</Label><Input type="number" step="0.01" value={form.home_win} onChange={e => setForm(p => ({...p, home_win: e.target.value}))} /></div>
              <div><Label>Draw (X)</Label><Input type="number" step="0.01" value={form.draw} onChange={e => setForm(p => ({...p, draw: e.target.value}))} /></div>
              <div><Label>Away Win (2)</Label><Input type="number" step="0.01" value={form.away_win} onChange={e => setForm(p => ({...p, away_win: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Over 2.5</Label><Input type="number" step="0.01" value={form.over_2_5} onChange={e => setForm(p => ({...p, over_2_5: e.target.value}))} /></div>
              <div><Label>Under 2.5</Label><Input type="number" step="0.01" value={form.under_2_5} onChange={e => setForm(p => ({...p, under_2_5: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Confidence</Label>
                <Select value={form.confidence} onValueChange={v => setForm(p => ({...p, confidence: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['low','medium','high','very_high'].map(c => <SelectItem key={c} value={c}>{c.replace('_',' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Workflow Status</Label>
                <Select value={form.workflow_status} onValueChange={v => setForm(p => ({...p, workflow_status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['draft','review','published','archived'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Prediction Tip</Label><Input value={form.prediction} onChange={e => setForm(p => ({...p, prediction: e.target.value}))} placeholder="e.g. Home Win" /></div>
            <div><Label>Analysis</Label><Textarea rows={3} value={form.analysis} onChange={e => setForm(p => ({...p, analysis: e.target.value}))} placeholder="Expert analysis..." /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_premium} onCheckedChange={v => setForm(p => ({...p, is_premium: v}))} />
                <Label>Premium Only</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_vip} onCheckedChange={v => setForm(p => ({...p, is_vip: v}))} />
                <Label>VIP Only</Label>
              </div>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Odds' : 'Create Odds'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}