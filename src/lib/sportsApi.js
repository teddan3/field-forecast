const SPORTS_DATA_API_KEY = 'd9ea526938474b6a9189d9fc1d6e17a8';
const BASE_URL = 'https://api.sportsdata.io/v4/soccer/scores';

const PREMIUM_COMPETITIONS = ['ELITE', 'CL', 'EPL', 'PL', 'LigueA', 'Bundesliga', 'LaLiga', 'SerieA'];
const FREE_COMPETITIONS = ['MLS', 'EL1', 'EL2', 'EC', 'PPL'];

const PREMIUM_LEAGUES = [
  'UEFA Champions League',
  'Premier League',
  'La Liga',
  'Bundesliga',
  'Serie A',
  'Ligue 1',
  'UEFA Europa League',
];

export const sportsApi = {
  async fetchGamesByDate(competition, date) {
    try {
      const url = `${BASE_URL}/JSON/GamesByDate/${competition}/${date}`;
      const response = await fetch(url, {
        headers: { 'Ocp-Apim-Subscription-Key': SPORTS_DATA_API_KEY }
      });
      if (!response.ok) throw new Error('API error');
      return await response.json();
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

  async fetchScoresBasic(competition, date) {
    try {
      const response = await fetch(`${BASE_URL}/JSON/ScoresBasic/${competition}/${date}`, {
        headers: { 'Ocp-Apim-Subscription-Key': SPORTS_DATA_API_KEY }
      });
      if (!response.ok) throw new Error('API error');
      return await response.json();
    } catch (error) {
      console.error('Error fetching scores:', error);
      return [];
    }
  },

  async fetchStandings(competition, season) {
    try {
      const response = await fetch(`${BASE_URL}/JSON/Standings/${competition}/${season}`, {
        headers: { 'Ocp-Apim-Subscription-Key': SPORTS_DATA_API_KEY }
      });
      if (!response.ok) throw new Error('API error');
      return await response.json();
    } catch (error) {
      console.error('Error fetching standings:', error);
      return [];
    }
  },

  async fetchTeams(competition) {
    try {
      const response = await fetch(`${BASE_URL}/JSON/Teams/${competition}`, {
        headers: { 'Ocp-Apim-Subscription-Key': SPORTS_DATA_API_KEY }
      });
      if (!response.ok) throw new Error('API error');
      return await response.json();
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
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
    return PREMIUM_COMPETITIONS;
  },

  getFreeCompetitions() {
    return FREE_COMPETITIONS;
  },

  formatGameData(games) {
    if (!Array.isArray(games)) return [];
    return games.map(game => ({
      gameId: game.GameId,
      date: game.DateTime || game.Date,
      datetime: game.DateTimeUTC,
      status: game.Status,
      homeTeam: game.HomeTeamName || game.HomeTeam,
      awayTeam: game.AwayTeamName || game.AwayTeam,
      homeScore: game.HomeTeamScore,
      awayScore: game.AwayTeamScore,
      competition: game.Competition || game.League,
      competitionId: game.CompetitionId,
      season: game.Season,
      week: game.Week,
      venue: game.Venue,
      homeRotationNumber: game.HomeRotationNumber,
      awayRotationNumber: game.AwayRotationNumber,
      period: game.Period,
      clock: game.Clock,
      awayTeamScore2H: game.AwayTeamScoreSecondHalf,
      homeTeamScore2H: game.HomeTeamScoreSecondHalf,
      isPremium: this.isPremiumCompetition(game.Competition),
    }));
  },

  calculatePrediction(game) {
    if (!game.homeTeam || !game.awayTeam) return { prediction: null, confidence: 0 };
    
    const homeAdvantage = game.homeScore !== null ? 35 : 30;
    const randomFactor = Math.random() * 20;
    const homeWinProb = homeAdvantage + randomFactor;
    const awayWinProb = 25 + (Math.random() * 15);
    const drawProb = 100 - homeWinProb - awayWinProb;

    let prediction = 'draw';
    if (homeWinProb > awayWinProb && homeWinProb > drawProb) prediction = 'home';
    else if (awayWinProb > homeWinProb && awayWinProb > drawProb) prediction = 'away';

    const confidence = Math.round(Math.max(homeWinProb, awayWinProb, drawProb));

    return { prediction, confidence };
  },

  generateOdds(game) {
    const { prediction, confidence } = this.calculatePrediction(game);
    
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
};

export const PREMIUM_LEAGUES = PREMIUM_LEAGUES;
export { PREMIUM_COMPETITIONS, FREE_COMPETITIONS };
export default sportsApi;
