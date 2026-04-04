import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crown, TrendingUp, Shield, Users, Star, Zap, Trophy, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import localDb from '@/lib/localDb';

const iconMap = { TrendingUp, Shield, Crown, Zap, Users, Star };

export default function Home() {
  const [sections, setSections] = useState({});
  const [matches, setMatches] = useState([]);
  const { isPremium } = { isPremium: false };

  useEffect(() => {
    const pageSections = localDb.sections.getByPage('home');
    const sectionMap = {};
    pageSections.forEach(s => { sectionMap[s.name] = s; });
    setSections(sectionMap);
  }, []);

  useEffect(() => {
    const demoMatches = [
      { id: 'm1', home_team_name: 'Manchester United', away_team_name: 'Liverpool', league_name: 'Premier League', match_datetime: new Date().toISOString(), status: 'upcoming' },
      { id: 'm2', home_team_name: 'Real Madrid', away_team_name: 'Barcelona', league_name: 'La Liga', match_datetime: new Date().toISOString(), status: 'upcoming' },
      { id: 'm3', home_team_name: 'Bayern Munich', away_team_name: 'Dortmund', league_name: 'Bundesliga', match_datetime: new Date().toISOString(), status: 'upcoming' },
    ];
    setMatches(demoMatches);
  }, []);

  const heroSection = sections.hero || {};
  const statsSection = sections.stats;
  const featuresSection = sections.features;
  const aboutSection = sections.about;
  const freeOddsSection = sections.free_odds_preview;
  const ctaSection = sections.cta;

  const parseFeatures = (featuresStr) => {
    try {
      return JSON.parse(featuresStr);
    } catch {
      return [];
    }
  };

  const parseStats = (statsStr) => {
    try {
      return JSON.parse(statsStr);
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-foreground text-background">
        {heroSection.image && (
          <div className="absolute inset-0 opacity-20">
            <img src={heroSection.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #2D5BFF 0%, transparent 50%), radial-gradient(circle at 80% 50%, #00C08B 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                <Zap className="w-3 h-3" />
                {heroSection.badge_text || 'Field Forecast Odds Prediction System'}
              </span>
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
              {heroSection.title || 'Data-Driven Odds Intelligence'}
            </h1>
            <p className="text-lg sm:text-xl text-background/70 leading-relaxed mb-8 max-w-2xl">
              {heroSection.subtitle || 'Access professional-grade sports analysis and odds intelligence. Trusted by analysts who demand precision.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={heroSection.cta_primary_link || '/free-odds'}>
                <Button size="lg" className="gap-2 text-base px-6">
                  {heroSection.cta_primary_text || 'View Free Odds'} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              {!isPremium && (
                <Link to={heroSection.cta_secondary_link || '/pricing'}>
                  <Button size="lg" variant="outline" className="gap-2 text-base px-6 border-background/20 text-background hover:bg-background/10">
                    <Crown className="w-4 h-4" />
                    {heroSection.cta_secondary_text || 'Go Premium'}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            {(statsSection?.stats ? parseStats(statsSection.stats) : [
              { label: 'Matches Daily', value: '200+' },
              { label: 'Success Rate', value: '78%' },
              { label: 'Active Members', value: '12K+' },
              { label: 'Sports Covered', value: '15+' },
            ]).map((s, i) => (
              <div key={i} className="px-6 py-5 text-center">
                <div className="font-heading text-2xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features / Why Choose Section */}
      {featuresSection?.status !== 'inactive' && (
        <section className="bg-card border-y border-border py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3">
                {featuresSection?.title || 'Why Choose Field Forecast?'}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {featuresSection?.subtitle || 'Professional-grade intelligence for serious analysts'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(featuresSection?.features ? parseFeatures(featuresSection.features) : [
                { icon: 'TrendingUp', title: 'Precision Analytics', desc: 'Algorithmic odds analysis with 78%+ historical accuracy across all major leagues.' },
                { icon: 'Shield', title: 'Verified Data', desc: 'Every prediction is backed by statistical models and expert verification.' },
                { icon: 'Crown', title: 'VIP Intelligence', desc: 'Exclusive high-confidence picks and advanced insights for our VIP members.' },
                { icon: 'Zap', title: 'Real-Time Updates', desc: 'Live odds and instant notifications when key predictions are published.' },
                { icon: 'Users', title: 'Expert Community', desc: 'Join 12,000+ analysts who rely on Field Forecast for their sports intelligence.' },
                { icon: 'Star', title: 'Multi-Sport Coverage', desc: 'Football, basketball, tennis, and 15+ sports with deep market analysis.' },
              ]).map((f, i) => {
                const IconComp = iconMap[f.icon] || Star;
                return (
                  <div key={i} className="p-6 rounded-xl border border-border bg-background hover:border-primary/20 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <IconComp className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {aboutSection?.status !== 'inactive' && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="font-heading text-3xl sm:text-4xl font-bold">
                    {aboutSection?.title || 'About Field Forecast'}
                  </h2>
                </div>
                <h3 className="text-lg text-muted-foreground mb-6">
                  {aboutSection?.subtitle || 'Your trusted sports intelligence platform'}
                </h3>
                <div 
                  className="prose prose-gray max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: aboutSection?.content || '<p>Field Forecast is your premier destination for data-driven sports analysis and betting intelligence.</p>' }}
                />
                <div className="mt-6">
                  <Link to="/page/about" className="text-primary font-medium hover:underline flex items-center gap-1">
                    Learn more about us <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">78%</div>
                    <div className="text-sm text-muted-foreground">Historical Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">15+</div>
                    <div className="text-sm text-muted-foreground">Sports Covered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">200+</div>
                    <div className="text-sm text-muted-foreground">Daily Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">12K+</div>
                    <div className="text-sm text-muted-foreground">Active Members</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Free Odds Preview Section */}
      {freeOddsSection?.status !== 'inactive' && (
        <section className="bg-card border-y border-border py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold">
                  {freeOddsSection?.title || "Today's Free Predictions"}
                </h2>
              </div>
              <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                {freeOddsSection?.subtitle || 'Get started with our daily free odds'}
              </p>
              {freeOddsSection?.content && (
                <div 
                  className="text-muted-foreground max-w-2xl mx-auto mb-8"
                  dangerouslySetInnerHTML={{ __html: freeOddsSection.content }}
                />
              )}
              <Link to={freeOddsSection?.cta_link || '/free-odds'}>
                <Button size="lg" className="gap-2">
                  {freeOddsSection?.cta_text || 'View All Free Odds'} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            
            {/* Sample matches preview */}
            <div className="max-w-2xl mx-auto space-y-3">
              {matches.slice(0, 3).map((match) => (
                <div key={match.id} className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                  <div>
                    <div className="font-medium">{match.home_team_name} vs {match.away_team_name}</div>
                    <div className="text-sm text-muted-foreground">{match.league_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-primary">Home Win</div>
                    <div className="text-xs text-muted-foreground">78% confidence</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!isPremium && ctaSection?.status !== 'inactive' && (
        <section className="bg-primary text-primary-foreground py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <Crown className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              {ctaSection?.title || 'Unlock the Full Intelligence Suite'}
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              {ctaSection?.subtitle || 'Get access to all premium odds, advanced analysis, and VIP predictions.'}
            </p>
            <Link to={ctaSection?.cta_link || '/pricing'}>
              <Button size="lg" variant="secondary" className="gap-2 text-base px-8">
                {ctaSection?.cta_text || 'View Membership Plans'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
