// NOTE: This key is currently hardcoded for demo purposes. Prefer using environment variables
// (e.g. process.env.REACT_APP_API_FOOTBALL_KEY) for production and CI.
export const API_FOOTBALL_KEY = 'd9ea526938474b6a9189d9fc1d6e17a8';
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
    if (data.results === 0) {
      console.log('API-Football: No results found');
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

  async fetchFixturesByLeague(leagueId, season = 2025) {
    const data = await fetchFromApiFootball(`/fixtures?date=${this.getDateString()}&timezone=America/New_York`);
    if (!data || !data.response) return [];
    return data.response.filter(f => f.league.id === leagueId);
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

  getDemoFixtures() {
    const now = new Date();
    return [
      {
        fixture: {
          id: 'demo-1',
          date: new Date(now.getTime() + 3600000).toISOString(),
          status: { long: 'Not Started', short: 'NS', elapsed: null },
          venue: { name: 'Anfield', city: 'Liverpool' },
          referee: null,
        },
        league: { id: 39, name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png', season: 2025, round: 'Matchday 32' },
        teams: { home: { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png', winner: null }, away: { id: 42, name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png', winner: null } },
        goals: { home: null, away: null },
        score: { halftime: { home: null, away: null }, fulltime: { home: null, away: null } },
      },
      {
        fixture: {
          id: 'demo-2',
          date: new Date(now.getTime() + 7200000).toISOString(),
          status: { long: 'First Half', short: '1H', elapsed: 25, extra: null },
          venue: { name: 'Santiago Bernabéu', city: 'Madrid' },
          referee: null,
        },
        league: { id: 140, name: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png', season: 2025, round: 'Matchday 30' },
        teams: { home: { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png', winner: null }, away: { id: 529, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png', winner: null } },
        goals: { home: 1, away: 1 },
        score: { halftime: { home: 1, away: 0 }, fulltime: { home: null, away: null } },
      },
      {
        fixture: {
          id: 'demo-3',
          date: new Date(now.getTime() + 10800000).toISOString(),
          status: { long: 'Match Finished', short: 'FT', elapsed: 90, extra: null },
          venue: { name: 'Allianz Arena', city: 'Munich' },
          referee: null,
        },
        league: { id: 78, name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png', season: 2025, round: 'Matchday 28' },
        teams: { home: { id: 157, name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png', winner: true }, away: { id: 165, name: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png', winner: false } },
        goals: { home: 3, away: 1 },
        score: { halftime: { home: 1, away: 1 }, fulltime: { home: 3, away: 1 } },
      },
      {
        fixture: {
          id: 'demo-4',
          date: new Date(now.getTime() + 14400000).toISOString(),
          status: { long: 'Not Started', short: 'NS', elapsed: null },
          venue: { name: 'San Siro', city: 'Milan' },
          referee: null,
        },
        league: { id: 135, name: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png', season: 2025, round: 'Matchday 32' },
        teams: { home: { id: 505, name: 'Inter Milan', logo: 'https://media.api-sports.io/football/teams/505.png', winner: null }, away: { id: 487, name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/487.png', winner: null } },
        goals: { home: null, away: null },
        score: { halftime: { home: null, away: null }, fulltime: { home: null, away: null } },
      },
      {
        fixture: {
          id: 'demo-5',
          date: new Date(now.getTime() + 18000000).toISOString(),
          status: { long: 'Match Finished', short: 'FT', elapsed: 90, extra: null },
          venue: { name: 'Rose Bowl', city: 'Los Angeles' },
          referee: null,
        },
        league: { id: 253, name: 'MLS', country: 'USA', logo: 'https://media.api-sports.io/football/leagues/253.png', season: 2026, round: 'Regular Season' },
        teams: { home: { id: 4344, name: 'LA Galaxy', logo: 'https://media.api-sports.io/football/teams/4344.png', winner: true }, away: { id: 4350, name: 'Seattle Sounders', logo: 'https://media.api-sports.io/football/teams/4350.png', winner: false } },
        goals: { home: 2, away: 0 },
        score: { halftime: { home: 1, away: 0 }, fulltime: { home: 2, away: 0 } },
      },
    ];
  },

  getDemoOdds() {
    return {
      home: 1.85,
      draw: 3.50,
      away: 4.20,
      homeProb: 51,
      drawProb: 27,
      awayProb: 22,
      prediction: 'home',
      confidence: 51,
      sportsbookOdds: [
        { sportsbook: 'Bet365', home: 1.85, draw: 3.60, away: 4.00 },
        { sportsbook: 'Betfair', home: 1.83, draw: 3.50, away: 4.20 },
        { sportsbook: 'William Hill', home: 1.88, draw: 3.40, away: 4.25 },
        { sportsbook: 'Unibet', home: 1.85, draw: 3.55, away: 4.10 },
        { sportsbook: 'Pinnacle', home: 1.86, draw: 3.58, away: 4.18 },
      ],
      lastUpdate: new Date().toISOString(),
    };
  },
};

export default apiFootball;
