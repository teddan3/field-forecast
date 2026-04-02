import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import moment from 'moment';

const empty = { title: '', slug: '', content: '', excerpt: '', featured_image: '', category: '', tags: '', status: 'draft', published_at: '', author_name: '' };

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const p = await base44.entities.Post.list('-created_date', 100);
    setPosts(p); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const slug = form.slug || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const data = { ...form, slug, published_at: form.status === 'published' && !form.published_at ? new Date().toISOString() : form.published_at };
    if (editing) await base44.entities.Post.update(editing.id, data);
    else await base44.entities.Post.create(data);
    toast.success('Post saved');
    setOpen(false); await load(); setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return;
    await base44.entities.Post.delete(id);
    await load();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, featured_image: file_url }));
    setUploading(false);
    toast.success('Image uploaded');
  };

  const statusColors = { draft: 'bg-muted text-muted-foreground', published: 'bg-green-500/10 text-green-600', archived: 'bg-red-500/10 text-red-600' };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Blog & News</h1>
          <p className="text-sidebar-foreground/50 mt-1">Create and manage articles.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> New Post</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-sidebar-accent animate-pulse rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {posts.map(p => (
            <div key={p.id} className="flex items-center gap-4 bg-sidebar-accent rounded-xl border border-sidebar-border px-4 py-3">
              {p.featured_image && <img src={p.featured_image} alt="" className="w-12 h-10 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground truncate">{p.title}</div>
                <div className="text-xs text-sidebar-foreground/50 flex items-center gap-2">
                  {p.category && <span>{p.category}</span>}
                  {p.published_at && <span>{moment(p.published_at).format('MMM D, YYYY')}</span>}
                </div>
              </div>
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase', statusColors[p.status])}>{p.status}</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground" onClick={() => openEdit(p)}><Edit className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
          {posts.length === 0 && <div className="text-center py-12 text-sidebar-foreground/40 text-sm">No posts yet.</div>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Post' : 'New Post'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Slug (auto)</Label><Input value={form.slug} onChange={e => setForm(p => ({...p, slug: e.target.value}))} placeholder="auto-generated" /></div>
              <div><Label>Category</Label><Input value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} placeholder="Analysis, Tips..." /></div>
            </div>
            <div><Label>Excerpt</Label><Textarea rows={2} value={form.excerpt} onChange={e => setForm(p => ({...p, excerpt: e.target.value}))} /></div>
            <div><Label>Content (Markdown)</Label><Textarea rows={8} value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))} className="font-mono text-xs" /></div>
            <div>
              <Label>Featured Image</Label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-1 block text-sm text-sidebar-foreground/70" />
              {uploading && <p className="text-xs mt-1 text-sidebar-foreground/50">Uploading...</p>}
              {form.featured_image && <img src={form.featured_image} alt="" className="mt-2 h-24 w-full object-cover rounded-lg" />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Author</Label><Input value={form.author_name} onChange={e => setForm(p => ({...p, author_name: e.target.value}))} /></div>
              <div><Label>Tags</Label><Input value={form.tags} onChange={e => setForm(p => ({...p, tags: e.target.value}))} placeholder="tag1, tag2" /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Post'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}