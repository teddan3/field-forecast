import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2, GripVertical, Eye, Copy, ChevronUp, ChevronDown, Image, Type, Layout, Settings, Save, Undo, Redo, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const sectionTypes = [
  { type: 'hero', label: 'Hero Banner', icon: Layout, description: 'Full-width hero with image and CTA' },
  { type: 'features', label: 'Features Grid', icon: Layout, description: 'Grid of feature cards' },
  { type: 'content', label: 'Content Block', icon: Type, description: 'Text content with optional image' },
  { type: 'cta', label: 'Call to Action', icon: Layout, description: 'CTA banner with button' },
  { type: 'testimonials', label: 'Testimonials', icon: Layout, description: 'Customer testimonials' },
  { type: 'stats', label: 'Statistics', icon: Layout, description: 'Numbers and stats display' },
  { type: 'faq', label: 'FAQ', icon: Type, description: 'Accordion FAQ section' },
  { type: 'newsletter', label: 'Newsletter', icon: Layout, description: 'Email signup form' },
  { type: 'gallery', label: 'Image Gallery', icon: Image, description: 'Photo gallery grid' },
  { type: 'pricing', label: 'Pricing Table', icon: Layout, description: 'Pricing cards' },
];

const emptySection = {
  type: 'content',
  name: '',
  title: '',
  subtitle: '',
  content: '',
  image: '',
  images: [],
  background_color: '',
  text_color: '',
  cta_text: '',
  cta_link: '',
  cta_new_tab: false,
  layout: 'default',
  items: [],
  status: 'draft',
  order: 0,
};

