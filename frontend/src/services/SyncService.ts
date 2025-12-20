import { Passenger } from '../api/passengers';

export interface SyncEvent {
  type: 'PASSENGER_UPDATED' | 'PASSENGER_ADDED' | 'PASSENGER_DELETED';
  payload: any;
}

type SyncListener = (event: SyncEvent) => void;

class SyncService {
  private ws: WebSocket | null = null;
  private listeners: SyncListener[] = [];
  private offlineQueue: Passenger[] = [];
  private reconnectInterval: any = null;

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.ws = new WebSocket('ws://localhost:3000');

    this.ws.onopen = () => {
      console.log('WS Connected');
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
      this.processOfflineQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (['PASSENGER_UPDATED', 'PASSENGER_ADDED', 'PASSENGER_DELETED'].includes(data.type)) {
            this.notifyListeners(data);
        }
      } catch (e) {
        console.error('WS message parse error', e);
      }
    };

    this.ws.onclose = () => {
      console.log('WS Disconnected, attempting reconnect...');
      this.scheduleReconnect();
    };
    
    this.ws.onerror = (err) => {
        console.error('WS Error', err);
    };
  }

  subscribe(listener: SyncListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(event: SyncEvent) {
    this.listeners.forEach(l => l(event));
  }

  private scheduleReconnect() {
    if (!this.reconnectInterval) {
      this.reconnectInterval = setInterval(() => {
        this.connect();
      }, 3000);
    }
  }
  
  // Optional: If we were sending via WS directly
  // sendUpdate(passenger: Passenger) { ... }

  private processOfflineQueue() {
    // Implement if using WS for upstream
  }
}

export const syncService = new SyncService();
