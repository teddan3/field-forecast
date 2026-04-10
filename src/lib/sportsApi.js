const SPORTS_DATA_API_KEY = 'xMRcLHVmioiUNfEgqFPzASu8uyJPvyoWbnhqmNyI';
const BASE_URL = 'https://api.sportsdata.io/v4/soccer/scores';

const PREMIUM_COMPETITIONS = ['ELITE', 'CL', 'EPL', 'PL', 'LigueA', 'Bundesliga', 'LaLiga', 'SerieA'];

const PREMIUM_LEAGUES = [
  'UEFA Champions League',
  'Premier League',
  'La Liga',
  'Bundesliga',
  'Serie A',
  'Ligue 1',
  'UEFA Europa League',
];

const FREE_COMPETITIONS = [
  { key: 'MLS', name: 'MLS' },
  { key: 'EL1', name: 'Eredivisie' },
  { key: 'ARG', name: 'Argentine Primera' },
  { key: 'BRA', name: 'Brasileirão' },
  { key: 'JPN', name: 'J1 League' },
  { key: 'MLS', name: 'Canadian Premier League' },
];

const PREMIUM_COMPETITIONS_DATA = [
  { key: 'ELITE', name: 'UEFA Champions League' },
  { key: 'EPL', name: 'Premier League' },
  { key: 'LaLiga', name: 'La Liga' },
  { key: 'Bundesliga', name: 'Bundesliga' },
  { key: 'SerieA', name: 'Serie A' },
  { key: 'LigueA', name: 'Ligue 1' },
];

