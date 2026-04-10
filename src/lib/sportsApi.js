const API_KEY = 'd9ea526938474b6a9189d9fc1d6e17a8';
const BASE_URL = 'https://api.api-football.com/v3';

const PREMIUM_LEAGUES = [
  'Premier League',
  'UEFA Champions League',
  'La Liga',
  'Bundesliga',
  'Serie A',
  'Ligue 1',
  'UEFA Europa League',
  'UEFA Euro',
  'World Cup',
  'Copa America',
  'NBA',
  'WNBA',
  'EuroLeague',
];

const PREMIUM_COMPETITIONS = [
  39, // Premier League
  2, // UEFA Champions League
  140, // La Liga
  78, // Bundesliga
  135, // Serie A
  61, // Ligue 1
  3, // UEFA Europa League
];

const PREMIUM_SPORTS = ['football', 'basketball'];

export const sportsApi = {
  async fetchLiveScores() {
    try {
      const response = await fetch(`${BASE_URL}/fixtures?live=all`, {
        headers: { 'x-apisports-key': API_KEY }
      });
      const data = await response.json();
      return data.response || [];
    } catch (error) {
      console.error('Error fetching live scores:', error);
      return [];
    }
  },

  async fetchLeagues(sport = 'football') {
    try {
      const response = await fetch(`${BASE_URL}/leagues?current=true&sport=${sport}`, {
        headers: { 'x-apisports-key': API_KEY }
      });
      const data = await response.json();
      return data.response || [];
    } catch (error) {
      console.error('Error fetching leagues:', error);
      return [];
    }
  },

  async fetchFixtures(leagueId, date = null) {
    try {
      const params = new URLSearchParams({ league: leagueId, season: new Date().getFullYear() });
      if (date) params.append('date', date);
      
      const response = await fetch(`${BASE_URL}/fixtures?${params}`, {
        headers: { 'x-apisports-key': API_KEY }
      });
      const data = await response.json();
      return data.response || [];
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      return [];
    }
  },

  async fetchOdds(fixtureId) {
    try {
      const response = await fetch(`${BASE_URL}/odds?fixture=${fixtureId}`, {
        headers: { 'x-apisports-key': API_KEY }
      });
      const data = await response.json();
      return data.response || [];
    } catch (error) {
      console.error('Error fetching odds:', error);
      return [];
    }
  },

  async fetchMatchDetails(fixtureId) {
    try {
      const response = await fetch(`${BASE_URL}/fixtures?id=${fixtureId}`, {
        headers: { 'x-apisports-key': API_KEY }
      });
      const data = await response.json();
      return data.response?.[0] || null;
    } catch (error) {
      console.error('Error fetching match details:', error);
      return null;
    }
  },

  isPremiumLeague(leagueName) {
    return PREMIUM_LEAGUES.some(pl => 
      leagueName.toLowerCase().includes(pl.toLowerCase())
    );
  },

  isPremiumCompetition(leagueId) {
    return PREMIUM_COMPETITIONS.includes(parseInt(leagueId));
  },

  getPremiumLeagues() {
    return PREMIUM_LEAGUES;
  },

  formatOdds(oddsData) {
    if (!oddsData || oddsData.length === 0) return null;
    
    const latest = oddsData[0];
    const bookmaker = latest.bookmakers?.[0];
    if (!bookmaker) return null;

    const homeOdds = bookmaker.bets?.find(b => b.name === 'Match Winner')?.values?.find(v => v.value === 'Home');
    const drawOdds = bookmaker.bets?.find(b => b.name === 'Match Winner')?.values?.find(v => v.value === 'Draw');
    const awayOdds = bookmaker.bets?.find(b => b.name === 'Match Winner')?.values?.find(v => v.value === 'Away');

    return {
      home: homeOdds ? parseFloat(homeOdds.odd) : null,
      draw: drawOdds ? parseFloat(drawOdds.odd) : null,
      away: awayOdds ? parseFloat(awayOdds.odd) : null,
      bookmaker: bookmaker.name,
      lastUpdate: latest.update,
    };
  },

  calculatePrediction(odds) {
    if (!odds) return { prediction: null, confidence: 0 };
    
    const homeProb = odds.home ? (1 / odds.home) * 100 : 0;
    const drawProb = odds.draw ? (1 / odds.draw) * 100 : 0;
    const awayProb = odds.away ? (1 / odds.away) * 100 : 0;
    
    const total = homeProb + drawProb + awayProb;
    const maxProb = Math.max(homeProb, drawProb, awayProb);
    const confidence = Math.round((maxProb / total) * 100);
    
    let prediction = 'home';
    if (awayProb > homeProb && awayProb > drawProb) prediction = 'away';
    else if (drawProb > homeProb && drawProb > awayProb) prediction = 'draw';
    
    return { prediction, confidence };
  },
};

export const PREMIUM_LEAGUE_IDS = PREMIUM_COMPETITIONS;
export { PREMIUM_LEAGUES };
