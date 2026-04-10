import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Calendar, MapPin, Clock, Radio, TrendingUp, BarChart3, Users, Shield, Trophy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFootball } from '@/lib/apiFootball';
import useCurrentUser from '@/hooks/useCurrentUser';

export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPremium, isVip } = useCurrentUser();
  const [fixture, setFixture] = useState(null);
  const [odds, setOdds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingOdds, setLoadingOdds] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadMatchDetails();
  }, [id]);

  const loadMatchDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://v3.football.api-sports.io/fixtures?id=${id}`, {
        headers: { 'x-apisports-key': '99d514e5aa67d22d1d8cb7f97a5a1fe6' }
      });
      const data = await response.json();
      
      if (data.response && data.response.length > 0) {
        const formatted = apiFootball.formatFixture(data.response[0]);
        setFixture(formatted);
        
        loadOdds(id);
      }
    } catch (error) {
      console.error('Error loading match:', error);
    }
    setLoading(false);
  };

  const loadOdds = async (fixtureId) => {
    setLoadingOdds(true);
    try {
      const oddsData = await apiFootball.fetchOdds(fixtureId);
      if (oddsData) {
        setOdds(apiFootball.formatOdds(oddsData));
      }
    } catch (error) {
      console.error('Error loading odds:', error);
    }
    setLoadingOdds(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-64 bg-card rounded-xl border" />
          <div className="h-48 bg-card rounded-xl border" />
        </div>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Match Not Found</h1>
        <p className="text-muted-foreground mb-6">The match you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/all-odds">Back to Matches</Link>
        </Button>
      </div>
    );
  }

  const isPremiumMatch = fixture.isPremium;
  const canViewOdds = !isPremiumMatch || isPremium || isVip;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {isPremiumMatch && !isPremium && !isVip && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-primary" />
            <span className="font-medium">Premium Match - Full Access Requires Subscription</span>
          </div>
          <Button asChild size="sm">
            <Link to="/pricing">Upgrade</Link>
          </Button>
        </div>
      )}

      <Card className="mb-6 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {fixture.competitionLogo && (
                <img src={fixture.competitionLogo} alt="" className="w-6 h-6" />
              )}
              {isPremiumMatch && <Crown className="w-4 h-4 text-primary" />}
              <span className="text-sm font-medium text-primary">{fixture.competition}</span>
              {fixture.round && <span className="text-sm text-muted-foreground">{fixture.round}</span>}
            </div>
            <div className="flex items-center gap-2">
              {fixture.isLive ? (
                <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                  <Radio className="w-3 h-3 animate-pulse" /> LIVE {fixture.elapsed}'
                </span>
              ) : (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {apiFootball.formatDateTime(fixture.datetime)}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                {fixture.homeTeamLogo && (
                  <img src={fixture.homeTeamLogo} alt="" className="w-12 h-12" />
                )}
                <div>
                  <div className="text-3xl font-bold">{fixture.homeTeam}</div>
                  {fixture.homeWinner !== null && (
                    <div className={`text-xs mt-1 ${fixture.homeWinner ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {fixture.homeWinner ? 'Winner' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-8 text-center">
              {fixture.homeScore !== null ? (
                <div className="text-5xl font-bold">
                  {fixture.homeScore} - {fixture.awayScore}
                </div>
              ) : (
                <div className="text-4xl font-bold text-muted-foreground">VS</div>
              )}
              {fixture.homeScoreHalfTime !== null && (
                <div className="text-sm text-muted-foreground mt-2">
                  First Half: {fixture.homeScoreHalfTime}-{fixture.awayScoreHalfTime}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                {fixture.statusLong}
              </div>
            </div>
            
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div>
                  <div className="text-3xl font-bold">{fixture.awayTeam}</div>
                  {fixture.awayWinner !== null && (
                    <div className={`text-xs mt-1 ${fixture.awayWinner ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {fixture.awayWinner ? 'Winner' : ''}
                    </div>
                  )}
                </div>
                {fixture.awayTeamLogo && (
                  <img src={fixture.awayTeamLogo} alt="" className="w-12 h-12" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['overview', 'odds', 'events'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Match Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Competition</span>
                <span className="font-medium flex items-center gap-2">
                  {fixture.competitionLogo && <img src={fixture.competitionLogo} alt="" className="w-4 h-4" />}
                  {fixture.competition}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Season</span>
                <span className="font-medium">{fixture.season}/{fixture.season + 1}</span>
              </div>
              {fixture.round && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Matchday</span>
                  <span className="font-medium">{fixture.round}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-medium">{apiFootball.formatDateTime(fixture.datetime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{fixture.statusLong}</span>
              </div>
              {fixture.referee && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referee</span>
                  <span className="font-medium">{fixture.referee}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {(fixture.venue || fixture.city) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Venue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fixture.venue && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stadium</span>
                    <span className="font-medium">{fixture.venue}</span>
                  </div>
                )}
                {fixture.city && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">City</span>
                    <span className="font-medium">{fixture.city}</span>
                  </div>
                )}
                {fixture.country && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country</span>
                    <span className="font-medium">{fixture.country}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'odds' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Real-Time Odds
              </span>
              {loadingOdds && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {canViewOdds ? (
              odds ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6">
                    <div className="text-center mb-4">
                      <span className={`text-lg font-bold px-4 py-2 rounded-full ${
                        odds.prediction === 'home' ? 'bg-green-500/20 text-green-600' :
                        odds.prediction === 'away' ? 'bg-blue-500/20 text-blue-600' :
                        'bg-yellow-500/20 text-yellow-600'
                      }`}>
                        {odds.prediction === 'home' ? `${fixture.homeTeam} Win` : 
                         odds.prediction === 'away' ? `${fixture.awayTeam} Win` : 'Draw'}
                      </span>
                      <div className="text-sm text-muted-foreground mt-2">{odds.confidence}% Confidence</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center bg-green-500/10 rounded-xl p-4">
                        <div className="text-xs text-muted-foreground mb-1">Home Win</div>
                        <div className="text-3xl font-bold text-green-600">{odds.home}</div>
                        <div className="text-xs text-muted-foreground mt-1">{odds.homeProb}%</div>
                      </div>
                      <div className="text-center bg-yellow-500/10 rounded-xl p-4">
                        <div className="text-xs text-muted-foreground mb-1">Draw</div>
                        <div className="text-3xl font-bold text-yellow-600">{odds.draw}</div>
                        <div className="text-xs text-muted-foreground mt-1">{odds.drawProb}%</div>
                      </div>
                      <div className="text-center bg-blue-500/10 rounded-xl p-4">
                        <div className="text-xs text-muted-foreground mb-1">Away Win</div>
                        <div className="text-3xl font-bold text-blue-600">{odds.away}</div>
                        <div className="text-xs text-muted-foreground mt-1">{odds.awayProb}%</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Sportsbook Odds Comparison ({odds.sportsbookOdds.length} bookmakers)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Sportsbook</th>
                            <th className="text-center py-2 px-3 text-green-600">Home</th>
                            <th className="text-center py-2 px-3 text-yellow-600">Draw</th>
                            <th className="text-center py-2 px-3 text-blue-600">Away</th>
                          </tr>
                        </thead>
                        <tbody>
                          {odds.sportsbookOdds.map((book, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-3 font-medium">{book.sportsbook}</td>
                              <td className="text-center py-2 px-3">{book.home || '-'}</td>
                              <td className="text-center py-2 px-3">{book.draw || '-'}</td>
                              <td className="text-center py-2 px-3">{book.away || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground text-center">
                    Last updated: {new Date(odds.lastUpdate).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading odds...</p>
                  <Button onClick={() => loadOdds(id)} className="mt-4" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Premium Content</h3>
                <p className="text-muted-foreground mb-4">Upgrade to premium to access real-time odds.</p>
                <Button asChild>
                  <Link to="/pricing">Upgrade Now</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'events' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Match Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fixture.events && fixture.events.length > 0 ? (
              <div className="space-y-3">
                {fixture.events.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-primary w-12 text-center">
                      {event.time.elapsed}'
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{event.player?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.team?.name} • {event.type}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      event.type === 'Goal' ? 'bg-green-500/20 text-green-600' :
                      event.type === 'Card' ? 'bg-yellow-500/20 text-yellow-600' :
                      event.type === 'Subst' ? 'bg-blue-500/20 text-blue-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {event.detail}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No events recorded for this match yet.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
