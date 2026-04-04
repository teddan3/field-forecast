import { useState, useEffect, useRef } from 'react';
import localDb from '@/lib/localDb';
import { Search, Upload, Image, Video, File, Trash2, Copy, Eye, Folder, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const fileTypeIcons = {
  image: Image,
  video: Video,
  document: File,
  other: File,
};

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function AdminMedia() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterFolder, setFilterFolder] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [folders, setFolders] = useState([]);
  const fileInputRef = useRef(null);

  const load = () => {
    const m = localDb.media.getAll();
    setMedia(m);
    const uniqueFolders = [...new Set(m.map(item => item.folder).filter(Boolean))];
    setFolders(uniqueFolders);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    
    for (const file of files) {
      try {
        const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.includes('pdf') || file.type.includes('doc') ? 'document' : 'other';
        const objectUrl = URL.createObjectURL(file);
        
        localDb.media.create({
          filename: file.name,
          file_url: objectUrl,
          file_type: fileType,
          mime_type: file.type,
          file_size: file.size,
          uploaded_by: localDb.users.getCurrentUser()?.id || 'admin',
        });
        
        localDb.activity.log({
          user_id: localDb.users.getCurrentUser()?.id || 'admin',
          user_name: localDb.users.getCurrentUser()?.full_name || 'Admin',
          action: 'upload',
          entity_type: 'Media',
          entity_name: file.name,
          description: `Uploaded ${fileType}: ${file.name}`,
        });
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    toast.success('Files uploaded');
    setUploading(false);
    load();
  };

  const handleDelete = (item) => {
    if (!confirm(`Delete "${item.filename}"?`)) return;
    localDb.media.delete(item.id);
    toast.success('Deleted');
    load();
    if (selected?.id === item.id) setDetailOpen(false);
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied');
  };

  const filtered = media.filter(m => {
    if (filterType !== 'all' && m.file_type !== filterType) return false;
    if (filterFolder !== 'all' && m.folder !== filterFolder) return false;
    if (search && !m.filename.toLowerCase().includes(search.toLowerCase()) && !m.alt_text?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: media.length,
    images: media.filter(m => m.file_type === 'image').length,
    videos: media.filter(m => m.file_type === 'video').length,
    documents: media.filter(m => m.file_type === 'document').length,
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Media Library</h1>
          <p className="text-sidebar-foreground/50 mt-1">Manage images, videos, and documents.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-sidebar-accent rounded-lg p-1 border border-sidebar-border">
            <button onClick={() => setViewMode('grid')} className={cn('p-1.5 rounded', viewMode === 'grid' ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/50')}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={cn('p-1.5 rounded', viewMode === 'list' ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/50')}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
          </Button>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: File },
          { label: 'Images', value: stats.images, icon: Image },
          { label: 'Videos', value: stats.videos, icon: Video },
          { label: 'Documents', value: stats.documents, icon: File },
        ].map(s => (
          <div key={s.label} className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-4 h-4 text-sidebar-foreground/40" />
              <span className="text-xs text-sidebar-foreground/50">{s.label}</span>
            </div>
            <div className="font-heading text-xl font-bold text-sidebar-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40" />
          <Input placeholder="Search files..." className="pl-9 bg-sidebar-accent border-sidebar-border" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 bg-sidebar-accent border-sidebar-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterFolder} onValueChange={setFilterFolder}>
          <SelectTrigger className="w-36 bg-sidebar-accent border-sidebar-border">
            <Folder className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Folders</SelectItem>
            {folders.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-40 bg-sidebar-accent animate-pulse rounded-xl" />)}</div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map(item => {
            const Icon = fileTypeIcons[item.file_type] || File;
            return (
              <div key={item.id} className="group relative bg-sidebar-accent rounded-xl border border-sidebar-border overflow-hidden cursor-pointer" onClick={() => { setSelected(item); setDetailOpen(true); }}>
                <div className="aspect-square flex items-center justify-center bg-sidebar-border/50">
                  {item.file_type === 'image' && item.file_url ? (
                    <img src={item.file_url} alt={item.alt_text || item.filename} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-12 h-12 text-sidebar-foreground/30" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); copyUrl(item.file_url); }}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDelete(item); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="p-2">
                  <div className="text-xs font-medium text-sidebar-foreground truncate">{item.filename}</div>
                  <div className="text-[10px] text-sidebar-foreground/40">{formatBytes(item.file_size)}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sidebar-border text-left">
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Preview</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Name</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Type</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Size</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Uploaded</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const Icon = fileTypeIcons[item.file_type] || File;
                return (
                  <tr key={item.id} className="border-b border-sidebar-border last:border-0 hover:bg-sidebar-border/30">
                    <td className="p-3">
                      {item.file_type === 'image' && item.file_url ? (
                        <img src={item.file_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-sidebar-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-sidebar-primary" />
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium text-sidebar-foreground">{item.filename}</div>
                      {item.folder && <div className="text-xs text-sidebar-foreground/40">{item.folder}</div>}
                    </td>
                    <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-sidebar-primary/10 text-sidebar-primary uppercase">{item.file_type}</span></td>
                    <td className="p-3 text-sm text-sidebar-foreground/60">{formatBytes(item.file_size)}</td>
                    <td className="p-3 text-sm text-sidebar-foreground/60">{formatDate(item.created_date)}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyUrl(item.file_url)}><Copy className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length === 0 && !loading && (
        <div className="text-center py-16 text-sidebar-foreground/40 text-sm">No media files found.</div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{selected?.filename}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              {selected.file_type === 'image' && selected.file_url && (
                <img src={selected.file_url} alt={selected.alt_text || ''} className="w-full rounded-lg max-h-80 object-contain bg-black/5" />
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><Label className="text-sidebar-foreground/50">URL</Label><div className="flex gap-2 mt-1"><Input value={selected.file_url} readOnly className="text-xs font-mono" /><Button size="sm" onClick={() => copyUrl(selected.file_url)}><Copy className="w-3 h-3" /></Button></div></div>
                <div><Label className="text-sidebar-foreground/50">Type</Label><div className="mt-1">{selected.mime_type}</div></div>
                <div><Label className="text-sidebar-foreground/50">Size</Label><div className="mt-1">{formatBytes(selected.file_size)}</div></div>
                <div><Label className="text-sidebar-foreground/50">Uploaded</Label><div className="mt-1">{formatDate(selected.created_date)}</div></div>
              </div>
              <div><Label className="text-sidebar-foreground/50">Alt Text</Label><Input value={selected.alt_text || ''} className="mt-1" onChange={(e) => { localDb.media.update(selected.id, { alt_text: e.target.value }); setSelected(p => ({...p, alt_text: e.target.value})); }} /></div>
              <div><Label className="text-sidebar-foreground/50">Caption</Label><Textarea value={selected.caption || ''} className="mt-1" onChange={(e) => { localDb.media.update(selected.id, { caption: e.target.value }); setSelected(p => ({...p, caption: e.target.value})); }} /></div>
              <div><Label className="text-sidebar-foreground/50">Folder</Label><Input value={selected.folder || ''} className="mt-1" onChange={(e) => { localDb.media.update(selected.id, { folder: e.target.value }); setSelected(p => ({...p, folder: e.target.value})); load(); }} /></div>
              <Button variant="destructive" className="w-full" onClick={() => handleDelete(selected)}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
