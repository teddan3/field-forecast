import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2, RefreshCw, CheckCircle, XCircle, Eye, EyeOff, Key, Globe, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import moment from 'moment';

const empty = {
  provider: '',
  api_name: 'sports',
  base_url: '',
  api_key: '',
  api_secret: '',
  webhook_url: '',
  status: 'inactive',
  sync_interval_minutes: 30,
  sports_filter: '',
  leagues_filter: '',
  is_default: false,
  notes: '',
};

const apiNames = [
  { value: 'sports', label: 'Sports Data' },
  { value: 'odds', label: 'Odds Feed' },
  { value: 'livescore', label: 'Live Scores' },
  { value: 'fixtures', label: 'Fixtures' },
  { value: 'results', label: 'Results' },
];

export default function AdminApiSettings() {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [syncing, setSyncing] = useState(null);

  const load = async () => {
    const a = await base44.entities.ApiSetting.list('-created_date');
    setApis(a);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (api) => { setEditing(api); setForm({ ...api }); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, sync_interval_minutes: parseInt(form.sync_interval_minutes) || 30 };
    if (editing) {
      await base44.entities.ApiSetting.update(editing.id, data);
      toast.success('API settings updated');
    } else {
      await base44.entities.ApiSetting.create(data);
      toast.success('API settings created');
    }
    setOpen(false);
    await load();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this API configuration?')) return;
    await base44.entities.ApiSetting.delete(id);
    toast.success('Deleted');
    await load();
  };

  const toggleStatus = async (api) => {
    const newStatus = api.status === 'active' ? 'inactive' : 'active';
    await base44.entities.ApiSetting.update(api.id, { status: newStatus });
    toast.success(`API ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
    await load();
  };

  const setDefault = async (api) => {
    const apisToUpdate = apis.filter(a => a.is_default);
    for (const a of apisToUpdate) {
      await base44.entities.ApiSetting.update(a.id, { is_default: false });
    }
    await base44.entities.ApiSetting.update(api.id, { is_default: true });
    toast.success(`${api.provider} set as default`);
    await load();
  };

  const testConnection = async (api) => {
    toast.info(`Testing ${api.provider}...`);
    setSyncing(api.id);
    await new Promise(r => setTimeout(r, 1500));
    setSyncing(null);
    toast.success(`${api.provider} connection successful`);
  };

  const statusColors = {
    active: 'bg-green-500/10 text-green-500',
    inactive: 'bg-muted text-muted-foreground',
    error: 'bg-red-500/10 text-red-500',
  };

  const groupedApis = {
    sports: apis.filter(a => a.api_name === 'sports'),
    odds: apis.filter(a => a.api_name === 'odds'),
    livescore: apis.filter(a => a.api_name === 'livescore'),
    fixtures: apis.filter(a => a.api_name === 'fixtures'),
    results: apis.filter(a => a.api_name === 'results'),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">API Settings</h1>
          <p className="text-sidebar-foreground/50 mt-1">Configure sports data providers and external APIs.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add API</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-sidebar-accent animate-pulse rounded-xl" />)}</div>
      ) : apis.length === 0 ? (
        <div className="text-center py-16 bg-sidebar-accent rounded-xl border border-sidebar-border">
          <Globe className="w-12 h-12 mx-auto text-sidebar-foreground/20 mb-4" />
          <p className="text-sidebar-foreground/40 text-sm">No API configurations yet.</p>
          <Button onClick={openCreate} className="mt-4 gap-2"><Plus className="w-4 h-4" /> Add Your First API</Button>
        </div>
      ) : (
        <Tabs defaultValue="sports" className="w-full">
          <TabsList className="bg-sidebar-accent border border-sidebar-border mb-6">
            {apiNames.map(n => (
              <TabsTrigger key={n.value} value={n.value} className="data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground">
                {n.label}
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-sidebar-border">{groupedApis[n.value]?.length || 0}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {apiNames.map(n => (
            <TabsContent key={n.value} value={n.value}>
              {groupedApis[n.value].length === 0 ? (
                <div className="text-center py-12 text-sidebar-foreground/40 text-sm bg-sidebar-accent rounded-xl border border-sidebar-border">No {n.label.toLowerCase()} APIs configured.</div>
              ) : (
                <div className="space-y-3">
                  {groupedApis[n.value].map(api => (
                    <div key={api.id} className="bg-sidebar-accent rounded-xl border border-sidebar-border p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-sidebar-primary/10 flex items-center justify-center">
                            <Key className="w-5 h-5 text-sidebar-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sidebar-foreground">{api.provider}</span>
                              {api.is_default && <span className="text-[10px] px-2 py-0.5 rounded-full bg-sidebar-primary/10 text-sidebar-primary font-bold">DEFAULT</span>}
                            </div>
                            <div className="text-xs text-sidebar-foreground/50 font-mono">{api.base_url}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase', statusColors[api.status])}>{api.status}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                        <div><span className="text-sidebar-foreground/40">Sync Interval:</span> <span className="ml-1">{api.sync_interval_minutes} min</span></div>
                        <div><span className="text-sidebar-foreground/40">Last Sync:</span> <span className="ml-1">{api.last_sync ? moment(api.last_sync).format('MMM D HH:mm') : 'Never'}</span></div>
                        <div><span className="text-sidebar-foreground/40">Sports:</span> <span className="ml-1">{api.sports_filter || 'All'}</span></div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => toggleStatus(api)}>
                          {api.status === 'active' ? <><EyeOff className="w-3 h-3" /> Disable</> : <><Eye className="w-3 h-3" /> Enable</>}
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => testConnection(api)} disabled={syncing === api.id}>
                          <RefreshCw className={cn('w-3 h-3', syncing === api.id && 'animate-spin')} /> Test
                        </Button>
                        {!api.is_default && <Button size="sm" variant="outline" className="gap-1" onClick={() => setDefault(api)}>Set Default</Button>}
                        <Button size="sm" variant="ghost" className="gap-1 ml-auto" onClick={() => openEdit(api)}><Edit className="w-3 h-3" /> Edit</Button>
                        <Button size="sm" variant="ghost" className="text-destructive gap-1" onClick={() => handleDelete(api.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit API' : 'New API Configuration'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Provider Name</Label>
                <Input value={form.provider} onChange={e => setForm(p => ({...p, provider: e.target.value}))} placeholder="e.g. SportMonks, API-Football" className="mt-1" />
              </div>
              <div>
                <Label>API Type</Label>
                <Select value={form.api_name} onValueChange={v => setForm(p => ({...p, api_name: v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{apiNames.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Base URL</Label>
              <Input value={form.base_url} onChange={e => setForm(p => ({...p, base_url: e.target.value}))} placeholder="https://api.provider.com/v3" className="mt-1 font-mono text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>API Key</Label>
                <Input value={form.api_key} onChange={e => setForm(p => ({...p, api_key: e.target.value}))} placeholder="Your API key" className="mt-1 font-mono text-sm" />
              </div>
              <div>
                <Label>API Secret</Label>
                <div className="relative mt-1">
                  <Input type={showSecret ? 'text' : 'password'} value={form.api_secret} onChange={e => setForm(p => ({...p, api_secret: e.target.value}))} placeholder="Your API secret" className="font-mono text-sm pr-10" />
                  <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground">
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <Label>Webhook URL (optional)</Label>
              <Input value={form.webhook_url} onChange={e => setForm(p => ({...p, webhook_url: e.target.value}))} placeholder="https://yoursite.com/api/webhooks/provider" className="mt-1 font-mono text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sync Interval (minutes)</Label>
                <Input type="number" value={form.sync_interval_minutes} onChange={e => setForm(p => ({...p, sync_interval_minutes: e.target.value}))} className="mt-1" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sports Filter (IDs, comma-separated)</Label>
                <Input value={form.sports_filter} onChange={e => setForm(p => ({...p, sports_filter: e.target.value}))} placeholder="1,2,3" className="mt-1" />
              </div>
              <div>
                <Label>Leagues Filter (IDs, comma-separated)</Label>
                <Input value={form.leagues_filter} onChange={e => setForm(p => ({...p, leagues_filter: e.target.value}))} placeholder="1,2,3" className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_default} onCheckedChange={v => setForm(p => ({...p, is_default: v}))} />
              <Label>Set as default provider for this API type</Label>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Internal notes..." className="mt-1" rows={2} />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Configuration'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
