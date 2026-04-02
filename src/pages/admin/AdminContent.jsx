import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const empty = { title: '', slug: '', meta_title: '', meta_description: '', content: '', status: 'active' };

export default function AdminContent() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const p = await base44.entities.PageContent.list('-created_date');
    setPages(p); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editing) await base44.entities.PageContent.update(editing.id, form);
    else await base44.entities.PageContent.create(form);
    toast.success('Page saved');
    setOpen(false); await load(); setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this page?')) return;
    await base44.entities.PageContent.delete(id);
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Pages & CMS</h1>
          <p className="text-sidebar-foreground/50 mt-1">Manage page content and metadata.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> New Page</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-sidebar-accent animate-pulse rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {pages.map(p => (
            <div key={p.id} className="flex items-center gap-4 bg-sidebar-accent rounded-xl border border-sidebar-border px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground">{p.title}</div>
                <div className="text-xs text-sidebar-foreground/50 font-mono">/{p.slug}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${p.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>{p.status}</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground" onClick={() => openEdit(p)}><Edit className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
          {pages.length === 0 && <div className="text-center py-12 text-sidebar-foreground/40 text-sm">No pages yet.</div>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Page' : 'New Page'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(p => ({...p, slug: e.target.value}))} /></div>
            </div>
            <div><Label>Meta Title</Label><Input value={form.meta_title} onChange={e => setForm(p => ({...p, meta_title: e.target.value}))} /></div>
            <div><Label>Meta Description</Label><Textarea rows={2} value={form.meta_description} onChange={e => setForm(p => ({...p, meta_description: e.target.value}))} /></div>
            <div><Label>Content (HTML/Markdown)</Label><Textarea rows={8} value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))} className="font-mono text-xs" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Page'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}