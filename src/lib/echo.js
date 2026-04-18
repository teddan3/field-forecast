import { useState, useEffect, useCallback } from 'react';

const PUSHER_APP_KEY = 'local';
const PUSHER_CLUSTER = 'mt1';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class EchoService {
  private static instance: EchoService | null = null;
  private pusher: any = null;
  private channels: Map<string, any> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private pollingInterval: NodeJS.Timeout | null = null;
  private pollIntervalMs: number = 30000;

  private constructor() {}

  static getInstance(): EchoService {
    if (!EchoService.instance) {
      EchoService.instance = new EchoService();
    }
    return EchoService.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      if (typeof window !== 'undefined' && window.Pusher) {
        this.pusher = new window.Pusher(PUSHER_APP_KEY, {
          cluster: PUSHER_CLUSTER,
          forceTLS: true,
        });

        this.pusher.connection.bind('connected', () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected', {});
        });

        this.pusher.connection.bind('disconnected', () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.handleReconnect();
        });

        this.pusher.connection.bind('error', (error: any) => {
          console.error('WebSocket error:', error);
          this.startPolling();
        });
      } else {
        console.log('Pusher not available, starting polling fallback');
        this.startPolling();
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      this.startPolling();
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000));
    } else {
      console.log('Max reconnect attempts reached, using polling');
      this.startPolling();
    }
  }

  startPolling(): void {
    if (this.pollingInterval) return;
    
    console.log('Starting polling fallback');
    this.pollingInterval = setInterval(() => {
      this.emit('polling', { timestamp: Date.now() });
    }, this.pollIntervalMs);
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  subscribe(channelName: string): void {
    if (this.channels.has(channelName)) return;

    let channel;
    if (this.pusher) {
      channel = this.pusher.subscribe(channelName);
    }

    this.channels.set(channelName, channel);
    
    if (channel) {
      channel.bind('pusher:subscription_succeeded', () => {
        console.log(`Subscribed to ${channelName}`);
      });

      channel.bind('pusher:subscription_failed', (data: any) => {
        console.error(`Failed to subscribe to ${channelName}:`, data);
      });
    }
  }

    this.listeners.set(channelName, new Set());
  }

  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel && this.pusher) {
      this.pusher.unsubscribe(channelName);
    }
    this.channels.delete(channelName);
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }

    const globalCallbacks = this.listeners.get('*');
    if (globalCallbacks) {
      globalCallbacks.forEach(callback => callback({ event, data }));
    }
  }

  disconnect(): void {
    this.stopPolling();
    if (this.pusher) {
      this.pusher.disconnect();
    }
    this.channels.clear();
    this.isConnected = false;
  }

  getConnectionStatus(): string {
    if (this.isConnected) return 'connected';
    if (this.pollingInterval) return 'polling';
    return 'disconnected';
  }
}

export const echo = EchoService.getInstance();

export function useLiveScores(pollIntervalMs: number = 30000) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const fetchMatches = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-scores`);
      const data = await response.json();
      
      if (data.success) {
        setMatches(data.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch matches');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    echo.connect();
    setConnectionStatus(echo.getConnectionStatus());

    echo.on('connected', () => setConnectionStatus('connected'));
    echo.on('polling', () => setConnectionStatus('polling'));
    echo.on('score_update', (data: any) => {
      console.log('Live score update:', data);
      fetchMatches();
    });

    fetchMatches();

    const interval = setInterval(fetchMatches, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchMatches, pollIntervalMs]);

  return { matches, loading, error, lastUpdate, connectionStatus, refetch: fetchMatches };
}

export function useSubscription(channelName: string, events: string[]) {
  useEffect(() => {
    echo.subscribe(channelName);
    
    events.forEach(event => {
      echo.on(event, (data: any) => {
        console.log(`Event ${event}:`, data);
      });
    });

    return () => {
      events.forEach(event => {
        echo.off(event, () => {});
      });
      echo.unsubscribe(channelName);
    };
  }, [channelName, events]);
}

export default echo;