export default function AdminPageBuilder() {
  const [pages, setPages] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState(emptySection);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const load = async () => {
    try {
      const [p, s] = await Promise.all([
        base44.entities.PageContent.list('-created_date'),
        base44.entities.HomepageSection.list('order'),
      ]);
      setPages(p);
      setSections(s);
      if (p.length > 0 && !selectedPage) setSelectedPage(p[0]);
      if (s.length > 0 && selectedSection) {
        const updated = s.find(x => x.id === selectedSection.id);
        if (updated) setSelectedSection(updated);
      }
    } catch (err) {
      console.error('Load error:', err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const pushHistory = (newSections) => {
    const h = [...history.slice(0, historyIndex + 1), JSON.stringify(newSections)];
    setHistory(h);
    setHistoryIndex(h.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setSections(JSON.parse(history[historyIndex - 1]));
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setSections(JSON.parse(history[historyIndex + 1]));
      setHistoryIndex(historyIndex + 1);
    }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const section of sections) {
        if (section.id?.startsWith('new-')) {
          const { id, ...data } = section;
          const created = await base44.entities.HomepageSection.create(data);
          setSections(prev => prev.map(s => s.id === id ? created : s));
        } else {
          await base44.entities.HomepageSection.update(section.id, section);
        }
      }
      toast.success('All changes saved');
    } catch (err) {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const addSection = (type) => {
    const typeInfo = sectionTypes.find(t => t.type === type);
    const newSection = {
      ...emptySection,
      id: `new-${Date.now()}`,
      type,
      name: typeInfo?.label || type,
      order: sections.length,
    };
    const updated = [...sections, newSection];
    setSections(updated);
    pushHistory(updated);
    setSelectedSection(newSection);
    setSectionForm(newSection);
    setSectionDialogOpen(true);
  };

  const updateSection = (id, updates) => {
    const updated = sections.map(s => s.id === id ? { ...s, ...updates } : s);
    setSections(updated);
    if (selectedSection?.id === id) setSelectedSection({ ...selectedSection, ...updates });
  };

  const deleteSection = (id) => {
    if (!confirm('Delete this section?')) return;
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    pushHistory(updated);
    if (selectedSection?.id === id) setSelectedSection(null);
  };

  const moveSection = (id, direction) => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const updated = [...sections];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    updated.forEach((s, i) => s.order = i);
    setSections(updated);
    pushHistory(updated);
  };

  const handleImageUpload = async (e, field = 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateSection(selectedSection.id, { [field]: file_url });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed');
    }
    setUploading(false);
  };

  const handleImageUploadMultiple = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      } catch (err) {}
    }
    const current = selectedSection.images || [];
    updateSection(selectedSection.id, { images: [...current, ...urls] });
    setUploading(false);
    toast.success(`${urls.length} images uploaded`);
  };

  const saveSectionForm = () => {
    updateSection(selectedSection.id, sectionForm);
    setSectionDialogOpen(false);
    toast.success('Section updated');
  };

  const duplicateSection = (section) => {
    const copy = { ...section, id: `new-${Date.now()}`, name: `${section.name} (copy)`, order: sections.length };
    const updated = [...sections, copy];
    setSections(updated);
    pushHistory(updated);
    toast.success('Section duplicated');
  };

  const pageSections = selectedPage 
    ? sections.filter(s => !s.page_id || s.page_id === selectedPage.id)
    : sections;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-sidebar-accent animate-pulse rounded" />
        <div className="h-[600px] bg-sidebar-accent animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Page Builder</h1>
          <p className="text-sidebar-foreground/50 mt-1">Visual page editor with drag-and-drop sections.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo className="w-4 h-4" />
          </Button>
          <Select value={selectedPage?.id || ''} onValueChange={(v) => setSelectedPage(pages.find(p => p.id === v))}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select page..." /></SelectTrigger>
            <SelectContent>
              {pages.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              <Button variant="ghost" className="w-full mt-2 text-xs" onClick={() => setPageDialogOpen(true)}>
                <Plus className="w-3 h-3 mr-1" /> New Page
              </Button>
            </SelectContent>
          </Select>
          <Button onClick={saveAll} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Section Types Panel */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4 sticky top-4">
            <h3 className="text-sm font-medium text-sidebar-foreground mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Section Types
            </h3>
            <div className="space-y-2">
              {sectionTypes.map(st => (
                <button
                  key={st.type}
                  onClick={() => addSection(st.type)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-sidebar border border-sidebar-border hover:bg-sidebar-primary/10 hover:border-sidebar-primary/30 transition-all text-left"
                >
                  <st.icon className="w-5 h-5 text-sidebar-primary shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-sidebar-foreground">{st.label}</div>
                    <div className="text-[10px] text-sidebar-foreground/50">{st.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-sidebar-accent rounded-xl border border-sidebar-border min-h-[600px]">
            <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
              <span className="text-sm text-sidebar-foreground/50">
                {selectedPage ? `Editing: ${selectedPage.title}` : 'No page selected - editing all sections'}
              </span>
              <span className="text-xs text-sidebar-foreground/40">{pageSections.length} sections</span>
            </div>
            <div className="p-4 space-y-3">
              {pageSections.length === 0 ? (
                <div className="text-center py-16 text-sidebar-foreground/40">
                  <Layout className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No sections yet. Click a section type to add.</p>
                </div>
              ) : (
                pageSections.map((section, idx) => (
                  <div
                    key={section.id}
                    className={cn(
                      'relative rounded-xl border-2 transition-all cursor-pointer',
                      selectedSection?.id === section.id
                        ? 'border-sidebar-primary bg-sidebar-primary/5'
                        : 'border-transparent hover:border-sidebar-border bg-sidebar'
                    )}
                    onClick={() => setSelectedSection(section)}
                  >
                    {/* Section Preview */}
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <GripVertical className="w-4 h-4 text-sidebar-foreground/30 cursor-grab" />
                        <span className="text-xs font-mono text-sidebar-foreground/40 bg-sidebar-border px-2 py-0.5 rounded">
                          {section.type}
                        </span>
                        {section.status === 'draft' && (
                          <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded font-bold">DRAFT</span>
                        )}
                      </div>
                      {section.image && (
                        <img src={section.image} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
                      )}
                      <div className="text-sm font-medium text-sidebar-foreground">{section.title || 'Untitled Section'}</div>
                      {section.subtitle && <div className="text-xs text-sidebar-foreground/50 mt-1">{section.subtitle}</div>}
                      {section.content && (
                        <div className="text-xs text-sidebar-foreground/30 mt-2 line-clamp-2">{section.content}</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className={cn(
                      'absolute top-2 right-2 flex gap-1 transition-opacity',
                      selectedSection?.id === section.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    )}>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'up'); }} disabled={idx === 0}>
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'down'); }} disabled={idx === pageSections.length - 1}>
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); duplicateSection(section); }}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4 sticky top-4">
            {selectedSection ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-sidebar-foreground">Section Properties</h3>
                  <Button size="sm" variant="ghost" onClick={() => { setSectionForm(selectedSection); setSectionDialogOpen(true); }}>
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sidebar-foreground/50 text-xs">Title</Label>
                    <Input value={selectedSection.title || ''} onChange={e => updateSection(selectedSection.id, { title: e.target.value })} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-sidebar-foreground/50 text-xs">Subtitle</Label>
                    <Input value={selectedSection.subtitle || ''} onChange={e => updateSection(selectedSection.id, { subtitle: e.target.value })} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-sidebar-foreground/50 text-xs">Content</Label>
                    <Textarea value={selectedSection.content || ''} onChange={e => updateSection(selectedSection.id, { content: e.target.value })} className="mt-1 text-sm" rows={3} />
                  </div>
                  <div>
                    <Label className="text-sidebar-foreground/50 text-xs">CTA Text</Label>
                    <Input value={selectedSection.cta_text || ''} onChange={e => updateSection(selectedSection.id, { cta_text: e.target.value })} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-sidebar-foreground/50 text-xs">CTA Link</Label>
                    <Input value={selectedSection.cta_link || ''} onChange={e => updateSection(selectedSection.id, { cta_link: e.target.value })} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-sidebar-foreground/50 text-xs">Image</Label>
                    <div className="mt-1">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
                      {selectedSection.image && <img src={selectedSection.image} alt="" className="mt-2 h-20 w-full object-cover rounded" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sidebar-foreground/50 text-xs">Active</Label>
                    <Switch checked={selectedSection.status === 'active'} onCheckedChange={v => updateSection(selectedSection.id, { status: v ? 'active' : 'draft' })} />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-sidebar-foreground/40">
                <Settings className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a section to edit</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Edit Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Section: {sectionForm.type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Section Name</Label>
                <Input value={sectionForm.name} onChange={e => setSectionForm(p => ({...p, name: e.target.value}))} className="mt-1" />
              </div>
              <div>
                <Label>Layout</Label>
                <Select value={sectionForm.layout} onValueChange={v => setSectionForm(p => ({...p, layout: v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="wide">Wide</SelectItem>
                    <SelectItem value="centered">Centered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={sectionForm.title} onChange={e => setSectionForm(p => ({...p, title: e.target.value}))} className="mt-1" />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input value={sectionForm.subtitle} onChange={e => setSectionForm(p => ({...p, subtitle: e.target.value}))} className="mt-1" />
            </div>
            <div>
              <Label>Content (HTML supported)</Label>
              <Textarea value={sectionForm.content} onChange={e => setSectionForm(p => ({...p, content: e.target.value}))} className="mt-1 font-mono text-sm" rows={5} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Background Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="color" value={sectionForm.background_color || '#ffffff'} onChange={e => setSectionForm(p => ({...p, background_color: e.target.value}))} className="w-12 h-10 p-1" />
                  <Input value={sectionForm.background_color || ''} onChange={e => setSectionForm(p => ({...p, background_color: e.target.value}))} placeholder="#ffffff" />
                </div>
              </div>
              <div>
                <Label>Text Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="color" value={sectionForm.text_color || '#000000'} onChange={e => setSectionForm(p => ({...p, text_color: e.target.value}))} className="w-12 h-10 p-1" />
                  <Input value={sectionForm.text_color || ''} onChange={e => setSectionForm(p => ({...p, text_color: e.target.value}))} placeholder="#000000" />
                </div>
              </div>
            </div>
            <div>
              <Label>Image</Label>
              <div className="mt-1 space-y-2">
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {uploading && <p className="text-xs text-sidebar-foreground/50">Uploading...</p>}
                {sectionForm.image && <img src={sectionForm.image} alt="" className="h-32 w-full object-cover rounded-lg" />}
              </div>
            </div>
            {['gallery', 'features'].includes(sectionForm.type) && (
              <div>
                <Label>Gallery Images</Label>
                <div className="mt-1 space-y-2">
                  <input type="file" accept="image/*" multiple onChange={handleImageUploadMultiple} />
                  {uploading && <p className="text-xs text-sidebar-foreground/50">Uploading...</p>}
                  {sectionForm.images?.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {sectionForm.images.map((img, i) => (
                        <div key={i} className="relative group">
                          <img src={img} alt="" className="h-16 w-full object-cover rounded" />
                          <button onClick={() => setSectionForm(p => ({...p, images: p.images.filter((_, idx) => idx !== i)}))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CTA Text</Label>
                <Input value={sectionForm.cta_text} onChange={e => setSectionForm(p => ({...p, cta_text: e.target.value}))} className="mt-1" />
              </div>
              <div>
                <Label>CTA Link</Label>
                <Input value={sectionForm.cta_link} onChange={e => setSectionForm(p => ({...p, cta_link: e.target.value}))} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={sectionForm.cta_new_tab} onCheckedChange={v => setSectionForm(p => ({...p, cta_new_tab: v}))} />
              <Label>Open CTA in new tab</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={sectionForm.status === 'active'} onCheckedChange={v => setSectionForm(p => ({...p, status: v ? 'active' : 'draft'}))} />
              <Label>Active (published)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveSectionForm}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
