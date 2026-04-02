import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Crown, TrendingUp, Shield, Users, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LiveTicker from '../components/odds/LiveTicker';
import MatchOddsRow from '../components/odds/MatchOddsRow';
import useCurrentUser from '../hooks/useCurrentUser';

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [odds, setOdds] = useState([]);
  const [posts, setPosts] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isPremium, isVip } = useCurrentUser();

  useEffect(() => {
    const load = async () => {
      const [m, o, p, s] = await Promise.all([
        base44.entities.Match.list('-match_datetime', 10),
        base44.entities.Odd.filter({ workflow_status: 'published' }, '-created_date', 10),
        base44.entities.Post.filter({ status: 'published' }, '-published_at', 3),
        base44.entities.HomepageSection.filter({ status: 'active' }, 'display_order', 10),
      ]);
      setMatches(m); setOdds(o); setPosts(p); setSections(s);
      setLoading(false);
    };
    load();
  }, []);

  const heroSection = sections.find(s => s.section_name === 'hero');
  const featuresSection = sections.find(s => s.section_name === 'features');

  const oddsMap = Object.fromEntries(odds.map(o => [o.match_id, o]));
  const todayMatches = matches.filter(m => {
    const d = new Date(m.match_datetime);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).slice(0, 5);

  return (
    <div className="min-h-screen">
      <LiveTicker matches={matches} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-foreground text-background">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #2D5BFF 0%, transparent 50%), radial-gradient(circle at 80% 50%, #00C08B 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                <Zap className="w-3 h-3" /> Field Forecast Odds Prediction System.
              </span>
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
              {heroSection?.section_title || 'Data-Driven Odds Intelligence'}
            </h1>
            <p className="text-lg sm:text-xl text-background/70 leading-relaxed mb-8 max-w-2xl">
              {heroSection?.section_subtitle || 'Access professional-grade sports analysis and odds intelligence. Trusted by analysts who demand precision.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/free-odds"><Button size="lg" className="gap-2 text-base px-6">View Free Odds <ArrowRight className="w-4 h-4" /></Button></Link>
              {!isPremium && <Link to="/pricing"><Button size="lg" variant="outline" className="gap-2 text-base px-6 border-background/20 text-background hover:bg-background/10"><Crown className="w-4 h-4" /> Go Premium</Button></Link>}
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            {[
              { label: 'Matches Daily', value: '200+' },
              { label: 'Success Rate', value: '78%' },
              { label: 'Active Members', value: '12K+' },
              { label: 'Sports Covered', value: '15+' },
            ].map(s => (
              <div key={s.label} className="px-6 py-5 text-center">
                <div className="font-heading text-2xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's odds */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-3xl font-bold">Today's Fixtures</h2>
            <p className="text-muted-foreground mt-1">Live odds from today's top matches</p>
          </div>
          <Link to="/free-odds"><Button variant="outline" className="gap-2">All Odds <ArrowRight className="w-4 h-4" /></Button></Link>
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : todayMatches.length > 0 ? (
          <div className="space-y-3">
            {todayMatches.map(m => <MatchOddsRow key={m.id} match={m} odd={oddsMap[m.id]} canViewPremium={isPremium} canViewVip={isVip} />)}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground">No fixtures scheduled for today.</p>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3">{featuresSection?.section_title || 'Why Choose Alpha?'}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{featuresSection?.section_subtitle || 'Professional-grade intelligence for serious analysts'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: 'Precision Analytics', desc: 'Algorithmic odds analysis with 78%+ historical accuracy across all major leagues.' },
              { icon: Shield, title: 'Verified Data', desc: 'Every prediction is backed by statistical models and expert verification.' },
              { icon: Crown, title: 'VIP Intelligence', desc: 'Exclusive high-confidence picks and advanced insights for our VIP members.' },
              { icon: Zap, title: 'Real-Time Updates', desc: 'Live odds and instant notifications when key predictions are published.' },
              { icon: Users, title: 'Expert Community', desc: 'Join 12,000+ analysts who rely on Alpha for their sports intelligence.' },
              { icon: Star, title: 'Multi-Sport Coverage', desc: 'Football, basketball, tennis, and 15+ sports with deep market analysis.' },
            ].map(f => (
              <div key={f.title} className="p-6 rounded-xl border border-border bg-background hover:border-primary/20 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog preview */}
      {posts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-3xl font-bold">Latest Analysis</h2>
            <Link to="/blog"><Button variant="outline" className="gap-2">All Posts <ArrowRight className="w-4 h-4" /></Button></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="group bg-card rounded-xl border border-border overflow-hidden hover:border-primary/20 transition-all">
                {p.featured_image && <img src={p.featured_image} alt={p.title} className="w-full h-44 object-cover" />}
                <div className="p-5">
                  {p.category && <span className="text-xs font-semibold text-primary uppercase tracking-wider">{p.category}</span>}
                  <h3 className="font-heading text-lg font-semibold mt-1 mb-2 group-hover:text-primary transition-colors">{p.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      {!isPremium && (
        <section className="bg-primary text-primary-foreground py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <Crown className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">Unlock the Full Intelligence Suite</h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Get access to all premium odds, advanced analysis, and VIP predictions.
            </p>
            <Link to="/pricing"><Button size="lg" variant="secondary" className="gap-2 text-base px-8">View Membership Plans <ArrowRight className="w-4 h-4" /></Button></Link>
          </div>
        </section>
      )}
    </div>
  );
}