export const sportsApi = {
  async fetchGamesByDate(competition, date) {
    try {
      const url = `${BASE_URL}/JSON/GamesByDate/${competition}/${date}`;
      const response = await fetch(url, {
        headers: { 'Ocp-Apim-Subscription-Key': SPORTS_DATA_API_KEY }
      });
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching games:', error);
      return [];
    }
  },

  async fetchCompetitions() {
    try {
      const response = await fetch(`${BASE_URL}/JSON/Competitions`, {
        headers: { 'Ocp-Apim-Subscription-Key': SPORTS_DATA_API_KEY }
      });
      if (!response.ok) throw new Error('API error');
      return await response.json();
    } catch (error) {
      console.error('Error fetching competitions:', error);
      return [];
    }
  },

  async fetchAllFreeGames(date) {
    const allGames = [];
    const freeComps = ['MLS', 'EL1', 'ARG', 'BRA', 'JPN'];
    
    for (const comp of freeComps) {
      try {
        const games = await this.fetchGamesByDate(comp, date);
        if (games.length > 0) {
          allGames.push(...games.map(g => ({ ...g, competitionKey: comp })));
        }
      } catch (e) {
        console.error(`Error fetching ${comp}:`, e);
      }
    }
    
    return allGames;
  },

  async fetchAllPremiumGames(date) {
    const allGames = [];
    const premComps = ['ELITE', 'EPL', 'LaLiga', 'Bundesliga', 'SerieA', 'LigueA'];
    
    for (const comp of premComps) {
      try {
        const games = await this.fetchGamesByDate(comp, date);
        if (games.length > 0) {
          allGames.push(...games.map(g => ({ ...g, competitionKey: comp })));
        }
      } catch (e) {
        console.error(`Error fetching ${comp}:`, e);
      }
    }
    
    return allGames;
  },

  isPremiumCompetition(competitionKey) {
    const key = competitionKey?.toUpperCase() || '';
    return PREMIUM_COMPETITIONS.some(c => key.includes(c));
  },

  isPremiumLeague(leagueName) {
    const name = leagueName?.toUpperCase() || '';
    return PREMIUM_LEAGUES.some(l => name.toUpperCase().includes(l.toUpperCase()));
  },

  getPremiumCompetitions() {
    return PREMIUM_COMPETITIONS_DATA;
  },

  getFreeCompetitions() {
    return FREE_COMPETITIONS;
  },

  formatGameData(game) {
    return {
      gameId: game.GameId || game.gameId,
      date: game.DateTime || game.Date || game.date,
      datetime: game.DateTimeUTC,
      status: game.Status || 'Scheduled',
      homeTeam: game.HomeTeamName || game.HomeTeam || game.homeTeam,
      awayTeam: game.AwayTeamName || game.AwayTeam || game.awayTeam,
      homeScore: game.HomeTeamScore,
      awayScore: game.AwayTeamScore,
      competition: game.Competition || game.League || game.competition,
      competitionId: game.CompetitionId,
      season: game.Season,
      week: game.Week,
      venue: game.Venue,
      period: game.Period,
      clock: game.Clock,
      isPremium: this.isPremiumCompetition(game.Competition),
    };
  },

  calculatePrediction() {
    const homeProb = 35 + Math.random() * 20;
    const awayProb = 25 + Math.random() * 15;
    const drawProb = 100 - homeProb - awayProb;

    let prediction = 'draw';
    if (homeProb > awayProb && homeProb > drawProb) prediction = 'home';
    else if (awayProb > homeProb && awayProb > drawProb) prediction = 'away';

    const confidence = Math.round(Math.max(homeProb, awayProb, drawProb));
    return { prediction, confidence };
  },

  generateOdds(game) {
    const { prediction, confidence } = this.calculatePrediction();
    
    const homeOdds = (1.8 + Math.random() * 1.2).toFixed(2);
    const drawOdds = (3.0 + Math.random() * 1.0).toFixed(2);
    const awayOdds = (2.0 + Math.random() * 2.0).toFixed(2);

    return {
      home: parseFloat(homeOdds),
      draw: parseFloat(drawOdds),
      away: parseFloat(awayOdds),
      prediction,
      confidence,
      lastUpdate: new Date().toISOString(),
    };
  },

  formatDate(dateStr) {
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

  getDateString(daysFromNow = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  },

  getDemoFreeGames() {
    return [
      { gameId: 1, homeTeam: 'LA Galaxy', awayTeam: 'Seattle Sounders', competition: 'MLS', DateTime: new Date().toISOString(), Status: 'Scheduled' },
      { gameId: 2, homeTeam: 'Orlando City', awayTeam: 'Inter Miami', competition: 'MLS', DateTime: new Date().toISOString(), Status: 'Scheduled' },
      { gameId: 3, homeTeam: 'Ajax', awayTeam: 'PSV Eindhoven', competition: 'Eredivisie', DateTime: new Date().toISOString(), Status: 'Scheduled' },
      { gameId: 4, homeTeam: 'Porto', awayTeam: 'Benfica', competition: 'Primeira Liga', DateTime: new Date().toISOString(), Status: 'Scheduled' },
      { gameId: 5, homeTeam: 'Flamengo', awayTeam: 'Palmeiras', competition: 'Brasileirão', DateTime: new Date().toISOString(), Status: 'Scheduled' },
      { gameId: 6, homeTeam: 'Yokohama F. Marinos', awayTeam: 'Kawasaki Frontale', competition: 'J1 League', DateTime: new Date().toISOString(), Status: 'Scheduled' },
    ];
  },

  getDemoPremiumGames() {
    return [
      { gameId: 101, homeTeam: 'Real Madrid', awayTeam: 'Bayern Munich', competition: 'UEFA Champions League', DateTime: new Date().toISOString(), Status: 'Scheduled' },
      { gameId: 102, homeTeam: 'Manchester City', awayTeam: 'Arsenal', competition: 'Premier League', DateTime: new Date().toISOString(), Status: 'Scheduled' },
      { gameId: 103, homeTeam: 'Barcelona', awayTeam: 'Atlético Madrid', competition: 'La Liga', DateTime: new Date().toISOString(), Status: 'Scheduled' },
      { gameId: 104, homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', competition: 'Bundesliga', DateTime: new Date().toISOString(), Status: 'Scheduled' },
      { gameId: 105, homeTeam: 'Inter Milan', awayTeam: 'AC Milan', competition: 'Serie A', DateTime: new Date().toISOString(), Status: 'Scheduled' },
      { gameId: 106, homeTeam: 'PSG', awayTeam: 'Marseille', competition: 'Ligue 1', DateTime: new Date().toISOString(), Status: 'Scheduled' },
    ];
  },
};

export { PREMIUM_LEAGUES, PREMIUM_COMPETITIONS };
export default sportsApi;
