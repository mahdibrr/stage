import { Centrifuge, Subscription } from 'centrifuge';
import { getCentrifugoToken, getCurrentUser } from './authService';
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
export interface DeliveryUpdate {
  deliveryId: string;
  status: string;
  location?: {
    lat: number;
    lng: number;
  };
  message?: string;
  timestamp: string;
}
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'location';
}
export interface NotificationMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}
class CentrifugoService {
  private centrifuge: Centrifuge | null = null;
  private subscriptions: Map<string, Subscription> = new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private statusCallbacks: Set<(status: ConnectionStatus) => void> = new Set();
  private deliveryCallbacks: Set<(data: DeliveryUpdate) => void> = new Set();
  private chatCallbacks: Set<(data: ChatMessage) => void> = new Set();
  private notificationCallbacks: Set<(data: NotificationMessage) => void> = new Set();
  private readonly config = {
    url: 'ws://localhost:8000/connection/websocket',
    debug: process.env.NODE_ENV === 'development',
    maxReconnectDelay: 30000,
    minReconnectDelay: 1000,
  };
  constructor() {
    console.log('🔄 Centrifugo service initialized');
  }
  async connect(): Promise<void> {
    if (this.centrifuge?.state === 'connected') {
      console.log('ℹ️ Already connected to Centrifugo');
      return;
    }
    const token = getCentrifugoToken();
    const user = getCurrentUser();
    if (!token || !user) {
      console.warn('⚠️ No Centrifugo token or user found');
      this.updateConnectionStatus('error');
      return;
    }
    try {
      this.updateConnectionStatus('connecting');
      this.centrifuge = new Centrifuge(this.config.url, {
        token,
        debug: this.config.debug,
        maxReconnectDelay: this.config.maxReconnectDelay,
        minReconnectDelay: this.config.minReconnectDelay,
      });
      this.setupEventHandlers();
      this.centrifuge.connect();
      console.log('🔄 Connecting to Centrifugo...');
    } catch (error) {
      console.error('❌ Failed to connect to Centrifugo:', error);
      this.updateConnectionStatus('error');
    }
  }
  disconnect(): void {
    if (this.centrifuge) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions.clear();
      this.centrifuge.disconnect();
      this.centrifuge = null;
    }
    this.updateConnectionStatus('disconnected');
    console.log('🔌 Disconnected from Centrifugo');
  }
  private setupEventHandlers(): void {
    if (!this.centrifuge) return;
    this.centrifuge.on('connected', () => {
      console.log('✅ Connected to Centrifugo');
      this.updateConnectionStatus('connected');
      this.subscribeToUserChannels();
    });
    this.centrifuge.on('disconnected', () => {
      console.log('🔌 Disconnected from Centrifugo');
      this.updateConnectionStatus('disconnected');
    });
    this.centrifuge.on('error', (error) => {
      console.error('❌ Centrifugo error:', error);
      this.updateConnectionStatus('error');
    });
  }
  private async subscribeToUserChannels(): Promise<void> {
    const user = getCurrentUser();
    if (!user || !this.centrifuge) return;
    try {
      const userChannel = `user:${user.id}`;
      await this.subscribeToChannel(userChannel, (data) => {
        this.handleUserChannelMessage(data);
      });
      const roleChannel = `role:${user.role}`;
      await this.subscribeToChannel(roleChannel, (data) => {
        this.handleRoleChannelMessage(data);
      });
      console.log(`✅ Subscribed to channels for user ${user.username}`);
    } catch (error) {
      console.error('❌ Failed to subscribe to user channels:', error);
    }
  }
  private async subscribeToChannel(channel: string, callback: (data: any) => void): Promise<void> {
    if (!this.centrifuge) return;
    try {
      const subscription = this.centrifuge.newSubscription(channel);
      subscription.on('publication', (ctx) => {
        callback(ctx.data);
      });
      subscription.on('error', (error) => {
        console.error(`❌ Subscription error for ${channel}:`, error);
      });
      subscription.subscribe();
      this.subscriptions.set(channel, subscription);
      console.log(`📡 Subscribed to channel: ${channel}`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to ${channel}:`, error);
    }
  }
  private handleUserChannelMessage(data: any): void {
    console.log('📨 User channel message:', data);
    switch (data.type) {
      case 'delivery_update':
        this.deliveryCallbacks.forEach(callback => callback(data.payload));
        break;
      case 'chat_message':
        this.chatCallbacks.forEach(callback => callback(data.payload));
        break;
      case 'notification':
        this.notificationCallbacks.forEach(callback => callback(data.payload));
        break;
      default:
        console.log('📨 Unknown message type:', data.type);
    }
  }
  private handleRoleChannelMessage(data: any): void {
    console.log('📨 Role channel message:', data);
    if (data.type === 'notification') {
      this.notificationCallbacks.forEach(callback => callback(data.payload));
    }
  }
  private updateConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusCallbacks.forEach(callback => callback(status));
  }
  onConnectionStatus(callback: (status: ConnectionStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    callback(this.connectionStatus);
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }
  onDeliveryUpdate(callback: (data: DeliveryUpdate) => void): () => void {
    this.deliveryCallbacks.add(callback);
    return () => {
      this.deliveryCallbacks.delete(callback);
    };
  }
  onChatMessage(callback: (data: ChatMessage) => void): () => void {
    this.chatCallbacks.add(callback);
    return () => {
      this.chatCallbacks.delete(callback);
    };
  }
  onNotification(callback: (data: NotificationMessage) => void): () => void {
    this.notificationCallbacks.add(callback);
    return () => {
      this.notificationCallbacks.delete(callback);
    };
  }
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }
  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }
}
export const centrifugoService = new CentrifugoService();
export const connectToCentrifugo = async (): Promise<void> => {
  await centrifugoService.connect();
};
export const disconnectFromCentrifugo = (): void => {
  centrifugoService.disconnect();
};
export default centrifugoService;
