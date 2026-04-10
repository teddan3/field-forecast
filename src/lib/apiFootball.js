const API_FOOTBALL_KEY = '99d514e5aa67d22d1d8cb7f97a5a1fe6';
const BASE_URL = 'https://v3.football.api-sports.io';

export const PREMIUM_LEAGUES = [
  { id: 39, name: 'Premier League', country: 'England', logo: null },
  { id: 140, name: 'La Liga', country: 'Spain', logo: null },
  { id: 78, name: 'Bundesliga', country: 'Germany', logo: null },
  { id: 135, name: 'Serie A', country: 'Italy', logo: null },
  { id: 61, name: 'Ligue 1', country: 'France', logo: null },
  { id: 2, name: 'UEFA Champions League', country: 'World', logo: null },
  { id: 3, name: 'UEFA Europa League', country: 'World', logo: null },
];

export const FREE_LEAGUES = [
  { id: 253, name: 'MLS', country: 'USA', logo: null },
  { id: 323, name: 'Eredivisie', country: 'Netherlands', logo: null },
  { id: 71, name: 'Brasileirão', country: 'Brazil', logo: null },
  { id: 218, name: 'J1 League', country: 'Japan', logo: null },
  { id: 144, name: 'Scottish Premiership', country: 'Scotland', logo: null },
  { id: 215, name: 'Saudi Pro League', country: 'Saudi Arabia', logo: null },
];

async function fetchFromApiFootball(endpoint) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY }
    });
    if (!response.ok) {
      console.error('API-Football Error:', response.status, response.statusText);
      return null;
    }
    const data = await response.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('API-Football Errors:', data.errors);
    }
    return data;
  } catch (error) {
    console.error('Error fetching from API-Football:', error);
    return null;
  }
}

