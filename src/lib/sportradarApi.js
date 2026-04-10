const SPORTRADAR_API_KEY = 'xMRcLHVmioiUNfEgqFPzASu8uyJPvyoWbnhqmNyI';
const BASE_URL = 'https://api.sportradar.com/soccer/trial/v4/en';

const PREMIUM_COMPETITIONS = [
  { id: 'sr:competition:7', key: 'ELITE', name: 'UEFA Champions League' },
  { id: 'sr:competition:17', key: 'EPL', name: 'Premier League' },
  { id: 'sr:competition:8', key: 'LaLiga', name: 'La Liga' },
  { id: 'sr:competition:35', key: 'Bundesliga', name: 'Bundesliga' },
  { id: 'sr:competition:23', key: 'SerieA', name: 'Serie A' },
  { id: 'sr:competition:34', key: 'LigueA', name: 'Ligue 1' },
  { id: 'sr:competition:679', key: 'EL', name: 'UEFA Europa League' },
];

const FREE_COMPETITIONS = [
  { id: 'sr:competition:242', key: 'MLS', name: 'MLS' },
  { id: 'sr:competition:37', key: 'EL1', name: 'Eredivisie' },
  { id: 'sr:competition:155', key: 'ARG', name: 'Argentine Primera' },
  { id: 'sr:competition:325', key: 'BRA', name: 'Brasileirão' },
  { id: 'sr:competition:196', key: 'JPN', name: 'J1 League' },
];

