import { useState, useEffect } from 'react';
import localDb from '@/lib/localDb';
import { Plus, Edit, Trash2, Copy, Eye, Search, Globe, FileText, Save, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import moment from 'moment';

const empty = {
  title: '',
  slug: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  content: '',
  featured_image: '',
  status: 'draft',
  page_type: 'default',
  sidebar_enabled: true,
  footer_enabled: true,
};

export default function AdminContent() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [, forceUpdate] = useState(0);

  const load = () => {
    setPages(localDb.pages.getAll());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = pages.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.slug.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setOpen(true); };

  const handleSave = () => {
    setSaving(true);
    try {
      if (editing) {
        localDb.pages.update(editing.id, form);
        localDb.activity.log({ user_id: 'admin', user_name: 'Admin', action: 'update', entity_type: 'Page', entity_name: form.title, description: `Updated page: ${form.title}` });
        toast.success('Page updated successfully');
      } else {
        localDb.pages.create(form);
        localDb.activity.log({ user_id: 'admin', user_name: 'Admin', action: 'create', entity_type: 'Page', entity_name: form.title, description: `Created page: ${form.title}` });
        toast.success('Page created successfully');
      }
      setOpen(false);
      load();
      forceUpdate(n => n + 1);
    } catch (err) {
      toast.error('Failed to save page');
    }
    setSaving(false);
  };

  const handleDelete = (page) => {
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    localDb.pages.delete(page.id);
    localDb.activity.log({ user_id: 'admin', user_name: 'Admin', action: 'delete', entity_type: 'Page', entity_name: page.title, description: `Deleted page: ${page.title}` });
    toast.success('Page deleted');
    load();
    forceUpdate(n => n + 1);
  };

  const handleDuplicate = (page) => {
    const { id, created_date, ...data } = page;
    localDb.pages.create({
      ...data,
      title: `${data.title} (Copy)`,
      slug: `${data.slug}-copy`,
    });
    toast.success('Page duplicated');
    load();
    forceUpdate(n => n + 1);
  };

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const stats = {
    total: pages.length,
    active: pages.filter(p => p.status === 'active').length,
    draft: pages.filter(p => p.status === 'draft').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Pages & Content</h1>
          <p className="text-sidebar-foreground/50 mt-1">Manage your website pages and content.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Create Page</Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-sidebar-foreground/40" />
            <span className="text-xs text-sidebar-foreground/50">Total Pages</span>
          </div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">{stats.total}</div>
        </div>
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-green-500" />
            <span className="text-xs text-sidebar-foreground/50">Published</span>
          </div>
          <div className="font-heading text-xl font-bold text-green-500">{stats.active}</div>
        </div>
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-sidebar-foreground/50">Drafts</span>
          </div>
          <div className="font-heading text-xl font-bold text-yellow-500">{stats.draft}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40" />
          <Input placeholder="Search pages..." className="pl-9 bg-sidebar-accent border-sidebar-border" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-sidebar-accent border-sidebar-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-sidebar-accent animate-pulse rounded-xl" />)}</div>
      ) : (
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sidebar-border text-left">
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Page</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Slug</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Type</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Status</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Updated</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-sidebar-border last:border-0 hover:bg-sidebar-border/30">
                  <td className="p-3">
                    <div className="text-sm font-medium text-sidebar-foreground">{p.title}</div>
                    {p.meta_title && <div className="text-xs text-sidebar-foreground/40">{p.meta_title}</div>}
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-mono text-sidebar-foreground/60">/{p.slug}</span>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">{p.page_type || 'default'}</Badge>
                  </td>
                  <td className="p-3">
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase',
                      p.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                    )}>{p.status}</span>
                  </td>
                  <td className="p-3 text-xs text-sidebar-foreground/50">{moment(p.updated_date || p.created_date).format('MMM D, YYYY')}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {p.status === 'active' && (
                        <a href={`/${p.slug}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="gap-1 h-7">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </a>
                      )}
                      <Button size="sm" variant="ghost" className="gap-1 h-7" onClick={() => { setEditing(p); setForm({ ...p }); setPreviewOpen(true); }}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1 h-7" onClick={() => openEdit(p)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1 h-7" onClick={() => handleDuplicate(p)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sidebar-foreground/40 text-sm">No pages found. Create your first page!</div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Page' : 'Create New Page'}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="content" className="mt-2">
            <TabsList className="bg-sidebar-accent">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Page Title</Label>
                  <Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value, slug: p.slug || generateSlug(e.target.value)}))} className="mt-1" placeholder="Enter page title" />
                </div>
                <div>
                  <Label>URL Slug</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm text-sidebar-foreground/50">/</span>
                    <Input value={form.slug} onChange={e => setForm(p => ({...p, slug: e.target.value}))} placeholder="page-url" />
                  </div>
                </div>
              </div>
              <div>
                <Label>Page Content (HTML supported)</Label>
                <Textarea value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))} className="mt-1 font-mono text-sm" rows={10} placeholder="<p>Your content here...</p>" />
              </div>
              <div>
                <Label>Featured Image URL</Label>
                <Input value={form.featured_image || ''} onChange={e => setForm(p => ({...p, featured_image: e.target.value}))} className="mt-1" placeholder="https://example.com/image.jpg" />
                {form.featured_image && <img src={form.featured_image} alt="" className="mt-2 h-32 w-full object-cover rounded-lg" />}
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 mt-4">
              <div>
                <Label>Meta Title</Label>
                <Input value={form.meta_title} onChange={e => setForm(p => ({...p, meta_title: e.target.value}))} className="mt-1" placeholder="SEO title for search engines" />
                <p className="text-xs text-sidebar-foreground/50 mt-1">Recommended: 50-60 characters</p>
              </div>
              <div>
                <Label>Meta Description</Label>
                <Textarea value={form.meta_description} onChange={e => setForm(p => ({...p, meta_description: e.target.value}))} className="mt-1" rows={3} placeholder="Brief description for search engines" />
                <p className="text-xs text-sidebar-foreground/50 mt-1">Recommended: 150-160 characters</p>
              </div>
              <div>
                <Label>Meta Keywords</Label>
                <Input value={form.meta_keywords} onChange={e => setForm(p => ({...p, meta_keywords: e.target.value}))} className="mt-1" placeholder="keyword1, keyword2, keyword3" />
                <p className="text-xs text-sidebar-foreground/50 mt-1">Comma-separated keywords</p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Page Type</Label>
                  <Select value={form.page_type || 'default'} onValueChange={v => setForm(p => ({...p, page_type: v}))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="landing">Landing Page</SelectItem>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="contact">Contact</SelectItem>
                      <SelectItem value="pricing">Pricing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Published</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.sidebar_enabled !== false} onCheckedChange={v => setForm(p => ({...p, sidebar_enabled: v}))} />
                <Label>Show Sidebar</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.footer_enabled !== false} onCheckedChange={v => setForm(p => ({...p, footer_enabled: v}))} />
                <Label>Show Footer</Label>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Page'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {form.title}</DialogTitle>
          </DialogHeader>
          <div className="bg-white rounded-xl p-8 min-h-[400px]">
            {form.featured_image && (
              <img src={form.featured_image} alt="" className="w-full h-48 object-cover rounded-lg mb-6" />
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{form.title || 'Untitled Page'}</h1>
            <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: form.content || '<p>No content yet...</p>' }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button onClick={() => { setPreviewOpen(false); openEdit(form); }}>Edit Page</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
