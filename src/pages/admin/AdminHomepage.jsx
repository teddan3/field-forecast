import { useState, useEffect } from 'react';
import localDb from '@/lib/localDb';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const empty = { section_name: '', title: '', subtitle: '', content: '', image: '', cta_text: '', cta_link: '', status: 'active', order: 0 };

export default function AdminHomepage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    const s = localDb.sections.getAll().sort((a, b) => a.order - b.order);
    setSections(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ 
    section_name: s.name || s.section_name || '', 
    title: s.title || s.section_title || '', 
    subtitle: s.subtitle || s.section_subtitle || '', 
    content: s.content || '', 
    image: s.image || '', 
    cta_text: s.cta_text || '', 
    cta_link: s.cta_link || '', 
    status: s.status || 'active', 
    order: s.order || s.display_order || 0 
  }); setOpen(true); };

  const handleSave = () => {
    setSaving(true);
    const data = {
      name: form.section_name,
      section_name: form.section_name,
      title: form.title,
      section_title: form.title,
      subtitle: form.subtitle,
      section_subtitle: form.subtitle,
      content: form.content,
      image: form.image,
      cta_text: form.cta_text,
      cta_link: form.cta_link,
      status: form.status,
      order: form.order,
      display_order: form.order,
    };
    
    if (editing) {
      localDb.sections.update(editing.id, data);
    } else {
      localDb.sections.create(data);
    }
    
    toast.success('Section saved');
    setOpen(false);
    load();
    setSaving(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this section?')) return;
    localDb.sections.delete(id);
    load();
    toast.success('Section deleted');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Homepage Sections</h1>
          <p className="text-sidebar-foreground/50 mt-1">Control all homepage content blocks.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Section</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-sidebar-accent animate-pulse rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {sections.map(s => (
            <div key={s.id} className="flex items-center gap-4 bg-sidebar-accent rounded-xl border border-sidebar-border px-4 py-4">
              <GripVertical className="w-4 h-4 text-sidebar-foreground/30 shrink-0" />
              {s.image && <img src={s.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-sidebar-foreground/40">{s.name || s.section_name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${s.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}`}>{s.status}</span>
                </div>
                <div className="text-sm font-medium text-sidebar-foreground">{s.title || s.section_title}</div>
                {(s.subtitle || s.section_subtitle) && <div className="text-xs text-sidebar-foreground/50 truncate">{s.subtitle || s.section_subtitle}</div>}
              </div>
              <span className="text-xs text-sidebar-foreground/40">Order: {s.order || s.display_order}</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground" onClick={() => openEdit(s)}><Edit className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
          {sections.length === 0 && <div className="text-center py-12 text-sidebar-foreground/40 text-sm">No sections yet. Add your first homepage section.</div>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Section' : 'New Section'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Section Key</Label><Input value={form.section_name} onChange={e => setForm(p => ({...p, section_name: e.target.value}))} placeholder="hero, features, cta..." /></div>
              <div><Label>Display Order</Label><Input type="number" value={form.order} onChange={e => setForm(p => ({...p, order: parseInt(e.target.value)||0}))} /></div>
            </div>
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} /></div>
            <div><Label>Subtitle</Label><Input value={form.subtitle} onChange={e => setForm(p => ({...p, subtitle: e.target.value}))} /></div>
            <div><Label>Content</Label><Textarea rows={3} value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))} /></div>
            <div>
              <Label>Image URL</Label>
              <Input value={form.image} onChange={e => setForm(p => ({...p, image: e.target.value}))} placeholder="https://..." className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CTA Text</Label><Input value={form.cta_text} onChange={e => setForm(p => ({...p, cta_text: e.target.value}))} /></div>
              <div><Label>CTA Link</Label><Input value={form.cta_link} onChange={e => setForm(p => ({...p, cta_link: e.target.value}))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.status === 'active'} onCheckedChange={v => setForm(p => ({...p, status: v ? 'active' : 'inactive'}))} />
              <Label>Active</Label>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Section'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
