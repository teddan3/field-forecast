const SPORTRADAR_API_KEY = 'xMRcLHVmioiUNfEgqFPzASu8uyJPvyoWbnhqmNyI';
const BASE_URL = 'https://api.sportradar.com/soccer/trial/v4/en';

export const PREMIUM_COMPETITIONS = [
  { id: 'sr:competition:7', key: 'UCL', name: 'UEFA Champions League', tier: 1 },
  { id: 'sr:competition:679', key: 'UEL', name: 'UEFA Europa League', tier: 1 },
  { id: 'sr:competition:17', key: 'EPL', name: 'Premier League', tier: 1 },
  { id: 'sr:competition:8', key: 'LaLiga', name: 'La Liga', tier: 1 },
  { id: 'sr:competition:35', key: 'Bundesliga', name: 'Bundesliga', tier: 1 },
  { id: 'sr:competition:23', key: 'SerieA', name: 'Serie A', tier: 1 },
  { id: 'sr:competition:34', key: 'Ligue1', name: 'Ligue 1', tier: 1 },
  { id: 'sr:competition:238', key: 'LigaPortugal', name: 'Liga Portugal', tier: 2 },
  { id: 'sr:competition:202', key: 'Ekstraklasa', name: 'Ekstraklasa', tier: 2 },
  { id: 'sr:competition:384', key: 'Libertadores', name: 'CONMEBOL Libertadores', tier: 1 },
];

export const FREE_COMPETITIONS = [
  { id: 'sr:competition:242', key: 'MLS', name: 'MLS', tier: 3 },
  { id: 'sr:competition:37', key: 'Eredivisie', name: 'Eredivisie', tier: 2 },
  { id: 'sr:competition:155', key: 'PrimeraLPF', name: 'Argentine Primera', tier: 2 },
  { id: 'sr:competition:325', key: 'Brasileirao', name: 'Brasileirão', tier: 2 },
  { id: 'sr:competition:196', key: 'J1League', name: 'J1 League', tier: 2 },
  { id: 'sr:competition:649', key: 'CSL', name: 'Chinese Super League', tier: 3 },
  { id: 'sr:competition:410', key: 'KLeague1', name: 'K League 1', tier: 3 },
  { id: 'sr:competition:36', key: 'ScottishPrem', name: 'Scottish Premiership', tier: 2 },
  { id: 'sr:competition:52', key: 'SuperLig', name: 'Süper Lig', tier: 2 },
  { id: 'sr:competition:955', key: 'SaudiPro', name: 'Saudi Pro League', tier: 2 },
  { id: 'sr:competition:937', key: 'Botola', name: 'Botola Pro', tier: 3 },
  { id: 'sr:competition:19', key: 'FACup', name: 'FA Cup', tier: 2 },
  { id: 'sr:competition:213', key: 'Supercopa', name: 'Supercopa de España', tier: 2 },
  { id: 'sr:competition:131', key: 'EersteDiv', name: 'Eerste Divisie', tier: 3 },
];

const SEASON_CACHE = {};
let ALL_COMPETITIONS = null;

async function fetchFromSportradar(endpoint) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: { 'x-api-key': SPORTRADAR_API_KEY }
    });
    if (!response.ok) {
      console.error('Sportradar API Error:', response.status, response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching from Sportradar:', error);
    return null;
  }
}

async function getCurrentSeason(competitionId) {
  if (SEASON_CACHE[competitionId]) {
    return SEASON_CACHE[competitionId];
  }
  const data = await fetchFromSportradar(`/competitions/${competitionId}/seasons.json`);
  if (data && data.seasons && data.seasons.length > 0) {
    const currentSeason = data.seasons[data.seasons.length - 1];
    SEASON_CACHE[competitionId] = currentSeason.id;
    return currentSeason.id;
  }
  return null;
}