const SEASON_CACHE = {};

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
  async fetchCompetitions() {
    const data = await fetchFromSportradar('/competitions.json');
    if (!data) return [];
    return data.competitions || [];
  },

  async fetchSeasonSchedule(competitionId) {
    const seasonId = await getCurrentSeason(competitionId);
    if (!seasonId) return [];
    const data = await fetchFromSportradar(`/seasons/${seasonId}/schedules.json`);
    if (!data) return [];
    return data.schedules || [];
  },

  async fetchAllFreeGames() {
    const allGames = [];
    for (const comp of FREE_COMPETITIONS) {
      try {
        const games = await this.fetchSeasonSchedule(comp.id);
        if (games.length > 0) {
          allGames.push(...games.map(g => ({
            ...g,
            competitionKey: comp.key,
            competitionName: comp.name
          })));
        }
      } catch (e) {
        console.error(`Error fetching ${comp.name}:`, e);
      }
    }
    return allGames;
  },

  async fetchAllPremiumGames() {
    const allGames = [];
    for (const comp of PREMIUM_COMPETITIONS) {
      try {
        const games = await this.fetchSeasonSchedule(comp.id);
        if (games.length > 0) {
          allGames.push(...games.map(g => ({
            ...g,
            competitionKey: comp.key,
            competitionName: comp.name
          })));
        }
      } catch (e) {
        console.error(`Error fetching ${comp.name}:`, e);
      }
    }
    return allGames;
  },

  async fetchUpcomingMatches(daysAhead = 7) {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + daysAhead);
    
    const allGames = [...(await this.fetchAllFreeGames()), ...(await this.fetchAllPremiumGames())];
    
    return allGames.filter(game => {
      const gameDate = new Date(game.sport_event?.start_time);
      return gameDate >= today && gameDate <= endDate;
    }).sort((a, b) => 
      new Date(a.sport_event?.start_time) - new Date(b.sport_event?.start_time)
    );
  },

  async fetchLiveMatches() {
    const allGames = [...(await this.fetchAllFreeGames()), ...(await this.fetchAllPremiumGames())];
    return allGames.filter(game => 
      game.sport_event_status?.status === 'live' || 
      game.sport_event_status?.match_status === 'inprogress'
    );
  },

  isPremiumCompetition(competitionKey) {
    return PREMIUM_COMPETITIONS.some(c => c.key === competitionKey);
  },

  isPremiumCompetitionById(competitionId) {
    return PREMIUM_COMPETITIONS.some(c => c.id === competitionId);
  },

  getPremiumCompetitions() {
    return PREMIUM_COMPETITIONS;
  },

  getFreeCompetitions() {
    return FREE_COMPETITIONS;
  },

  formatGameData(game) {
    const event = game.sport_event || {};
    const status = game.sport_event_status || {};
    const competitors = event.competitors || [];
    const homeTeam = competitors.find(c => c.qualifier === 'home');
    const awayTeam = competitors.find(c => c.qualifier === 'away');
    const context = event.sport_event_context || {};
    const competition = context.competition || {};
    const season = context.season || {};
    
    return {
      id: event.id,
      gameId: event.id,
      datetime: event.start_time,
      date: event.start_time,
      status: status.match_status || status.status || 'scheduled',
      isLive: status.status === 'live',
      homeTeam: homeTeam?.name || 'TBD',
      homeTeamAbbr: homeTeam?.abbreviation || 'TBD',
      awayTeam: awayTeam?.name || 'TBD',
      awayTeamAbbr: awayTeam?.abbreviation || 'TBD',
      homeScore: status.home_score,
      awayScore: status.away_score,
      competition: competition.name || 'Unknown',
      competitionId: competition.id,
      competitionKey: game.competitionKey,
      season: season.name,
      round: context.round?.number,
      venue: event.venue?.name,
      city: event.venue?.city_name,
      periodScores: status.period_scores,
      winnerId: status.winner_id,
      isPremium: this.isPremiumCompetition(game.competitionKey),
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

    const sportsbooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet'];
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
      { sport_event: { id: 1, start_time: new Date(now.getTime() + 3600000).toISOString(), competitors: [{ name: 'LA Galaxy', abbreviation: 'LAG', qualifier: 'home' }, { name: 'Seattle Sounders', abbreviation: 'SEA', qualifier: 'away' }], sport_event_context: { competition: { name: 'MLS', id: 'sr:competition:242' } } }, sport_event_status: { status: 'scheduled' }, competitionKey: 'MLS', competitionName: 'MLS' },
      { sport_event: { id: 2, start_time: new Date(now.getTime() + 7200000).toISOString(), competitors: [{ name: 'Orlando City', abbreviation: 'ORL', qualifier: 'home' }, { name: 'Inter Miami', abbreviation: 'MIA', qualifier: 'away' }], sport_event_context: { competition: { name: 'MLS', id: 'sr:competition:242' } } }, sport_event_status: { status: 'scheduled' }, competitionKey: 'MLS', competitionName: 'MLS' },
      { sport_event: { id: 3, start_time: new Date(now.getTime() + 10800000).toISOString(), competitors: [{ name: 'Ajax', abbreviation: 'AJX', qualifier: 'home' }, { name: 'PSV Eindhoven', abbreviation: 'PSV', qualifier: 'away' }], sport_event_context: { competition: { name: 'Eredivisie', id: 'sr:competition:37' } } }, sport_event_status: { status: 'scheduled' }, competitionKey: 'EL1', competitionName: 'Eredivisie' },
      { sport_event: { id: 4, start_time: new Date(now.getTime() + 14400000).toISOString(), competitors: [{ name: 'Flamengo', abbreviation: 'FLA', qualifier: 'home' }, { name: 'Palmeiras', abbreviation: 'PAL', qualifier: 'away' }], sport_event_context: { competition: { name: 'Brasileirão', id: 'sr:competition:325' } } }, sport_event_status: { status: 'scheduled' }, competitionKey: 'BRA', competitionName: 'Brasileirão' },
    ];
  },

  getDemoPremiumGames() {
    const now = new Date();
    return [
      { sport_event: { id: 101, start_time: new Date(now.getTime() + 1800000).toISOString(), competitors: [{ name: 'Manchester City', abbreviation: 'MCI', qualifier: 'home' }, { name: 'Arsenal', abbreviation: 'ARS', qualifier: 'away' }], sport_event_context: { competition: { name: 'Premier League', id: 'sr:competition:17' } } }, sport_event_status: { status: 'scheduled' }, competitionKey: 'EPL', competitionName: 'Premier League' },
      { sport_event: { id: 102, start_time: new Date(now.getTime() + 5400000).toISOString(), competitors: [{ name: 'Real Madrid', abbreviation: 'RM', qualifier: 'home' }, { name: 'Barcelona', abbreviation: 'BAR', qualifier: 'away' }], sport_event_context: { competition: { name: 'La Liga', id: 'sr:competition:8' } } }, sport_event_status: { status: 'scheduled' }, competitionKey: 'LaLiga', competitionName: 'La Liga' },
      { sport_event: { id: 103, start_time: new Date(now.getTime() + 9000000).toISOString(), competitors: [{ name: 'Bayern Munich', abbreviation: 'BAY', qualifier: 'home' }, { name: 'Dortmund', abbreviation: 'DOR', qualifier: 'away' }], sport_event_context: { competition: { name: 'Bundesliga', id: 'sr:competition:35' } } }, sport_event_status: { status: 'scheduled' }, competitionKey: 'Bundesliga', competitionName: 'Bundesliga' },
      { sport_event: { id: 104, start_time: new Date(now.getTime() + 12600000).toISOString(), competitors: [{ name: 'Inter Milan', abbreviation: 'INT', qualifier: 'home' }, { name: 'AC Milan', abbreviation: 'ACM', qualifier: 'away' }], sport_event_context: { competition: { name: 'Serie A', id: 'sr:competition:23' } } }, sport_event_status: { status: 'scheduled' }, competitionKey: 'SerieA', competitionName: 'Serie A' },
    ];
  },
};

export { PREMIUM_COMPETITIONS, FREE_COMPETITIONS };
export default sportradarApi;
