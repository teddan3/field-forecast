import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const emptySport = { name: '', slug: '', icon: '', status: 'active', display_order: 0 };
const emptyLeague = { name: '', slug: '', sport_id: '', logo: '', country: '', status: 'active' };

export default function AdminSports() {
  const [sports, setSports] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSport, setOpenSport] = useState(false);
  const [openLeague, setOpenLeague] = useState(false);
  const [editingSport, setEditingSport] = useState(null);
  const [editingLeague, setEditingLeague] = useState(null);
  const [sportForm, setSportForm] = useState(emptySport);
  const [leagueForm, setLeagueForm] = useState(emptyLeague);
  const [saving, setSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const load = async () => {
    const [sp, lg] = await Promise.all([base44.entities.Sport.list('display_order'), base44.entities.League.list()]);
    setSports(sp); setLeagues(lg); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveSport = async () => {
    setSaving(true);
    const data = { ...sportForm, display_order: parseInt(sportForm.display_order) || 0 };
    if (editingSport) await base44.entities.Sport.update(editingSport.id, data);
    else await base44.entities.Sport.create(data);
    toast.success('Sport saved'); setOpenSport(false); await load(); setSaving(false);
  };

  const saveLeague = async () => {
    setSaving(true);
    if (editingLeague) await base44.entities.League.update(editingLeague.id, leagueForm);
    else await base44.entities.League.create(leagueForm);
    toast.success('League saved'); setOpenLeague(false); await load(); setSaving(false);
  };

  const handleSportIcon = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingIcon(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setSportForm(p => ({ ...p, icon: file_url })); setUploadingIcon(false);
  };

  const handleLeagueLogo = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setLeagueForm(p => ({ ...p, logo: file_url })); setUploadingLogo(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Sports & Leagues</h1>
        <p className="text-sidebar-foreground/50 mt-1">Configure sports categories and leagues.</p>
      </div>

      <Tabs defaultValue="sports">
        <TabsList className="bg-sidebar-accent border border-sidebar-border mb-6">
          <TabsTrigger value="sports" className="data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground">Sports</TabsTrigger>
          <TabsTrigger value="leagues" className="data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground">Leagues</TabsTrigger>
        </TabsList>

        <TabsContent value="sports">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingSport(null); setSportForm(emptySport); setOpenSport(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Sport</Button>
          </div>
          <div className="space-y-2">
            {sports.map(s => (
              <div key={s.id} className="flex items-center gap-4 bg-sidebar-accent rounded-xl border border-sidebar-border px-4 py-3">
                {s.icon ? <img src={s.icon} alt="" className="w-8 h-8 object-contain rounded" /> : <div className="w-8 h-8 rounded bg-sidebar-primary/10" />}
                <div className="flex-1"><div className="text-sm font-medium text-sidebar-foreground">{s.name}</div><div className="font-mono text-xs text-sidebar-foreground/40">{s.slug}</div></div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${s.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>{s.status}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground" onClick={() => { setEditingSport(s); setSportForm({...s}); setOpenSport(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={async () => { if(confirm('Delete?')) { await base44.entities.Sport.delete(s.id); await load(); } }}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
            {sports.length === 0 && <div className="text-center py-10 text-sidebar-foreground/40 text-sm">No sports configured.</div>}
          </div>
        </TabsContent>

        <TabsContent value="leagues">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingLeague(null); setLeagueForm(emptyLeague); setOpenLeague(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add League</Button>
          </div>
          <div className="space-y-2">
            {leagues.map(l => (
              <div key={l.id} className="flex items-center gap-4 bg-sidebar-accent rounded-xl border border-sidebar-border px-4 py-3">
                {l.logo ? <img src={l.logo} alt="" className="w-10 h-10 object-contain rounded" /> : <div className="w-10 h-10 rounded bg-sidebar-primary/10" />}
                <div className="flex-1">
                  <div className="text-sm font-medium text-sidebar-foreground">{l.name}</div>
                  <div className="text-xs text-sidebar-foreground/40">{sports.find(s => s.id === l.sport_id)?.name || l.country}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground" onClick={() => { setEditingLeague(l); setLeagueForm({...l}); setOpenLeague(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={async () => { if(confirm('Delete?')) { await base44.entities.League.delete(l.id); await load(); } }}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
            {leagues.length === 0 && <div className="text-center py-10 text-sidebar-foreground/40 text-sm">No leagues configured.</div>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={openSport} onOpenChange={setOpenSport}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingSport ? 'Edit Sport' : 'New Sport'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={sportForm.name} onChange={e => setSportForm(p => ({...p, name: e.target.value}))} /></div>
              <div><Label>Slug</Label><Input value={sportForm.slug} onChange={e => setSportForm(p => ({...p, slug: e.target.value}))} /></div>
            </div>
            <div>
              <Label>Icon</Label>
              <input type="file" accept="image/*" onChange={handleSportIcon} className="mt-1 block text-sm text-sidebar-foreground/70" />
              {uploadingIcon && <p className="text-xs mt-1 text-sidebar-foreground/50">Uploading...</p>}
              {sportForm.icon && <img src={sportForm.icon} alt="" className="mt-2 h-10 w-10 object-contain" />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Display Order</Label><Input type="number" value={sportForm.display_order} onChange={e => setSportForm(p => ({...p, display_order: e.target.value}))} /></div>
              <div><Label>Status</Label>
                <Select value={sportForm.status} onValueChange={v => setSportForm(p => ({...p, status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={saveSport} disabled={saving}>{saving ? 'Saving...' : 'Save Sport'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openLeague} onOpenChange={setOpenLeague}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingLeague ? 'Edit League' : 'New League'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Name</Label><Input value={leagueForm.name} onChange={e => setLeagueForm(p => ({...p, name: e.target.value}))} /></div>
            <div><Label>Sport</Label>
              <Select value={leagueForm.sport_id} onValueChange={v => setLeagueForm(p => ({...p, sport_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger>
                <SelectContent>{sports.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Country</Label><Input value={leagueForm.country} onChange={e => setLeagueForm(p => ({...p, country: e.target.value}))} /></div>
              <div><Label>Slug</Label><Input value={leagueForm.slug} onChange={e => setLeagueForm(p => ({...p, slug: e.target.value}))} /></div>
            </div>
            <div>
              <Label>Logo</Label>
              <input type="file" accept="image/*" onChange={handleLeagueLogo} className="mt-1 block text-sm text-sidebar-foreground/70" />
              {uploadingLogo && <p className="text-xs mt-1 text-sidebar-foreground/50">Uploading...</p>}
              {leagueForm.logo && <img src={leagueForm.logo} alt="" className="mt-2 h-14 w-14 object-contain" />}
            </div>
            <Button className="w-full" onClick={saveLeague} disabled={saving}>{saving ? 'Saving...' : 'Save League'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}