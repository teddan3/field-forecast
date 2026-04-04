import { useState, useEffect } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import localDb from '@/lib/localDb';

export default function Contact() {
  const [pageHeader, setPageHeader] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const header = localDb.sections.getByName('contact', 'page_header');
    const info = localDb.sections.getByName('contact', 'contact_info');
    setPageHeader(header);
    setContactInfo(info);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const contacts = localDb.pages.getAll().find(p => p.slug === 'contact');
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setSubmitted(true);
    setSubmitting(false);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const title = pageHeader?.title || 'Get in Touch';
  const subtitle = pageHeader?.subtitle || "Questions about our plans or predictions? We're here to help.";
  const email = contactInfo?.email || 'support@fieldforecast.com';
  const phone = contactInfo?.phone || '+1 (555) 123-4567';
  const address = contactInfo?.address || 'Sports Analytics Center\n123 Prediction Lane\nNew York, NY 10001';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="font-heading text-5xl font-bold mb-4">{title}</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact info */}
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Email</div>
              <div className="font-medium">{email}</div>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Phone</div>
              <div className="font-medium">{phone}</div>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Location</div>
              <div className="font-medium whitespace-pre-line">{address}</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-2">Message Sent!</h3>
              <p className="text-muted-foreground mb-6">We'll respond within 24 hours.</p>
              <Button variant="outline" onClick={() => setSubmitted(false)}>Send Another</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="john@example.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" required value={form.subject} onChange={e => setForm(p => ({...p, subject: e.target.value}))} placeholder="What's this about?" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" required rows={5} value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))} placeholder="Tell us how we can help..." />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                <Send className="w-4 h-4" />
                {submitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
