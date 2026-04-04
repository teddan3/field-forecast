import { useState, useEffect } from 'react';
import localDb from '@/lib/localDb';
import { Search, Download, RefreshCw, DollarSign, CheckCircle, XCircle, Clock, RotateCcw, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-500 bg-yellow-500/10', label: 'Pending' },
  success: { icon: CheckCircle, color: 'text-green-500 bg-green-500/10', label: 'Success' },
  failed: { icon: XCircle, color: 'text-red-500 bg-red-500/10', label: 'Failed' },
  refunded: { icon: RotateCcw, color: 'text-blue-500 bg-blue-500/10', label: 'Refunded' },
  cancelled: { icon: XCircle, color: 'text-gray-500 bg-gray-500/10', label: 'Cancelled' },
};

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminPayments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = () => {
    const t = localDb.payments.getAll().sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    setTransactions(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = transactions.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        t.user_email?.toLowerCase().includes(searchLower) ||
        t.user_name?.toLowerCase().includes(searchLower) ||
        t.paystack_reference?.toLowerCase().includes(searchLower) ||
        t.plan_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const stats = {
    total: transactions.reduce((sum, t) => sum + (t.status === 'success' ? Number(t.amount || 0) : 0), 0),
    successCount: transactions.filter(t => t.status === 'success').length,
    pendingCount: transactions.filter(t => t.status === 'pending').length,
    failedCount: transactions.filter(t => t.status === 'failed').length,
  };

  const handleRefund = () => {
    if (!selected || !refundAmount) return;
    setProcessing(true);
    try {
      localDb.payments.update(selected.id, {
        status: 'refunded',
        refund_amount: parseFloat(refundAmount),
        refund_reason: refundReason,
        refunded_at: new Date().toISOString(),
      });
      toast.success('Refund processed');
      setRefundOpen(false);
      setDetailOpen(false);
      load();
    } catch (err) {
      toast.error('Failed to process refund');
    }
    setProcessing(false);
  };

  const exportCsv = () => {
    const headers = ['Date', 'User', 'Email', 'Plan', 'Amount', 'Currency', 'Status', 'Paystack Ref', 'Payment Method'];
    const rows = filtered.map(t => [
      formatDate(t.created_date),
      t.user_name || '',
      t.user_email || '',
      t.plan_name || '',
      t.amount || 0,
      t.currency || 'USD',
      t.status,
      t.paystack_reference || '',
      t.payment_method || '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${formatDate(new Date())}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Payments</h1>
          <p className="text-sidebar-foreground/50 mt-1">Manage Paystack transactions and refunds.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} className="gap-2"><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Button variant="outline" onClick={exportCsv} className="gap-2"><Download className="w-4 h-4" /> Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-sidebar-foreground/40" />
            <span className="text-xs text-sidebar-foreground/50">Total Revenue</span>
          </div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">${stats.total.toFixed(2)}</div>
        </div>
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-sidebar-foreground/50">Successful</span>
          </div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">{stats.successCount}</div>
        </div>
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-sidebar-foreground/50">Pending</span>
          </div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">{stats.pendingCount}</div>
        </div>
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-sidebar-foreground/50">Failed</span>
          </div>
          <div className="font-heading text-xl font-bold text-sidebar-foreground">{stats.failedCount}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40" />
          <Input placeholder="Search by email, name, reference..." className="pl-9 bg-sidebar-accent border-sidebar-border" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-sidebar-accent border-sidebar-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-sidebar-accent animate-pulse rounded-xl" />)}</div>
      ) : (
        <div className="bg-sidebar-accent rounded-xl border border-sidebar-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sidebar-border text-left">
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Reference</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Customer</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Plan</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Amount</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Date</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50">Status</th>
                <th className="p-3 text-xs font-medium text-sidebar-foreground/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const config = statusConfig[t.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                return (
                  <tr key={t.id} className="border-b border-sidebar-border last:border-0 hover:bg-sidebar-border/30">
                    <td className="p-3">
                      <span className="text-xs font-mono text-sidebar-foreground/60">{t.paystack_reference || t.id?.slice(0, 8)}</span>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium text-sidebar-foreground">{t.user_name || 'Unknown'}</div>
                      <div className="text-xs text-sidebar-foreground/40">{t.user_email}</div>
                    </td>
                    <td className="p-3 text-sm text-sidebar-foreground">{t.plan_name || '-'}</td>
                    <td className="p-3">
                      <span className="font-mono font-medium text-sidebar-foreground">${(t.amount || 0).toFixed(2)}</span>
                      <span className="text-xs text-sidebar-foreground/40 ml-1">{t.currency}</span>
                    </td>
                    <td className="p-3 text-sm text-sidebar-foreground/60">{formatDate(t.created_date)}</td>
                    <td className="p-3">
                      <span className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase', config.color)}>
                        <StatusIcon className="w-3 h-3" /> {config.label}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" className="gap-1" onClick={() => { setSelected(t); setDetailOpen(true); }}>
                        <Eye className="w-3 h-3" /> View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sidebar-foreground/40 text-sm">No transactions found.</div>
          )}
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Transaction Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-sidebar rounded-xl border border-sidebar-border">
                <div>
                  <div className="text-2xl font-bold text-sidebar-foreground">${(selected.amount || 0).toFixed(2)}</div>
                  <div className="text-sm text-sidebar-foreground/50">{selected.currency}</div>
                </div>
                <span className={cn('inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-bold uppercase', statusConfig[selected.status]?.color)}>
                  {statusConfig[selected.status]?.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><Label className="text-sidebar-foreground/50">Reference</Label><div className="font-mono text-xs mt-1">{selected.paystack_reference || '-'}</div></div>
                <div><Label className="text-sidebar-foreground/50">Transaction ID</Label><div className="font-mono text-xs mt-1">{selected.paystack_transaction_id || '-'}</div></div>
                <div><Label className="text-sidebar-foreground/50">Customer</Label><div className="mt-1">{selected.user_name || 'Unknown'}</div></div>
                <div><Label className="text-sidebar-foreground/50">Email</Label><div className="mt-1">{selected.user_email || '-'}</div></div>
                <div><Label className="text-sidebar-foreground/50">Plan</Label><div className="mt-1">{selected.plan_name || '-'}</div></div>
                <div><Label className="text-sidebar-foreground/50">Payment Method</Label><div className="mt-1">{selected.payment_method || selected.channel || '-'}</div></div>
                <div><Label className="text-sidebar-foreground/50">Date</Label><div className="mt-1">{formatDateTime(selected.created_date)}</div></div>
                <div><Label className="text-sidebar-foreground/50">IP Address</Label><div className="font-mono text-xs mt-1">{selected.ip_address || '-'}</div></div>
              </div>
              {selected.failure_reason && (
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <Label className="text-red-500">Failure Reason</Label>
                  <div className="text-sm mt-1">{selected.failure_reason}</div>
                </div>
              )}
              {selected.status === 'success' && (
                <Button variant="outline" className="w-full gap-2" onClick={() => { setRefundAmount(selected.amount?.toString() || ''); setDetailOpen(false); setRefundOpen(true); }}>
                  <RotateCcw className="w-4 h-4" /> Process Refund
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Process Refund</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-sidebar-accent rounded-lg text-sm">
              <div className="flex justify-between"><span className="text-sidebar-foreground/50">Original Amount:</span><span className="font-mono">${(selected?.amount || 0).toFixed(2)}</span></div>
            </div>
            <div>
              <Label>Refund Amount</Label>
              <Input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} className="mt-1" max={selected?.amount} />
            </div>
            <div>
              <Label>Reason for Refund</Label>
              <Textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} className="mt-1" placeholder="Enter refund reason..." />
            </div>
            <Button className="w-full" variant="destructive" onClick={handleRefund} disabled={processing || !refundAmount}>
              {processing ? 'Processing...' : 'Confirm Refund'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
