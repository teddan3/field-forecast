import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Archive, Trash2, Reply, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import moment from 'moment';

const statusColors = {
  new: 'bg-primary/10 text-sidebar-primary',
  read: 'bg-muted text-muted-foreground',
  replied: 'bg-green-500/10 text-green-500',
  archived: 'bg-red-500/10 text-red-500',
};

export default function AdminContacts() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const load = async () => {
    const m = await base44.entities.ContactMessage.list('-created_date', 100);
    setMessages(m); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openMessage = async (msg) => {
    setSelected(msg); setReplyText('');
    if (msg.status === 'new') {
      await base44.entities.ContactMessage.update(msg.id, { status: 'read' });
      await load();
    }
  };

  const handleReply = async () => {
    setSending(true);
    await base44.integrations.Core.SendEmail({ to: selected.email, subject: `Re: ${selected.subject}`, body: replyText });
    await base44.entities.ContactMessage.update(selected.id, { status: 'replied', admin_reply: replyText });
    toast.success('Reply sent!');
    setSelected(null); await load(); setSending(false);
  };

  const handleArchive = async (id) => {
    await base44.entities.ContactMessage.update(id, { status: 'archived' });
    await load(); if (selected?.id === id) setSelected(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this message?')) return;
    await base44.entities.ContactMessage.delete(id);
    await load(); if (selected?.id === id) setSelected(null);
  };

  const filtered = filterStatus === 'all' ? messages : messages.filter(m => m.status === filterStatus);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Contact Messages</h1>
        <p className="text-sidebar-foreground/50 mt-1">Read, reply, and manage incoming messages.</p>
      </div>

      <div className="flex gap-1 mb-6 bg-sidebar-accent rounded-lg p-1 w-fit">
        {['all', 'new', 'read', 'replied', 'archived'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/50 hover:text-sidebar-foreground'}`}>
            {s} {s === 'new' && messages.filter(m => m.status === 'new').length > 0 && `(${messages.filter(m => m.status === 'new').length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-sidebar-accent animate-pulse rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(msg => (
            <div key={msg.id} className={cn(
              'flex items-start gap-4 bg-sidebar-accent rounded-xl border px-4 py-3 cursor-pointer hover:border-sidebar-primary/30 transition-colors',
              selected?.id === msg.id ? 'border-sidebar-primary/50' : 'border-sidebar-border',
              msg.status === 'new' && 'border-l-2 border-l-sidebar-primary'
            )} onClick={() => openMessage(msg)}>
              <div className="w-9 h-9 rounded-full bg-sidebar-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Mail className="w-4 h-4 text-sidebar-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-sidebar-foreground">{msg.name}</span>
                  <span className="text-xs text-sidebar-foreground/40">{msg.email}</span>
                </div>
                <div className="text-sm font-medium text-sidebar-foreground/80 truncate">{msg.subject}</div>
                <div className="text-xs text-sidebar-foreground/50 truncate">{msg.message}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-sidebar-foreground/40">{moment(msg.created_date).fromNow()}</span>
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase', statusColors[msg.status])}>{msg.status}</span>
                <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-sidebar-foreground/40 hover:text-sidebar-foreground" onClick={() => handleArchive(msg.id)}><Archive className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/50 hover:text-destructive" onClick={() => handleDelete(msg.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-12 text-sidebar-foreground/40 text-sm">No messages found.</div>}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Message from {selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="text-xs text-sidebar-foreground/50">{selected.email} · {moment(selected.created_date).format('MMM D, YYYY HH:mm')}</div>
              <div>
                <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1">Subject</div>
                <div className="text-sm text-sidebar-foreground">{selected.subject}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1">Message</div>
                <div className="text-sm text-sidebar-foreground bg-sidebar rounded-lg p-3 leading-relaxed">{selected.message}</div>
              </div>
              {selected.admin_reply && (
                <div>
                  <div className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-1">Your Reply</div>
                  <div className="text-sm text-sidebar-foreground bg-green-500/5 border border-green-500/20 rounded-lg p-3">{selected.admin_reply}</div>
                </div>
              )}
              {selected.status !== 'replied' && (
                <div>
                  <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1">Reply</div>
                  <Textarea rows={4} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." />
                  <Button className="w-full mt-2 gap-2" onClick={handleReply} disabled={!replyText || sending}>
                    <Reply className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}