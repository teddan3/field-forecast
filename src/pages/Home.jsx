import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crown, TrendingUp, Shield, Users, Star, Zap, Trophy, BookOpen, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import localDb from '@/lib/localDb';
import sportsApi from '@/lib/sportsApi';

const iconMap = { TrendingUp, Shield, Crown, Zap, Users, Star };

export default function Home() {
  const [sections, setSections] = useState({});
  const [freeGames, setFreeGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isPremium } = { isPremium: false };

  useEffect(() => {
    const pageSections = localDb.sections.getByPage('home');
    const sectionMap = {};
    pageSections.forEach(s => { sectionMap[s.name] = s; });
    setSections(sectionMap);
  }, []);

  useEffect(() => {
    loadFreeGames();
  }, []);

  const loadFreeGames = async () => {
    setLoading(true);
    try {
      const date = sportsApi.getDateString();
      const games = await sportsApi.fetchAllFreeGames(date);
      
      if (games.length > 0) {
        const formatted = games.slice(0, 6).map(g => sportsApi.formatGameData(g));
        setFreeGames(formatted);
      } else {
        setFreeGames(sportsApi.getDemoFreeGames().map(g => sportsApi.formatGameData(g)));
      }
    } catch (error) {
      console.error('Error loading free games:', error);
      setFreeGames(sportsApi.getDemoFreeGames().map(g => sportsApi.formatGameData(g)));
    }
    setLoading(false);
  };

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
                {heroSection.badge_text || 'Field Forecast Sports Predictions'}
              </span>
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
              {heroSection.title || 'Data-Driven Sports Intelligence'}
            </h1>
            <p className="text-lg sm:text-xl text-background/70 leading-relaxed mb-8 max-w-2xl">
              {heroSection.subtitle || 'Access professional-grade sports analysis and predictions. Trusted by fans who demand precision.'}
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
              { label: 'Sports Covered', value: '7+' },
              { label: 'Leagues Worldwide', value: '50+' },
              { label: 'Active Users', value: '10K+' },
              { label: 'Predictions Daily', value: '500+' },
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
                {featuresSection?.subtitle || 'Your trusted source for sports data and predictions'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(featuresSection?.features ? parseFeatures(featuresSection.features) : [
                { icon: 'TrendingUp', title: 'Real-Time Scores', desc: 'Instant live scores and match updates across all major sports leagues worldwide.' },
                { icon: 'Shield', title: 'Accurate Predictions', desc: 'Data-driven predictions powered by advanced analytics and expert analysis.' },
                { icon: 'Star', title: 'Comprehensive Coverage', desc: 'Football, baseball, basketball, handball, hockey, rugby, and volleyball coverage.' },
                { icon: 'Zap', title: 'Instant Updates', desc: 'Get notified immediately when scores change or new predictions are available.' },
                { icon: 'Users', title: 'Expert Analysis', desc: 'In-depth match previews, player stats, and expert insights on every game.' },
                { icon: 'BookOpen', title: 'Sports News', desc: 'Breaking stories, transfer news, and in-depth features from the sports world.' },
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
                  {aboutSection?.subtitle || 'Empowering sports fans with accurate data and insightful predictions'}
                </h3>
                <div 
                  className="prose prose-gray max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: aboutSection?.content || '<p>Field Forecast is your premier destination for data-driven sports analysis.</p>' }}
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
                    <div className="text-4xl font-bold text-primary mb-2">7+</div>
                    <div className="text-sm text-muted-foreground">Sports Covered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">50+</div>
                    <div className="text-sm text-muted-foreground">Leagues Worldwide</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">10K+</div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Free Odds Preview Section - NOW WITH REAL MATCHES */}
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
                {freeOddsSection?.subtitle || 'Real-time predictions from today's matches across major leagues'}
              </p>
              <Link to={freeOddsSection?.cta_link || '/free-odds'}>
                <Button size="lg" className="gap-2">
                  {freeOddsSection?.cta_text || 'View All Free Odds'} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            
            {/* Real Matches Display */}
            <div className="max-w-4xl mx-auto space-y-4">
              {loading ? (
                <>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-background rounded-xl border border-border animate-pulse" />
                  ))}
                </>
              ) : freeGames.length > 0 ? (
                freeGames.slice(0, 6).map((game) => {
                  const odds = sportsApi.generateOdds(game);
                  return (
                    <div key={game.gameId} className="bg-background rounded-xl border border-border p-5 hover:border-primary/20 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            {game.competition}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {sportsApi.formatDate(game.date || game.datetime)}
                          </span>
                        </div>
                        {game.status === 'InProgress' && (
                          <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                            LIVE
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{game.homeTeam}</h3>
                          <p className="text-sm text-muted-foreground">Home</p>
                        </div>
                        
                        <div className="px-6 text-center">
                          {game.homeScore !== null ? (
                            <div className="text-2xl font-bold">
                              {game.homeScore} - {game.awayScore}
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-muted-foreground">VS</div>
                          )}
                        </div>
                        
                        <div className="flex-1 text-right">
                          <h3 className="font-semibold text-lg">{game.awayTeam}</h3>
                          <p className="text-sm text-muted-foreground">Away</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <div className="flex gap-2">
                          <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
                            Home: {odds.home}
                          </span>
                          <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded">
                            Draw: {odds.draw}
                          </span>
                          <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">
                            Away: {odds.away}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{odds.confidence}% confidence</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            odds.prediction === 'home' ? 'bg-green-500/10 text-green-600' :
                            odds.prediction === 'away' ? 'bg-blue-500/10 text-blue-600' :
                            'bg-yellow-500/10 text-yellow-600'
                          }`}>
                            {odds.prediction === 'home' ? 'Home Win' : odds.prediction === 'away' ? 'Away Win' : 'Draw'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p className="font-medium">No matches available today</p>
                  <p className="text-sm mt-1">Check back later for updates</p>
                </div>
              )}
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
              {ctaSection?.subtitle || 'Get access to premium odds, Champions League, Premier League and VIP predictions.'}
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
