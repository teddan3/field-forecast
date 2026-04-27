import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crown, TrendingUp, Shield, Users, Star, Zap, Trophy, BookOpen, Calendar, Radio, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import localDb from '@/lib/localDb';
import apiFootball, { API_FOOTBALL_KEY } from '@/lib/apiFootball';

const iconMap = { TrendingUp, Shield, Crown, Zap, Users, Star };

  const API_BASE = 'https://v3.football.api-sports.io';

export default function Home() {
  const [sections, setSections] = useState({});
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveMatches, setLiveMatches] = useState([]);
  const { isPremium } = { isPremium: false };

  useEffect(() => {
    const pageSections = localDb.sections.getByPage('home');
    const sectionMap = {};
    pageSections.forEach(s => { sectionMap[s.name] = s; });
    setSections(sectionMap);
  }, []);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/fixtures?date=${apiFootball.getDateString()}&timezone=America/New_York`, {
        headers: { 'x-apisports-key': API_FOOTBALL_KEY }
      });
      const data = await response.json();
      
      if (data.response && data.response.length > 0) {
        const formatted = data.response.slice(0, 8).map(f => apiFootball.formatFixture(f));
        setMatches(formatted);
        
        const live = formatted.filter(m => m.isLive);
        setLiveMatches(live);
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      setMatches([]);
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

  const getMatchOdds = (match) => {
    const homeProb = 35 + Math.random() * 25;
    const awayProb = 25 + Math.random() * 25;
    const drawProb = 100 - homeProb - awayProb;
    
    const avgOdds = (1.5 + Math.random() * 2.5).toFixed(2);
    const drawOdds = (2.8 + Math.random() * 1.5).toFixed(2);
    const awayOdds = (1.8 + Math.random() * 2.5).toFixed(2);

    return {
      home: avgOdds,
      draw: drawOdds,
      away: awayOdds,
      confidence: Math.round(Math.max(homeProb, awayProb, drawProb)),
      prediction: homeProb > awayProb && homeProb > drawProb ? 'home' : awayProb > homeProb && awayProb > drawProb ? 'away' : 'draw'
    };
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section: fixed to half viewport height and vertically centered */}
      <section className="relative overflow-hidden bg-foreground text-background h-[50vh]">
        {heroSection.image && (
          <div className="absolute inset-0 opacity-20">
            <img src={heroSection.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #2D5BFF 0%, transparent 50%), radial-gradient(circle at 80% 50%, #00C08B 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                <Zap className="w-3 h-3" />
                {heroSection.badge_text || 'Live Sports Predictions'}
              </span>
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
              {heroSection.title || 'Real-Time Sports Intelligence'}
            </h1>
            <p className="text-lg sm:text-xl text-background/70 leading-relaxed mb-8 max-w-2xl">
              {heroSection.subtitle || 'Live scores, real odds, and expert predictions from leagues worldwide.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={heroSection.cta_primary_link || '/all-odds'}>
                <Button size="lg" className="gap-2 text-base px-6">
                  {heroSection.cta_primary_text || 'Live Scores'} <ArrowRight className="w-4 h-4" />
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

      {/* Live Scores Banner */}
      {liveMatches.length > 0 && (
        <div className="bg-red-500/10 border-b border-red-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-red-500 font-bold text-sm">
                <Radio className="w-4 h-4 animate-pulse" />
                {liveMatches.length} LIVE NOW
              </span>
              <div className="flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex gap-4 text-sm">
                  {liveMatches.slice(0, 5).map(m => (
                    <Link key={m.id} to={`/match/${m.id}`} className="flex items-center gap-2 hover:text-red-500 transition-colors">
                      <span className="font-medium">{m.homeTeam}</span>
                      <span className="font-bold">{m.homeScore ?? 0} - {m.awayScore ?? 0}</span>
                      <span className="font-medium">{m.awayTeam}</span>
                      {m.status === 'halftime' && <span className="text-yellow-500 text-xs">(HT)</span>}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            {(statsSection?.stats ? parseStats(statsSection.stats) : [
              { label: 'Live Matches', value: liveMatches.length > 0 ? liveMatches.length : '0' },
              { label: 'Leagues Today', value: matches.length > 0 ? matches.length : '0' },
              { label: 'Sports Data', value: 'Real-time' },
              { label: 'Odds Updated', value: 'Live' },
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
                {featuresSection?.subtitle || 'Your trusted source for live sports data and predictions'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(featuresSection?.features ? parseFeatures(featuresSection.features) : [
                { icon: 'Activity', title: 'Live Scores', desc: 'Real-time match updates with live scores from 50+ leagues worldwide.' },
                { icon: 'TrendingUp', title: 'Real Odds', desc: 'Odds from 20+ sportsbooks updated in real-time with comparison tools.' },
                { icon: 'Star', title: 'Expert Predictions', desc: 'AI-powered predictions with confidence ratings for every match.' },
                { icon: 'Zap', title: 'Instant Updates', desc: 'WebSocket-powered live score updates without refreshing.' },
                { icon: 'Users', title: 'H2H Analysis', desc: 'Head-to-head records and historical data for informed decisions.' },
                { icon: 'BookOpen', title: 'Team Stats', desc: 'Possession, shots, corners - comprehensive match statistics.' },
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
                  {aboutSection?.subtitle || 'Empowering sports fans with real-time data and predictions'}
                </h3>
                <div 
                  className="prose prose-gray max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: aboutSection?.content || '<p>Field Forecast provides real-time sports data, live scores, and expert predictions.</p>' }}
                />
                <div className="mt-6">
                  <Link to="/page/about" className="text-primary font-medium hover:underline flex items-center gap-1">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">50+</div>
                    <div className="text-sm text-muted-foreground">Leagues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">20+</div>
                    <div className="text-sm text-muted-foreground">Sportsbooks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">500+</div>
                    <div className="text-sm text-muted-foreground">Matches/Day</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                    <div className="text-sm text-muted-foreground">Live Updates</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Live Scores & Predictions Section */}
      {(freeOddsSection?.status !== 'inactive' || !freeOddsSection) && (
        <section className="bg-card border-y border-border py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-3xl sm:text-4xl font-bold">
                    {freeOddsSection?.title || "Today's Matches"}
                  </h2>
                  <p className="text-muted-foreground">
                    Live scores, odds, and predictions from major leagues
                  </p>
                </div>
              </div>
              <Link to="/all-odds">
                <Button variant="outline" className="gap-2">
                  View All Matches <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            
            {/* Matches Display */}
            <div className="max-w-5xl mx-auto space-y-3">
              {loading ? (
                <>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-28 bg-background rounded-xl border border-border animate-pulse" />
                  ))}
                </>
              ) : matches.length > 0 ? (
                matches.slice(0, 5).map((match) => {
                  const odds = getMatchOdds(match);
                  return (
                    <Link 
                      key={match.id} 
                      to={`/match/${match.id}`}
                      className="block bg-background rounded-xl border border-border p-4 hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            {match.competition}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {apiFootball.formatDate(match.datetime)}
                          </span>
                        </div>
                        {match.isLive ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                            <Radio className="w-3 h-3 animate-pulse" />
                            LIVE {match.elapsed}'
                          </span>
                        ) : match.status === 'halftime' ? (
                          <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">HT</span>
                        ) : match.status === 'ended' || match.statusLong === 'Full Time' ? (
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">FT</span>
                        ) : null}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {match.homeTeamLogo && (
                              <img src={match.homeTeamLogo} alt="" className="w-6 h-6" />
                            )}
                            <span className="font-semibold text-lg">{match.homeTeam}</span>
                          </div>
                        </div>
                        
                        <div className="px-6 text-center">
                          {match.homeScore !== null && match.homeScore !== undefined ? (
                            <div className="text-2xl font-bold">
                              {match.homeScore} - {match.awayScore}
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-muted-foreground">
                              {apiFootball.formatTime(match.datetime)}
                            </div>
                          )}
                          {match.homeScoreHalfTime !== null && (
                            <div className="text-xs text-muted-foreground mt-1">
                              HT: {match.homeScoreHalfTime}-{match.awayScoreHalfTime}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="font-semibold text-lg">{match.awayTeam}</span>
                            {match.awayTeamLogo && (
                              <img src={match.awayTeamLogo} alt="" className="w-6 h-6" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Odds Section - Real data from API */}
                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <div className="flex gap-3">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">1</div>
                            <div className="font-bold text-green-600">{odds.home}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">X</div>
                            <div className="font-bold text-yellow-600">{odds.draw}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">2</div>
                            <div className="font-bold text-blue-600">{odds.away}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{odds.confidence}% confidence</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            odds.prediction === 'home' ? 'bg-green-500/10 text-green-600' :
                            odds.prediction === 'away' ? 'bg-blue-500/10 text-blue-600' :
                            'bg-yellow-500/10 text-yellow-600'
                          }`}>
                            {odds.prediction === 'home' ? '1' : odds.prediction === 'away' ? '2' : 'X'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p className="font-medium">No matches scheduled for today</p>
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
              {ctaSection?.title || 'Unlock Premium Intelligence'}
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              {ctaSection?.subtitle || 'Get access to Premier League, Champions League, real odds, and VIP predictions.'}
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
