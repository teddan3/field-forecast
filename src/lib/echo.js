import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || (typeof window !== 'undefined' && window.PUSHER_APP_KEY) || '';
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || (typeof window !== 'undefined' && window.PUSHER_CLUSTER) || 'mt1';

class EchoService {
  static instance = null;
  pusher = null;
  channels = new Map();
  listeners = new Map();
  isConnected = false;
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;
  pollingInterval = null;
  pollIntervalMs = 30000;

  constructor() {}

  static getInstance() {
    if (!EchoService.instance) EchoService.instance = new EchoService();
    return EchoService.instance;
  }

  async connect() {
    if (this.isConnected) return;
    try {
      if (typeof window !== 'undefined' && window.Pusher) {
        this.pusher = new window.Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, forceTLS: true });
      } else {
        // dynamic import if not available globally
        const Pusher = (await import('pusher-js')).default;
        this.pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, forceTLS: true });
      }

      this.pusher.connection.bind('connected', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected', {});
      });

      this.pusher.connection.bind('disconnected', () => {
        this.isConnected = false;
        this.handleReconnect();
      });

      this.pusher.connection.bind('error', (err) => { console.error('Pusher error', err); this.startPolling(); });
    } catch (e) {
      console.error('Failed to init pusher', e);
      this.startPolling();
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000));
    } else {
      this.startPolling();
    }
  }

  startPolling() {
    if (this.pollingInterval) return;
    this.pollingInterval = setInterval(() => this.emit('polling', { timestamp: Date.now() }), this.pollIntervalMs);
  }

  stopPolling() { if (this.pollingInterval) { clearInterval(this.pollingInterval); this.pollingInterval = null; } }

  subscribe(channelName) {
    if (this.channels.has(channelName)) return;
    let channel = null;
    if (this.pusher) channel = this.pusher.subscribe(channelName);
    this.channels.set(channelName, channel);
    if (channel) {
      channel.bind('pusher:subscription_succeeded', () => console.log(`Subscribed ${channelName}`));
      channel.bind('pusher:subscription_error', (d) => console.error('sub err', d));
      channel.bind_global && channel.bind_global((event, data) => this.emit(event, data));
    }
    if (!this.listeners.has(channelName)) this.listeners.set(channelName, new Set());
  }

  unsubscribe(channelName) {
    if (this.pusher && this.channels.has(channelName)) this.pusher.unsubscribe(channelName);
    this.channels.delete(channelName);
  }

  on(event, cb) { if (!this.listeners.has(event)) this.listeners.set(event, new Set()); this.listeners.get(event).add(cb); }
  off(event, cb) { if (this.listeners.has(event)) this.listeners.get(event).delete(cb); }

  emit(event, data) {
    if (this.listeners.has(event)) this.listeners.get(event).forEach(cb => cb(data));
    if (this.listeners.has('*')) this.listeners.get('*').forEach(cb => cb({ event, data }));
  }

  disconnect() { this.stopPolling(); if (this.pusher) this.pusher.disconnect(); this.channels.clear(); this.isConnected = false; }
  getConnectionStatus() { if (this.isConnected) return 'connected'; if (this.pollingInterval) return 'polling'; return 'disconnected'; }
}

export const echo = EchoService.getInstance();

export function useLiveScores(pollIntervalMs = 30000) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const fetchMatches = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-scores`);
      const data = await response.json();
      if (data) { setMatches(data.data ?? data); setLastUpdate(new Date()); setError(null); }
    } catch (err) { setError(err.message || 'Network error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    echo.connect();
    setConnectionStatus(echo.getConnectionStatus());
    echo.on('connected', () => setConnectionStatus('connected'));
    echo.on('polling', () => setConnectionStatus('polling'));
    echo.on('score_update', (data) => { fetchMatches(); });
    fetchMatches();
    const interval = setInterval(fetchMatches, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchMatches, pollIntervalMs]);

  return { matches, loading, error, lastUpdate, connectionStatus, refetch: fetchMatches };
}

export function useSubscription(channelName, events) {
  useEffect(() => {
    echo.subscribe(channelName);
    events.forEach(ev => echo.on(ev, (data) => console.log(`Event ${ev}:`, data)));
    return () => { events.forEach(ev => echo.off(ev, () => {})); echo.unsubscribe(channelName); };
  }, [channelName, events]);

export default echo;
