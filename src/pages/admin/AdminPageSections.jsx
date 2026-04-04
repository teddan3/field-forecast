import { useState, useEffect } from 'react';
import localDb from '@/lib/localDb';
import { Plus, Edit, Trash2, Eye, ExternalLink, Save, RefreshCw, Home, FileText, DollarSign, Newspaper, Mail, Trophy, Star, Settings, Check, X, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const pageConfig = [
  { key: 'home', label: 'Home Page', icon: Home, route: '/' },
  { key: 'free-odds', label: 'Free Odds', icon: Trophy, route: '/free-odds' },
  { key: 'premium-odds', label: 'Premium Odds', icon: Star, route: '/premium-odds' },
  { key: 'sports', label: 'Sports', icon: Trophy, route: '/sports' },
  { key: 'pricing', label: 'Pricing', icon: DollarSign, route: '/pricing' },
  { key: 'blog', label: 'Blog', icon: Newspaper, route: '/blog' },
  { key: 'contact', label: 'Contact', icon: Mail, route: '/contact' },
];

const sectionLabels = {
  hero: 'Hero Section',
  stats: 'Stats Bar',
  features: 'Why Choose Us',
  about: 'About Section',
  free_odds_preview: 'Free Odds Preview',
  cta: 'Call to Action',
  page_header: 'Page Header',
  contact_info: 'Contact Info',
  sports_grid: 'Sports Grid',
};

export default function AdminPageSections() {
  const [selectedPage, setSelectedPage] = useState('home');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadSections = () => {
    const pageSections = localDb.sections.getByPage(selectedPage);
    setSections(pageSections);
    setLoading(false);
    setHasChanges(false);
  };

  useEffect(() => {
    loadSections();
  }, [selectedPage]);

  const handleEditSection = (section) => {
    setEditingSection(section);
    setEditForm({ ...section });
    setHasChanges(false);
  };

  const handleFieldChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveSection = () => {
    setSaving(true);
    try {
      localDb.sections.update(editingSection.id, editForm);
      toast.success(`"${editForm.title || editForm.name}" saved successfully!`);
      setEditingSection(null);
      setHasChanges(false);
      loadSections();
      localDb.activity.log({
        user_id: 'admin',
        user_name: 'Admin',
        action: 'update',
        entity_type: 'Section',
        entity_name: `${editForm.name} (${editForm.page})`,
        description: `Updated section: ${editForm.name}`,
      });
    } catch (err) {
      toast.error('Failed to save section');
    }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    setEditingSection(null);
    setHasChanges(false);
  };

  const handleResetToDefaults = () => {
    if (!confirm('This will reset ALL sections to default values. Any custom changes will be lost. Continue?')) return;
    
    localStorage.removeItem('ff_initialized');
    localStorage.removeItem('ff_sections');
    localStorage.removeItem('ff_pages');
    localDb.initialize();
    toast.success('Sections reset to defaults! Refreshing...');
    setTimeout(() => window.location.reload(), 1000);
  };

  const getSectionLabel = (section) => {
    return sectionLabels[section.name] || section.title || section.name;
  };

  const currentPageConfig = pageConfig.find(p => p.key === selectedPage);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border bg-sidebar-accent">
        <div>
          <h1 className="font-heading text-2xl font-bold text-sidebar-foreground">Page Editor</h1>
          <p className="text-sm text-sidebar-foreground/50">Edit content on your website pages</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetToDefaults} className="gap-2 text-yellow-600 hover:text-yellow-700">
            <RotateCcw className="w-4 h-4" /> Reset to Defaults
          </Button>
          <Button variant="outline" size="sm" onClick={loadSections} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          {currentPageConfig && (
            <a href={currentPageConfig.route} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="w-4 h-4" /> View Page
                <ExternalLink className="w-3 h-3" />
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Page Selector Sidebar */}
        <div className="w-64 border-r border-sidebar-border bg-sidebar-accent/50 p-4 overflow-y-auto">
          <h3 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-3">Select Page</h3>
          <div className="space-y-1">
            {pageConfig.map(page => {
              const Icon = page.icon;
              const pageSections = localDb.sections.getByPage(page.key);
              const activeCount = pageSections.filter(s => s.status === 'active').length;
              return (
                <button
                  key={page.key}
                  onClick={() => setSelectedPage(page.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                    selectedPage === page.key
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1">{page.label}</span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    selectedPage === page.key ? 'bg-sidebar-primary-foreground/20' : 'bg-sidebar-border'
                  )}>
                    {activeCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div className="mt-8 p-4 bg-sidebar-accent rounded-xl border border-sidebar-border">
            <h3 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-sidebar-foreground/60">Total Sections</span>
                <span className="font-medium">{sections.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sidebar-foreground/60">Active</span>
                <span className="font-medium text-green-500">{sections.filter(s => s.status === 'active').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sidebar-foreground/60">Hidden</span>
                <span className="font-medium text-yellow-500">{sections.filter(s => s.status === 'inactive').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-sidebar-accent rounded-xl animate-pulse" />
              ))}
            </div>
          ) : editingSection ? (
            /* Section Editor */
            <div className="p-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <button
                    onClick={() => handleCancelEdit()}
                    className="text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground mb-1 flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to sections
                  </button>
                  <h2 className="font-heading text-2xl font-bold">Edit: {getSectionLabel(editingSection)}</h2>
                  <p className="text-sm text-sidebar-foreground/50">ID: {editingSection.name} • Type: {editingSection.section_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleCancelEdit} className="gap-2">
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                  <Button onClick={handleSaveSection} disabled={saving} className="gap-2">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>

              {hasChanges && (
                <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">You have unsaved changes</span>
                </div>
              )}

              {/* Editable Fields */}
              <div className="space-y-6">
                {/* Title */}
                <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-5">
                  <Label className="text-sm font-semibold mb-3 block">Section Title</Label>
                  <Input
                    value={editForm.title || ''}
                    onChange={e => handleFieldChange('title', e.target.value)}
                    placeholder="Enter section title..."
                    className="text-lg"
                  />
                  <p className="text-xs text-sidebar-foreground/50 mt-2">This is the main heading shown in this section</p>
                </div>

                {/* Subtitle */}
                <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-5">
                  <Label className="text-sm font-semibold mb-3 block">Subtitle / Description</Label>
                  <Textarea
                    value={editForm.subtitle || ''}
                    onChange={e => handleFieldChange('subtitle', e.target.value)}
                    placeholder="Enter subtitle or description..."
                    rows={3}
                  />
                  <p className="text-xs text-sidebar-foreground/50 mt-2">A brief description shown below the title</p>
                </div>

                {/* Hero Image (if hero section) */}
                {editForm.section_type === 'hero' && (
                  <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-5">
                    <Label className="text-sm font-semibold mb-3 block">Background Image URL</Label>
                    <Input
                      value={editForm.image || ''}
                      onChange={e => handleFieldChange('image', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                    {editForm.image && (
                      <div className="mt-3">
                        <img src={editForm.image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                      </div>
                    )}
                    <p className="text-xs text-sidebar-foreground/50 mt-2">Enter a URL to an image</p>
                  </div>
                )}

                {/* Hero Badge Text */}
                {editForm.section_type === 'hero' && (
                  <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-5">
                    <Label className="text-sm font-semibold mb-3 block">Badge Text (Optional)</Label>
                    <Input
                      value={editForm.badge_text || ''}
                      onChange={e => handleFieldChange('badge_text', e.target.value)}
                      placeholder="e.g., Field Forecast Odds Prediction System"
                    />
                    <p className="text-xs text-sidebar-foreground/50 mt-2">Small text shown above the main title</p>
                  </div>
                )}

                {/* CTA Buttons */}
                {(editForm.section_type === 'hero' || editForm.section_type === 'cta') && (
                  <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-5">
                    <Label className="text-sm font-semibold mb-3 block">Call-to-Action Buttons</Label>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-sidebar-foreground/60 mb-1 block">Primary Button Text</Label>
                          <Input
                            value={editForm.cta_primary_text || editForm.cta_text || ''}
                            onChange={e => handleFieldChange('cta_primary_text', e.target.value)}
                            placeholder="View Free Odds"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-sidebar-foreground/60 mb-1 block">Primary Button Link</Label>
                          <Input
                            value={editForm.cta_primary_link || editForm.cta_link || ''}
                            onChange={e => handleFieldChange('cta_primary_link', e.target.value)}
                            placeholder="/free-odds"
                          />
                        </div>
                      </div>
                      {editForm.section_type === 'hero' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-sidebar-foreground/60 mb-1 block">Secondary Button Text</Label>
                            <Input
                              value={editForm.cta_secondary_text || ''}
                              onChange={e => handleFieldChange('cta_secondary_text', e.target.value)}
                              placeholder="Go Premium"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-sidebar-foreground/60 mb-1 block">Secondary Button Link</Label>
                            <Input
                              value={editForm.cta_secondary_link || ''}
                              onChange={e => handleFieldChange('cta_secondary_link', e.target.value)}
                              placeholder="/pricing"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Info (if contact section) */}
                {editForm.section_type === 'contact' && (
                  <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-5">
                    <Label className="text-sm font-semibold mb-3 block">Contact Information</Label>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-sidebar-foreground/60 mb-1 block">Email Address</Label>
                        <Input
                          value={editForm.email || ''}
                          onChange={e => handleFieldChange('email', e.target.value)}
                          placeholder="support@fieldforecast.com"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-sidebar-foreground/60 mb-1 block">Phone Number</Label>
                        <Input
                          value={editForm.phone || ''}
                          onChange={e => handleFieldChange('phone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-sidebar-foreground/60 mb-1 block">Address</Label>
                        <Textarea
                          value={editForm.address || ''}
                          onChange={e => handleFieldChange('address', e.target.value)}
                          placeholder="123 Sports Street&#10;New York, NY 10001"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Content / Rich Text */}
                <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-5">
                  <Label className="text-sm font-semibold mb-3 block">Additional Content (HTML)</Label>
                  <Textarea
                    value={editForm.content || ''}
                    onChange={e => handleFieldChange('content', e.target.value)}
                    placeholder="<p>Your HTML content here...</p>"
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-sidebar-foreground/50 mt-2">HTML is supported for advanced formatting</p>
                </div>

                {/* Status Toggle */}
                <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-semibold">Section Visibility</Label>
                      <p className="text-xs text-sidebar-foreground/50 mt-1">
                        {editForm.status === 'active' ? 'This section is visible on the website' : 'This section is hidden from the website'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-sm font-medium',
                        editForm.status === 'active' ? 'text-green-500' : 'text-yellow-500'
                      )}>
                        {editForm.status === 'active' ? 'Visible' : 'Hidden'}
                      </span>
                      <button
                        onClick={() => handleFieldChange('status', editForm.status === 'active' ? 'inactive' : 'active')}
                        className={cn(
                          'w-12 h-6 rounded-full transition-colors relative',
                          editForm.status === 'active' ? 'bg-green-500' : 'bg-sidebar-border'
                        )}
                      >
                        <span className={cn(
                          'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                          editForm.status === 'active' ? 'left-7' : 'left-1'
                        )} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Sections List */
            <div className="p-6">
              <div className="mb-6">
                <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                  {currentPageConfig && (() => {
                    const Icon = currentPageConfig.icon;
                    return <Icon className="w-5 h-5" />;
                  })()}
                  {currentPageConfig?.label} - Sections
                </h2>
                <p className="text-sm text-sidebar-foreground/50 mt-1">
                  Click on any section to edit its content
                </p>
              </div>

              {sections.length > 0 ? (
                <div className="grid gap-4">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className={cn(
                        'bg-sidebar-accent rounded-xl border border-sidebar-border p-5 cursor-pointer transition-all hover:border-sidebar-primary/50 hover:shadow-lg',
                        section.status === 'inactive' && 'opacity-50'
                      )}
                      onClick={() => handleEditSection(section)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
                          section.status === 'active' ? 'bg-sidebar-primary/10' : 'bg-sidebar-border'
                        )}>
                          <Settings className={cn(
                            'w-6 h-6',
                            section.status === 'active' ? 'text-sidebar-primary' : 'text-sidebar-foreground/40'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sidebar-foreground text-lg">
                              {getSectionLabel(section)}
                            </span>
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              section.status === 'active'
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-yellow-500/10 text-yellow-500'
                            )}>
                              {section.status === 'active' ? 'Visible' : 'Hidden'}
                            </span>
                          </div>
                          <p className="text-sm text-sidebar-foreground/60 mb-2">
                            {section.title && section.name !== section.title ? section.title : ''} {section.subtitle ? `- ${section.subtitle.substring(0, 60)}${section.subtitle.length > 60 ? '...' : ''}` : ''}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-sidebar-foreground/40">
                            <span>ID: {section.name}</span>
                            <span>Type: {section.section_type}</span>
                            <span>Order: {section.order}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="gap-1">
                            <Edit className="w-4 h-4" /> Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-sidebar-accent rounded-xl border border-sidebar-border">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-sidebar-foreground/20" />
                  <h3 className="font-semibold text-sidebar-foreground mb-2">No sections found</h3>
                  <p className="text-sm text-sidebar-foreground/50 mb-4">
                    This page doesn't have any editable sections yet.
                  </p>
                  <p className="text-xs text-sidebar-foreground/40">
                    Try clicking "Reset to Defaults" above to restore sections.
                  </p>
                </div>
              )}

              {/* Tips Section */}
              <div className="mt-8 p-5 bg-sidebar-accent/50 rounded-xl border border-sidebar-border">
                <h3 className="font-semibold text-sidebar-foreground mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  How to Edit
                </h3>
                <ul className="text-sm text-sidebar-foreground/60 space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    Click any section card to edit its content
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    Change title, subtitle, buttons, images - any text
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    Use the toggle to hide/show sections
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    Click "Save Changes" to apply your edits
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    Click "View Page" to see your changes live
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    Use "Reset to Defaults" if sections don't appear
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
