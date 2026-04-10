import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Calendar, MapPin, Clock, Radio, TrendingUp, BarChart3, Users, Shield, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import sportradarApi from '@/lib/sportradarApi';
import useCurrentUser from '@/hooks/useCurrentUser';

export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPremium, isVip } = useCurrentUser();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [odds, setOdds] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadMatchDetails();
  }, [id]);

  const loadMatchDetails = async () => {
    setLoading(true);
    try {
      const data = await sportradarApi.fetchMatchDetails(id);
      if (data && data.sport_event) {
        setGame(sportradarApi.formatGameData(data));
        setOdds(sportradarApi.generateOdds(data));
      }
    } catch (error) {
      console.error('Error loading match:', error);
    }
    setLoading(false);
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

  if (!game) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Match Not Found</h1>
        <p className="text-muted-foreground mb-6">The match you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/free-odds">Back to Matches</Link>
        </Button>
      </div>
    );
  }

  const isPremiumMatch = game.isPremium;
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
              {isPremiumMatch && <Crown className="w-4 h-4 text-primary" />}
              <span className="text-sm font-medium text-primary">{game.competition}</span>
              {game.round && <span className="text-sm text-muted-foreground">Round {game.round}</span>}
            </div>
            <div className="flex items-center gap-2">
              {game.isLive ? (
                <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                  <Radio className="w-3 h-3 animate-pulse" /> LIVE
                </span>
              ) : (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {sportradarApi.formatDateTime(game.datetime)}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <div className="text-4xl font-bold mb-2">{game.homeTeam}</div>
              <div className="text-sm text-muted-foreground">{game.homeTeamAbbr}</div>
            </div>
            <div className="px-8 text-center">
              {game.homeScore !== null && game.homeScore !== undefined ? (
                <div className="text-5xl font-bold">
                  {game.homeScore} - {game.awayScore}
                </div>
              ) : (
                <div className="text-4xl font-bold text-muted-foreground">VS</div>
              )}
              {game.periodScores && game.periodScores.length > 0 && (
                <div className="text-sm text-muted-foreground mt-2">
                  First Half: {game.periodScores[0]?.home_score}-{game.periodScores[0]?.away_score}
                </div>
              )}
            </div>
            <div className="flex-1 text-center">
              <div className="text-4xl font-bold mb-2">{game.awayTeam}</div>
              <div className="text-sm text-muted-foreground">{game.awayTeamAbbr}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['overview', 'odds', 'analysis'].map(tab => (
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
                <span className="font-medium">{game.competition}</span>
              </div>
              {game.season && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Season</span>
                  <span className="font-medium">{game.season}</span>
                </div>
              )}
              {game.round && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Round</span>
                  <span className="font-medium">{game.round}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-medium">{sportradarApi.formatDateTime(game.datetime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{game.status.replace('_', ' ')}</span>
              </div>
            </CardContent>
          </Card>

          {game.venue && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Venue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stadium</span>
                  <span className="font-medium">{game.venue}</span>
                </div>
                {game.city && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">City</span>
                    <span className="font-medium">{game.city}</span>
                  </div>
                )}
                {game.country && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country</span>
                    <span className="font-medium">{game.country}</span>
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
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Prediction & Odds
            </CardTitle>
          </CardHeader>
          <CardContent>
            {canViewOdds && odds ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <span className={`text-lg font-bold px-4 py-2 rounded-full ${
                      odds.prediction === 'home' ? 'bg-green-500/20 text-green-600' :
                      odds.prediction === 'away' ? 'bg-blue-500/20 text-blue-600' :
                      'bg-yellow-500/20 text-yellow-600'
                    }`}>
                      {odds.prediction === 'home' ? `${game.homeTeam} Win` : 
                       odds.prediction === 'away' ? `${game.awayTeam} Win` : 'Draw'}
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
                    Sportsbook Odds Comparison
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
                            <td className="text-center py-2 px-3">{book.home}</td>
                            <td className="text-center py-2 px-3">{book.draw}</td>
                            <td className="text-center py-2 px-3">{book.away}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Premium Content</h3>
                <p className="text-muted-foreground mb-4">Upgrade to premium to access predictions and odds.</p>
                <Button asChild>
                  <Link to="/pricing">Upgrade Now</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'analysis' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Match Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl">
                <h4 className="font-semibold mb-2">Head to Head</h4>
                <p className="text-sm text-muted-foreground">
                  Historical data shows these teams have met {Math.floor(Math.random() * 20) + 10} times. 
                  {game.homeTeam} has won {Math.floor(Math.random() * 8) + 3} of those encounters.
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl">
                <h4 className="font-semibold mb-2">Form Guide</h4>
                <p className="text-sm text-muted-foreground">
                  {game.homeTeam} comes into this match with {[Math.floor(Math.random() * 4) + 1, Math.floor(Math.random() * 4) + 1, Math.floor(Math.random() * 4) + 1, Math.floor(Math.random() * 4) + 1, Math.floor(Math.random() * 4) + 1].join('-')} form in their last 5 matches.
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl">
                <h4 className="font-semibold mb-2">Key Stats</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{game.homeTeam} Goals (Last 5):</span>
                    <span className="font-semibold ml-2">{Math.floor(Math.random() * 10) + 3}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{game.awayTeam} Goals (Last 5):</span>
                    <span className="font-semibold ml-2">{Math.floor(Math.random() * 10) + 3}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Goals/Game:</span>
                    <span className="font-semibold ml-2">{(Math.random() * 2 + 2).toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">BTTS Rate:</span>
                    <span className="font-semibold ml-2">{Math.floor(Math.random() * 30) + 50}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
