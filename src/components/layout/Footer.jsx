import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import localDb from '@/lib/localDb';
import { useEffect, useState } from 'react';

export default function Footer() {
  const [cmsPages, setCmsPages] = useState([]);

  useEffect(() => {
    const pages = localDb.pages.getAll().filter(p => p.status === 'active');
    setCmsPages(pages);
  }, []);

  const aboutPage = cmsPages.find(p => p.slug === 'about');
  const termsPage = cmsPages.find(p => p.slug === 'terms');
  const privacyPage = cmsPages.find(p => p.slug === 'privacy');

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading text-lg font-bold">Field Forecast</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your premier sports intelligence terminal. Data-driven odds analysis for the modern analyst.
            </p>
          </div>
          <div>
            <h4 className="font-heading text-sm font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2.5">
              <Link to="/free-odds" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Free Odds</Link>
              <Link to="/premium-odds" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Premium Odds</Link>
              <Link to="/sports" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Sports</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading text-sm font-semibold mb-4">Company</h4>
            <div className="space-y-2.5">
              <Link to="/pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/blog" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Blog & News</Link>
              {aboutPage ? (
                <Link to={`/page/${aboutPage.slug}`} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About Us</Link>
              ) : (
                <Link to="/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-heading text-sm font-semibold mb-4">Legal</h4>
            <div className="space-y-2.5">
              {termsPage ? (
                <Link to={`/page/${termsPage.slug}`} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
              ) : (
                <span className="block text-sm text-muted-foreground">Terms of Service</span>
              )}
              {privacyPage ? (
                <Link to={`/page/${privacyPage.slug}`} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              ) : (
                <span className="block text-sm text-muted-foreground">Privacy Policy</span>
              )}
              <span className="block text-sm text-muted-foreground">Responsible Gaming</span>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Field Forecast. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Sports data for informational purposes only.</p>
        </div>
      </div>
    </footer>
  );
}
