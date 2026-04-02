import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import moment from 'moment';

const statusColors = {
  upcoming: 'bg-blue-500/10 text-blue-600',
  live: 'bg-green-500/10 text-green-600',
  finished: 'bg-muted text-muted-foreground',
};

const empty = { home_team_name: '', away_team_name: '', league_name: '', sport_name: '', match_datetime: '', status: 'upcoming', league_id: '', sport_id: '' };

export default function AdminMatches() {
  const [matches, setMatches] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [m, l] = await Promise.all([base44.entities.Match.list('-match_datetime', 100), base44.entities.League.list()]);
    setMatches(m); setLeagues(l); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...m }); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editing) await base44.entities.Match.update(editing.id, form);
    else await base44.entities.Match.create(form);
    toast.success(`Match ${editing ? 'updated' : 'created'}`);
    setOpen(false); await load(); setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this match?')) return;
    await base44.entities.Match.delete(id);
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Matches</h1>
          <p className="text-sidebar-foreground/50 mt-1">Schedule and manage match fixtures.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Match</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-sidebar-accent animate-pulse rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {matches.map(m => (
            <div key={m.id} className="flex items-center gap-4 bg-sidebar-accent rounded-xl border border-sidebar-border px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground">
                  {m.home_team_name} <span className="text-sidebar-foreground/40 font-mono">vs</span> {m.away_team_name}
                </div>
                <div className="text-xs text-sidebar-foreground/50 mt-0.5">
                  {m.league_name || 'Unknown League'} · {moment(m.match_datetime).format('MMM D, YYYY HH:mm')}
                </div>
              </div>
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase', statusColors[m.status])}>{m.status}</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground" onClick={() => openEdit(m)}><Edit className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => handleDelete(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
          {matches.length === 0 && <div className="text-center py-12 text-sidebar-foreground/40 text-sm">No matches yet.</div>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Match' : 'Add Match'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Home Team</Label><Input value={form.home_team_name} onChange={e => setForm(p => ({...p, home_team_name: e.target.value}))} /></div>
              <div><Label>Away Team</Label><Input value={form.away_team_name} onChange={e => setForm(p => ({...p, away_team_name: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>League</Label><Input value={form.league_name} onChange={e => setForm(p => ({...p, league_name: e.target.value}))} /></div>
              <div><Label>Sport</Label><Input value={form.sport_name} onChange={e => setForm(p => ({...p, sport_name: e.target.value}))} /></div>
            </div>
            <div><Label>Date & Time</Label><Input type="datetime-local" value={form.match_datetime?.slice(0,16)} onChange={e => setForm(p => ({...p, match_datetime: e.target.value}))} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}