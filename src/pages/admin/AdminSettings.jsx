import { useState, useEffect } from 'react';
import localDb from '@/lib/localDb';
import { Settings as SettingsIcon, Globe, Palette, Search, Mail, CreditCard, Code, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const categories = [
  { value: 'general', label: 'General', icon: Globe },
  { value: 'appearance', label: 'Appearance', icon: Palette },
  { value: 'seo', label: 'SEO', icon: Search },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'payment', label: 'Payment', icon: CreditCard },
  { value: 'api', label: 'API', icon: Code },
  { value: 'advanced', label: 'Advanced', icon: SettingsIcon },
];

const defaultSettings = {
  general: [
    { key: 'site_name', label: 'Site Name', type: 'text', placeholder: 'Field Forecast', description: 'The name of your website' },
    { key: 'site_tagline', label: 'Site Tagline', type: 'text', placeholder: 'Your sports prediction hub', description: 'Short description of your site' },
    { key: 'site_url', label: 'Site URL', type: 'text', placeholder: 'https://example.com', description: 'Your website URL' },
    { key: 'support_email', label: 'Support Email', type: 'text', placeholder: 'support@example.com', description: 'Contact email for support' },
    { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'boolean', description: 'Enable to show maintenance page' },
  ],
  appearance: [
    { key: 'primary_color', label: 'Primary Color', type: 'text', placeholder: '#000000', description: 'Main brand color' },
    { key: 'secondary_color', label: 'Secondary Color', type: 'text', placeholder: '#666666', description: 'Secondary color' },
    { key: 'logo_url', label: 'Logo URL', type: 'text', placeholder: 'https://...', description: 'URL to your logo' },
    { key: 'favicon_url', label: 'Favicon URL', type: 'text', placeholder: 'https://.../favicon.ico', description: 'URL to favicon' },
    { key: 'dark_mode_enabled', label: 'Dark Mode', type: 'boolean', description: 'Enable dark mode by default' },
  ],
  seo: [
    { key: 'default_meta_title', label: 'Default Meta Title', type: 'text', placeholder: 'Field Forecast', description: 'Fallback title for pages' },
    { key: 'default_meta_description', label: 'Default Meta Description', type: 'text', placeholder: 'Sports predictions...', description: 'Fallback description' },
    { key: 'default_meta_keywords', label: 'Default Meta Keywords', type: 'text', placeholder: 'sports, predictions, odds', description: 'Fallback keywords' },
    { key: 'og_image_url', label: 'Default OG Image', type: 'text', placeholder: 'https://...', description: 'Default social share image' },
    { key: 'google_analytics_id', label: 'Google Analytics ID', type: 'text', placeholder: 'G-XXXXXXXXXX', description: 'GA4 measurement ID' },
  ],
  email: [
    { key: 'smtp_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com', description: 'SMTP server host' },
    { key: 'smtp_port', label: 'SMTP Port', type: 'text', placeholder: '587', description: 'SMTP server port' },
    { key: 'smtp_user', label: 'SMTP Username', type: 'text', placeholder: 'user@example.com', description: 'SMTP username' },
    { key: 'smtp_password', label: 'SMTP Password', type: 'password', placeholder: '••••••••', description: 'SMTP password' },
    { key: 'from_email', label: 'From Email', type: 'text', placeholder: 'noreply@example.com', description: 'Sender email address' },
    { key: 'from_name', label: 'From Name', type: 'text', placeholder: 'Field Forecast', description: 'Sender name' },
  ],
  payment: [
    { key: 'paystack_public_key', label: 'Paystack Public Key', type: 'text', placeholder: 'pk_live_...', description: 'Paystack public key' },
    { key: 'paystack_secret_key', label: 'Paystack Secret Key', type: 'password', placeholder: 'sk_live_...', description: 'Paystack secret key' },
    { key: 'currency', label: 'Currency', type: 'text', placeholder: 'USD', description: 'Default currency code' },
    { key: 'currency_symbol', label: 'Currency Symbol', type: 'text', placeholder: '$', description: 'Currency symbol' },
    { key: 'tax_enabled', label: 'Enable Tax', type: 'boolean', description: 'Apply tax to transactions' },
    { key: 'tax_rate', label: 'Tax Rate (%)', type: 'text', placeholder: '0', description: 'Tax percentage' },
  ],
  api: [
    { key: 'odds_api_enabled', label: 'Odds API', type: 'boolean', description: 'Enable odds fetching' },
    { key: 'livescore_api_enabled', label: 'Livescore API', type: 'boolean', description: 'Enable livescore updates' },
    { key: 'api_timeout', label: 'API Timeout (seconds)', type: 'text', placeholder: '30', description: 'Request timeout' },
    { key: 'api_cache_duration', label: 'Cache Duration (minutes)', type: 'text', placeholder: '5', description: 'Cache API responses' },
  ],
  advanced: [
    { key: 'debug_mode', label: 'Debug Mode', type: 'boolean', description: 'Enable detailed error logs' },
    { key: 'cache_enabled', label: 'Enable Cache', type: 'boolean', description: 'Enable page caching' },
    { key: 'cache_duration', label: 'Cache Duration (seconds)', type: 'text', placeholder: '3600', description: 'Page cache duration' },
    { key: 'max_upload_size', label: 'Max Upload Size (MB)', type: 'text', placeholder: '10', description: 'Maximum file upload size' },
    { key: 'allowed_file_types', label: 'Allowed File Types', type: 'text', placeholder: 'jpg,png,pdf', description: 'Comma-separated extensions' },
    { key: 'rate_limit_enabled', label: 'Rate Limiting', type: 'boolean', description: 'Enable API rate limiting' },
    { key: 'rate_limit_requests', label: 'Rate Limit (per minute)', type: 'text', placeholder: '60', description: 'Max requests per minute' },
  ],
};

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const load = () => {
    setLoading(true);
    try {
      const allSettings = localDb.settings.getAll();
      setSettings(allSettings);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setSaving(true);
    try {
      const newSettings = {};
      for (const category of Object.keys(defaultSettings)) {
        for (const setting of defaultSettings[category]) {
          newSettings[setting.key] = settings[setting.key] !== undefined ? settings[setting.key] : '';
        }
      }
      localDb.settings.setMultiple(newSettings);
      toast.success('Settings saved');
      setHasChanges(false);
    } catch (err) {
      toast.error('Failed to save settings');
    }
    setSaving(false);
  };

  const getSettingValue = (key, type) => {
    const value = settings[key];
    if (type === 'boolean') return value === true || value === 'true';
    return value || '';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-sidebar-accent animate-pulse rounded" />
        <div className="h-96 bg-sidebar-accent animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Site Settings</h1>
          <p className="text-sidebar-foreground/50 mt-1">Configure your website settings and integrations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} className="gap-2"><RefreshCw className="w-4 h-4" /> Reset</Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-sidebar-accent border border-sidebar-border mb-6 flex flex-wrap h-auto">
          {categories.map(c => {
            const Icon = c.icon;
            return (
              <TabsTrigger key={c.value} value={c.value} className="data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground gap-2">
                <Icon className="w-4 h-4" /> {c.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {categories.map(c => (
          <TabsContent key={c.value} value={c.value}>
            <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-6">
              <h2 className="font-heading text-lg font-semibold text-sidebar-foreground mb-6">{c.label} Settings</h2>
              <div className="space-y-6">
                {defaultSettings[c.value]?.map(setting => (
                  <div key={setting.key} className="flex items-start justify-between gap-8">
                    <div className="flex-1">
                      <Label className="text-sidebar-foreground font-medium">{setting.label}</Label>
                      <p className="text-xs text-sidebar-foreground/50 mt-0.5">{setting.description}</p>
                    </div>
                    <div className="w-64">
                      {setting.type === 'boolean' ? (
                        <div className="flex items-center justify-end">
                          <Switch
                            checked={getSettingValue(setting.key, setting.type)}
                            onCheckedChange={(v) => updateSetting(setting.key, v)}
                          />
                        </div>
                      ) : setting.type === 'password' ? (
                        <Input
                          type="password"
                          value={getSettingValue(setting.key, setting.type)}
                          onChange={(e) => updateSetting(setting.key, e.target.value)}
                          placeholder={setting.placeholder}
                          className="font-mono text-sm"
                        />
                      ) : (
                        <Input
                          value={getSettingValue(setting.key, setting.type)}
                          onChange={(e) => updateSetting(setting.key, e.target.value)}
                          placeholder={setting.placeholder}
                          className={cn(setting.type === 'text' && 'font-mono text-sm')}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
