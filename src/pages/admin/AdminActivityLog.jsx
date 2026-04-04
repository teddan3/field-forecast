import { useState, useEffect } from 'react';
import localDb from '@/lib/localDb';
import { Search, Download, Trash2, Eye, LogIn, LogOut, Plus, Edit, Upload, FileText, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const actionIcons = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  login: LogIn,
  logout: LogOut,
  upload: Upload,
  view: Eye,
  payment: CreditCard,
  export: Download,
  import: Upload,
  publish: CheckCircle,
  unpublish: XCircle,
};

const actionColors = {
  create: 'bg-green-500/10 text-green-500',
  update: 'bg-blue-500/10 text-blue-500',
  delete: 'bg-red-500/10 text-red-500',
  login: 'bg-purple-500/10 text-purple-500',
  logout: 'bg-gray-500/10 text-gray-500',
  upload: 'bg-yellow-500/10 text-yellow-500',
  view: 'bg-gray-500/10 text-gray-500',
  payment: 'bg-green-500/10 text-green-500',
  export: 'bg-blue-500/10 text-blue-500',
  import: 'bg-orange-500/10 text-orange-500',
  publish: 'bg-green-500/10 text-green-500',
  unpublish: 'bg-red-500/10 text-red-500',
};

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export default function AdminActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = () => {
    const l = localDb.activity.getAll();
    setLogs(l);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false;
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        log.user_name?.toLowerCase().includes(searchLower) ||
        log.user_email?.toLowerCase().includes(searchLower) ||
        log.description?.toLowerCase().includes(searchLower) ||
        log.entity_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const uniqueEntities = [...new Set(logs.map(l => l.entity_type).filter(Boolean))];
  const uniqueActions = [...new Set(logs.map(l => l.action).filter(Boolean))];

  const stats = {
    total: logs.length,
    today: logs.filter(l => isToday(l.created_date)).length,
    logins: logs.filter(l => l.action === 'login').length,
    payments: logs.filter(l => l.action === 'payment').length,
  };

  const openDetail = (log) => { setSelectedLog(log); setDetailOpen(true); };

  const clearLogs = () => {
    if (!confirm('Are you sure you want to clear all logs? This cannot be undone.')) return;
    localDb.activity.clear();
    toast.success('All logs cleared');
    load();
  };

  const exportLogs = () => {
    const headers = ['Date', 'Time', 'User', 'Email', 'Action', 'Entity Type', 'Entity Name', 'Status', 'IP Address', 'Description'];
    const rows = filtered.map(l => [
      formatDate(l.created_date),
      formatTime(l.created_date),
      l.user_name || '',
      l.user_email || '',
      l.action || '',
      l.entity_type || '',
      l.entity_name || '',
      l.status || '',
      l.ip_address || '',
      l.description || '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${formatDate(new Date())}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Activity Log</h1>
          <p className="text-sidebar-foreground/50 mt-1">Track all admin actions and user activities.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLogs} className="gap-2"><Download className="w-4 h-4" /> Export</Button>
          <Button variant="outline" onClick={clearLogs} className="gap-2 text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /> Clear All</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="text-xs text-sidebar-foreground/50 mb-1">Total Logs</div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">{stats.total}</div>
        </div>
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="text-xs text-sidebar-foreground/50 mb-1">Today</div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">{stats.today}</div>
        </div>
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="text-xs text-sidebar-foreground/50 mb-1">Logins</div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">{stats.logins}</div>
        </div>
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="text-xs text-sidebar-foreground/50 mb-1">Payments</div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">{stats.payments}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40" />
          <Input placeholder="Search logs..." className="pl-9 bg-sidebar-accent border-sidebar-border" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-36 bg-sidebar-accent border-sidebar-border"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-36 bg-sidebar-accent border-sidebar-border"><SelectValue placeholder="Entity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {uniqueEntities.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 bg-sidebar-accent border-sidebar-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-12 bg-sidebar-accent animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sidebar-border text-left">
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Time</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">User</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Action</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Entity</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Details</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(log => {
                const ActionIcon = actionIcons[log.action] || FileText;
                return (
                  <tr key={log.id} className="border-b border-sidebar-border last:border-0 hover:bg-sidebar-border/30">
                    <td className="p-3">
                      <div className="text-sm text-sidebar-foreground">{formatDate(log.created_date)}</div>
                      <div className="text-xs text-sidebar-foreground/40">{formatTime(log.created_date)}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium text-sidebar-foreground">{log.user_name || 'System'}</div>
                      <div className="text-xs text-sidebar-foreground/40">{log.user_email}</div>
                    </td>
                    <td className="p-3">
                      <span className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase', actionColors[log.action] || 'bg-gray-500/10 text-gray-500')}>
                        <ActionIcon className="w-3 h-3" /> {log.action}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-sidebar-foreground">{log.entity_type || '-'}</span>
                      {log.entity_name && <span className="text-xs text-sidebar-foreground/40 ml-1">/ {log.entity_name}</span>}
                    </td>
                    <td className="p-3">
                      <div className="text-sm text-sidebar-foreground/60 max-w-xs truncate">{log.description || '-'}</div>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" className="gap-1" onClick={() => openDetail(log)}>
                        <Eye className="w-3 h-3" /> View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sidebar-foreground/40 text-sm">No activity logs found.</div>
          )}
          {filtered.length > 100 && (
            <div className="text-center py-3 text-sm text-sidebar-foreground/40 border-t border-sidebar-border">
              Showing 100 of {filtered.length} logs. Export for full data.
            </div>
          )}
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Activity Details</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-sidebar rounded-xl border border-sidebar-border">
                <div className="w-10 h-10 rounded-full bg-sidebar-primary/10 flex items-center justify-center">
                  {(function() { const Icon = actionIcons[selectedLog.action] || FileText; return <Icon className="w-5 h-5 text-sidebar-primary" />; })()}
                </div>
                <div>
                  <div className="font-medium text-sidebar-foreground">{selectedLog.action?.toUpperCase()} {selectedLog.entity_type}</div>
                  <div className="text-sm text-sidebar-foreground/50">{selectedLog.description || 'No description'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><Label className="text-sidebar-foreground/50">User</Label><div className="mt-1">{selectedLog.user_name || 'System'}</div></div>
                <div><Label className="text-sidebar-foreground/50">Email</Label><div className="mt-1">{selectedLog.user_email || '-'}</div></div>
                <div><Label className="text-sidebar-foreground/50">Entity ID</Label><div className="font-mono text-xs mt-1">{selectedLog.entity_id || '-'}</div></div>
                <div><Label className="text-sidebar-foreground/50">Status</Label><div className="mt-1"><span className={cn('text-xs px-2 py-0.5 rounded-full font-bold uppercase', selectedLog.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500')}>{selectedLog.status}</span></div></div>
                <div><Label className="text-sidebar-foreground/50">IP Address</Label><div className="font-mono text-xs mt-1">{selectedLog.ip_address || '-'}</div></div>
                <div><Label className="text-sidebar-foreground/50">Timestamp</Label><div className="mt-1">{formatDateTime(selectedLog.created_date)}</div></div>
              </div>
              {selectedLog.changes && (
                <div>
                  <Label className="text-sidebar-foreground/50">Changes</Label>
                  <pre className="mt-1 p-3 bg-sidebar-border/50 rounded-lg text-xs font-mono overflow-x-auto">{selectedLog.changes}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
