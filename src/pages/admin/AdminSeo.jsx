import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const defaultSeo = { page_slug: '', meta_title: '', meta_description: '', meta_keywords: '', og_image: '' };

export default function AdminSeo() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultSeo);

  const load = async () => {
    const s = await base44.entities.SeoSetting.list('page_slug', 50);
    setSettings(s); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (editing) {
      await base44.entities.SeoSetting.update(editing.id, form);
      toast.success('SEO settings updated');
    } else {
      await base44.entities.SeoSetting.create(form);
      toast.success('SEO settings created');
    }
    setDialogOpen(false); setEditing(null); setForm(defaultSeo); load();
  };

  const handleDelete = async (id) => {
    await base44.entities.SeoSetting.delete(id); toast.success('SEO settings deleted'); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-sidebar-foreground">SEO Management</h1>
          <p className="text-sm text-sidebar-foreground/60 mt-1">Manage page-level SEO settings</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(defaultSeo); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add SEO Entry
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-sidebar-accent rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {settings.map(seo => (
            <div key={seo.id} className="flex items-center gap-3 p-4 rounded-lg bg-sidebar-accent border border-sidebar-border">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground">/{seo.page_slug}</div>
                <div className="text-xs text-sidebar-foreground/40 truncate">{seo.meta_title}</div>
              </div>
              <Button size="icon" variant="ghost" className="text-sidebar-foreground/60" onClick={() => { setEditing(seo); setForm({ page_slug: seo.page_slug || '', meta_title: seo.meta_title || '', meta_description: seo.meta_description || '', meta_keywords: seo.meta_keywords || '', og_image: seo.og_image || '' }); setDialogOpen(true); }}>
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(seo.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          {settings.length === 0 && <div className="text-center py-12 text-sidebar-foreground/40 text-sm">No SEO settings yet</div>}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading">{editing ? 'Edit SEO' : 'New SEO Entry'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Page Slug</Label><Input placeholder="e.g. home, free-odds, pricing" value={form.page_slug} onChange={e => setForm(f => ({ ...f, page_slug: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Meta Title</Label><Input value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Meta Description</Label><Textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} className="mt-1.5" rows={3} /></div>
            <div><Label>Meta Keywords</Label><Input value={form.meta_keywords} onChange={e => setForm(f => ({ ...f, meta_keywords: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>OG Image URL</Label><Input value={form.og_image} onChange={e => setForm(f => ({ ...f, og_image: e.target.value }))} className="mt-1.5" /></div>
            <Button onClick={handleSave} className="w-full">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}