export const apiFootball = {
  async fetchLiveFixtures() {
    const data = await fetchFromApiFootball(`/fixtures?live=all&timezone=America/New_York`);
    if (!data || !data.response) return [];
    return data.response;
  },

  async fetchFixturesByDate(date) {
    const data = await fetchFromApiFootball(`/fixtures?date=${date}&timezone=America/New_York`);
    if (!data || !data.response) return [];
    return data.response;
  },

  async fetchFixturesByLeague(leagueId, season = new Date().getFullYear()) {
    const data = await fetchFromApiFootball(`/fixtures?league=${leagueId}&season=${season}&timezone=America/New_York`);
    if (!data || !data.response) return [];
    return data.response;
  },

  async fetchOdds(fixtureId) {
    const data = await fetchFromApiFootball(`/odds?fixture=${fixtureId}&timezone=America/New_York`);
    if (!data || !data.response || data.response.length === 0) return null;
    return data.response[0];
  },

  async fetchH2H(team1Id, team2Id) {
    const data = await fetchFromApiFootball(`/fixtures?h2h=${team1Id}-${team2Id}&timezone=America/New_York`);
    if (!data || !data.response) return [];
    return data.response;
  },

  async fetchLeagues(season = new Date().getFullYear()) {
    const data = await fetchFromApiFootball(`/leagues?season=${season}`);
    if (!data || !data.response) return [];
    return data.response;
  },

  async fetchTodayFixtures() {
    const today = new Date().toISOString().split('T')[0];
    return this.fetchFixturesByDate(today);
  },

  async fetchTomorrowFixtures() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.fetchFixturesByDate(tomorrow.toISOString().split('T')[0]);
  },

  isPremiumLeague(leagueId) {
    return PREMIUM_LEAGUES.some(l => l.id === leagueId);
  },

  isPremiumLeagueByName(name) {
    return PREMIUM_LEAGUES.some(l => l.name.toLowerCase() === name.toLowerCase());
  },

  getPremiumLeagues() {
    return PREMIUM_LEAGUES;
  },

  getFreeLeagues() {
    return FREE_LEAGUES;
  },

  formatFixture(fixture) {
    const { fixture: f, league, teams, goals, score, events } = fixture;
    
    const statusMap = {
      'NS': 'scheduled',
      'TBD': 'scheduled',
      'PST': 'postponed',
      'SUSP': 'suspended',
      'INT': 'interrupted',
      'FT': 'ended',
      'AET': 'ended',
      'PEN': 'ended',
      'HT': 'halftime',
      '1H': 'in_progress',
      '2H': 'in_progress',
      'ET': 'in_progress',
      'BT': 'in_progress',
      'P': 'in_progress',
    };

    return {
      id: f.id,
      gameId: f.id,
      datetime: f.date,
      timestamp: f.timestamp,
      status: statusMap[f.status.short] || f.status.short,
      statusLong: f.status.long,
      elapsed: f.status.elapsed,
      isLive: ['1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(f.status.short),
      homeTeam: teams.home.name,
      homeTeamAbbr: teams.home.name.substring(0, 3).toUpperCase(),
      homeTeamId: teams.home.id,
      homeTeamLogo: teams.home.logo,
      homeWinner: teams.home.winner,
      awayTeam: teams.away.name,
      awayTeamAbbr: teams.away.name.substring(0, 3).toUpperCase(),
      awayTeamId: teams.away.id,
      awayTeamLogo: teams.away.logo,
      awayWinner: teams.away.winner,
      homeScore: goals.home,
      awayScore: goals.away,
      homeScoreHalfTime: score.halftime?.home,
      awayScoreHalfTime: score.halftime?.away,
      homeScoreFullTime: score.fulltime?.home,
      awayScoreFullTime: score.fulltime?.away,
      competition: league.name,
      competitionId: league.id,
      competitionLogo: league.logo,
      country: league.country,
      season: league.season,
      round: league.round,
      venue: f.venue?.name,
      city: f.venue?.city,
      referee: f.referee,
      events: events || [],
      isPremium: this.isPremiumLeague(league.id) || this.isPremiumLeagueByName(league.name),
    };
  },

  formatOdds(oddsData) {
    if (!oddsData) return null;

    const { bookmakers } = oddsData;
    
    const matchWinnerOdds = [];
    const allOdds = [];

    bookmakers.forEach(bookmaker => {
      const matchWinner = bookmaker.bets.find(b => b.id === 1);
      if (matchWinner) {
        const homeOdd = matchWinner.values.find(v => v.value === 'Home');
        const drawOdd = matchWinner.values.find(v => v.value === 'Draw');
        const awayOdd = matchWinner.values.find(v => v.value === 'Away');

        matchWinnerOdds.push({
          sportsbook: bookmaker.name,
          home: homeOdd ? parseFloat(homeOdd.odd) : null,
          draw: drawOdd ? parseFloat(drawOdd.odd) : null,
          away: awayOdd ? parseFloat(awayOdd.odd) : null,
        });

        allOdds.push({
          sportsbook: bookmaker.name,
          bets: bookmaker.bets.map(bet => ({
            id: bet.id,
            name: bet.name,
            values: bet.values.map(v => ({
              value: v.value,
              odd: parseFloat(v.odd)
            }))
          }))
        });
      }
    });

    if (matchWinnerOdds.length === 0) return null;

    const avgHome = matchWinnerOdds.reduce((sum, o) => sum + (o.home || 0), 0) / matchWinnerOdds.filter(o => o.home).length;
    const avgDraw = matchWinnerOdds.reduce((sum, o) => sum + (o.draw || 0), 0) / matchWinnerOdds.filter(o => o.draw).length;
    const avgAway = matchWinnerOdds.reduce((sum, o) => sum + (o.away || 0), 0) / matchWinnerOdds.filter(o => o.away).length;

    const impliedHome = 1 / avgHome;
    const impliedDraw = 1 / avgDraw;
    const impliedAway = 1 / avgAway;
    const total = impliedHome + impliedDraw + impliedAway;
    const homeProb = Math.round((impliedHome / total) * 100);
    const drawProb = Math.round((impliedDraw / total) * 100);
    const awayProb = Math.round((impliedAway / total) * 100);

    let prediction = 'draw';
    if (homeProb > drawProb && homeProb > awayProb) prediction = 'home';
    else if (awayProb > homeProb && awayProb > drawProb) prediction = 'away';

    const confidence = Math.max(homeProb, drawProb, awayProb);

    return {
      home: avgHome.toFixed(2),
      draw: avgDraw.toFixed(2),
      away: avgAway.toFixed(2),
      homeProb,
      drawProb,
      awayProb,
      prediction,
      confidence,
      sportsbookOdds: matchWinnerOdds,
      allBets: allOdds,
      lastUpdate: oddsData.update,
    };
  },

  formatDate(dateStr) {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  },

  formatDateTime(dateStr) {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatTime(dateStr) {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  getDateString(daysFromNow = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  },
};

export default apiFootball;