export const sportradarApi = {
  async fetchAllCompetitions() {
    if (ALL_COMPETITIONS) return ALL_COMPETITIONS;
    const data = await fetchFromSportradar('/competitions.json');
    if (!data) return [];
    ALL_COMPETITIONS = data.competitions || [];
    return ALL_COMPETITIONS;
  },

  async getCompetitionsByTier() {
    const all = await this.fetchAllCompetitions();
    return {
      tier1: all.filter(c => {
        const id = c.id;
        return ['sr:competition:7', 'sr:competition:17', 'sr:competition:8', 
                'sr:competition:35', 'sr:competition:23', 'sr:competition:34',
                'sr:competition:679', 'sr:competition:384'].includes(id);
      }),
      tier2: all.filter(c => {
        const id = c.id;
        return !['sr:competition:7', 'sr:competition:17', 'sr:competition:8', 
                'sr:competition:35', 'sr:competition:23', 'sr:competition:34',
                'sr:competition:679', 'sr:competition:384'].includes(id) &&
               ['sr:category:1', 'sr:category:7', 'sr:category:8', 'sr:category:30', 
                'sr:category:31', 'sr:category:32', 'sr:category:33', 'sr:category:35',
                'sr:category:44', 'sr:category:393'].includes(c.category?.id);
      }),
      tier3: all.filter(c => {
        return !['sr:category:1', 'sr:category:7', 'sr:category:8', 'sr:category:30', 
                'sr:category:31', 'sr:category:32', 'sr:category:33', 'sr:category:35',
                'sr:category:44', 'sr:category:393'].includes(c.category?.id);
      }),
    };
  },

  async fetchSeasonSchedule(competitionId) {
    const seasonId = await getCurrentSeason(competitionId);
    if (!seasonId) return [];
    const data = await fetchFromSportradar(`/seasons/${seasonId}/schedules.json`);
    if (!data) return [];
    return data.schedules || [];
  },

  async fetchGamesByCompetition(competitionId) {
    try {
      const games = await this.fetchSeasonSchedule(competitionId);
      return games.map(g => ({
        ...g,
        competitionId,
      }));
    } catch (e) {
      console.error(`Error fetching games for ${competitionId}:`, e);
      return [];
    }
  },

  async fetchAllGames() {
    const premiumIds = PREMIUM_COMPETITIONS.map(c => c.id);
    const freeIds = FREE_COMPETITIONS.map(c => c.id);
    const allIds = [...new Set([...premiumIds, ...freeIds])];
    
    const allGames = [];
    const errors = [];
    
    for (const compId of allIds) {
      try {
        const games = await this.fetchGamesByCompetition(compId);
        if (games.length > 0) {
          allGames.push(...games);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        errors.push({ compId, error: e.message });
      }
    }
    
    return { games: allGames, errors };
  },

  async fetchAllFreeGames() {
    const freeIds = FREE_COMPETITIONS.map(c => c.id);
    const allGames = [];
    
    for (const compId of freeIds) {
      try {
        const games = await this.fetchGamesByCompetition(compId);
        if (games.length > 0) {
          allGames.push(...games);
        }
      } catch (e) {
        console.error(`Error fetching free games for ${compId}:`, e);
      }
    }
    
    return allGames;
  },

  async fetchAllPremiumGames() {
    const premiumIds = PREMIUM_COMPETITIONS.map(c => c.id);
    const allGames = [];
    
    for (const compId of premiumIds) {
      try {
        const games = await this.fetchGamesByCompetition(compId);
        if (games.length > 0) {
          allGames.push(...games);
        }
      } catch (e) {
        console.error(`Error fetching premium games for ${compId}:`, e);
      }
    }
    
    return allGames;
  },

  async fetchMatchDetails(sportEventId) {
    const data = await fetchFromSportradar(`/sport_events/${sportEventId}/summary.json`);
    return data;
  },

  isPremiumCompetition(competitionId) {
    return PREMIUM_COMPETITIONS.some(c => c.id === competitionId);
  },

  isPremiumCompetitionByKey(key) {
    return PREMIUM_COMPETITIONS.some(c => c.key === key);
  },

  getPremiumCompetitions() {
    return PREMIUM_COMPETITIONS;
  },

  getFreeCompetitions() {
    return FREE_COMPETITIONS;
  },

  getAllCompetitionIds() {
    return [...PREMIUM_COMPETITIONS, ...FREE_COMPETITIONS].map(c => c.id);
  },

  getCompetitionById(id) {
    return [...PREMIUM_COMPETITIONS, ...FREE_COMPETITIONS].find(c => c.id === id);
  },

  formatGameData(game) {
    const event = game.sport_event || {};
    const status = game.sport_event_status || {};
    const competitors = event.competitors || [];
    const homeTeam = competitors.find(c => c.qualifier === 'home');
    const awayTeam = competitors.find(c => c.qualifier === 'away');
    const context = event.sport_event_context || {};
    const competition = context.competition || {};
    
    return {
      id: event.id,
      gameId: event.id,
      datetime: event.start_time,
      date: event.start_time,
      status: status.match_status || status.status || 'scheduled',
      isLive: status.status === 'live',
      homeTeam: homeTeam?.name || 'TBD',
      homeTeamAbbr: homeTeam?.abbreviation || 'TBD',
      homeTeamId: homeTeam?.id,
      awayTeam: awayTeam?.name || 'TBD',
      awayTeamAbbr: awayTeam?.abbreviation || 'TBD',
      awayTeamId: awayTeam?.id,
      homeScore: status.home_score,
      awayScore: status.away_score,
      competition: competition.name || 'Unknown',
      competitionId: competition.id,
      competitionAltName: competition.alternative_name,
      season: context.season?.name,
      seasonId: context.season?.id,
      round: context.round?.number,
      roundName: context.round?.name,
      stage: context.stage,
      venue: event.venue?.name,
      city: event.venue?.city_name,
      country: event.venue?.country_name,
      periodScores: status.period_scores,
      winnerId: status.winner_id,
      isPremium: this.isPremiumCompetition(competition.id),
    };
  },

  generateOdds(game) {
    const homeProb = 35 + Math.random() * 25;
    const awayProb = 25 + Math.random() * 25;
    const drawProb = 100 - homeProb - awayProb;

    let prediction = 'draw';
    if (homeProb > awayProb && homeProb > drawProb) prediction = 'home';
    else if (awayProb > homeProb && awayProb > drawProb) prediction = 'away';

    const confidence = Math.round(Math.max(homeProb, awayProb, drawProb));

    const homeOdds = (1.5 + Math.random() * 2.0).toFixed(2);
    const drawOdds = (2.8 + Math.random() * 1.5).toFixed(2);
    const awayOdds = (1.8 + Math.random() * 2.5).toFixed(2);

    const sportsbooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet', 'Bet365', 'Betway'];
    const sportsbookOdds = sportsbooks.map(book => ({
      sportsbook: book,
      home: (parseFloat(homeOdds) + (Math.random() - 0.5) * 0.2).toFixed(2),
      draw: (parseFloat(drawOdds) + (Math.random() - 0.5) * 0.3).toFixed(2),
      away: (parseFloat(awayOdds) + (Math.random() - 0.5) * 0.2).toFixed(2),
    }));

    return {
      home: parseFloat(homeOdds),
      draw: parseFloat(drawOdds),
      away: parseFloat(awayOdds),
      prediction,
      confidence,
      homeProb: Math.round(homeProb),
      drawProb: Math.round(drawProb),
      awayProb: Math.round(awayProb),
      sportsbookOdds,
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

  getDemoFreeGames() {
    const now = new Date();
    return [
      { sport_event: { id: 'demo:1', start_time: new Date(now.getTime() + 3600000).toISOString(), competitors: [{ name: 'LA Galaxy', abbreviation: 'LAG', qualifier: 'home', id: 'demo:h1' }, { name: 'Seattle Sounders', abbreviation: 'SEA', qualifier: 'away', id: 'demo:a1' }], sport_event_context: { competition: { name: 'MLS', id: 'sr:competition:242' } } }, sport_event_status: { status: 'scheduled' } },
      { sport_event: { id: 'demo:2', start_time: new Date(now.getTime() + 7200000).toISOString(), competitors: [{ name: 'Orlando City', abbreviation: 'ORL', qualifier: 'home', id: 'demo:h2' }, { name: 'Inter Miami', abbreviation: 'MIA', qualifier: 'away', id: 'demo:a2' }], sport_event_context: { competition: { name: 'MLS', id: 'sr:competition:242' } } }, sport_event_status: { status: 'scheduled' } },
      { sport_event: { id: 'demo:3', start_time: new Date(now.getTime() + 10800000).toISOString(), competitors: [{ name: 'Ajax', abbreviation: 'AJX', qualifier: 'home', id: 'demo:h3' }, { name: 'PSV Eindhoven', abbreviation: 'PSV', qualifier: 'away', id: 'demo:a3' }], sport_event_context: { competition: { name: 'Eredivisie', id: 'sr:competition:37' } } }, sport_event_status: { status: 'scheduled' } },
      { sport_event: { id: 'demo:4', start_time: new Date(now.getTime() + 14400000).toISOString(), competitors: [{ name: 'Flamengo', abbreviation: 'FLA', qualifier: 'home', id: 'demo:h4' }, { name: 'Palmeiras', abbreviation: 'PAL', qualifier: 'away', id: 'demo:a4' }], sport_event_context: { competition: { name: 'Brasileirão', id: 'sr:competition:325' } } }, sport_event_status: { status: 'scheduled' } },
    ];
  },

  getDemoPremiumGames() {
    const now = new Date();
    return [
      { sport_event: { id: 'demo:p1', start_time: new Date(now.getTime() + 1800000).toISOString(), competitors: [{ name: 'Manchester City', abbreviation: 'MCI', qualifier: 'home', id: 'demo:ph1' }, { name: 'Arsenal', abbreviation: 'ARS', qualifier: 'away', id: 'demo:pa1' }], sport_event_context: { competition: { name: 'Premier League', id: 'sr:competition:17' } } }, sport_event_status: { status: 'scheduled' } },
      { sport_event: { id: 'demo:p2', start_time: new Date(now.getTime() + 5400000).toISOString(), competitors: [{ name: 'Real Madrid', abbreviation: 'RM', qualifier: 'home', id: 'demo:ph2' }, { name: 'Barcelona', abbreviation: 'BAR', qualifier: 'away', id: 'demo:pa2' }], sport_event_context: { competition: { name: 'La Liga', id: 'sr:competition:8' } } }, sport_event_status: { status: 'scheduled' } },
      { sport_event: { id: 'demo:p3', start_time: new Date(now.getTime() + 9000000).toISOString(), competitors: [{ name: 'Bayern Munich', abbreviation: 'BAY', qualifier: 'home', id: 'demo:ph3' }, { name: 'Dortmund', abbreviation: 'DOR', qualifier: 'away', id: 'demo:pa3' }], sport_event_context: { competition: { name: 'Bundesliga', id: 'sr:competition:35' } } }, sport_event_status: { status: 'scheduled' } },
      { sport_event: { id: 'demo:p4', start_time: new Date(now.getTime() + 12600000).toISOString(), competitors: [{ name: 'Inter Milan', abbreviation: 'INT', qualifier: 'home', id: 'demo:ph4' }, { name: 'AC Milan', abbreviation: 'ACM', qualifier: 'away', id: 'demo:pa4' }], sport_event_context: { competition: { name: 'Serie A', id: 'sr:competition:23' } } }, sport_event_status: { status: 'scheduled' } },
    ];
  },
};

export default sportradarApi;
