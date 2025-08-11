import { Centrifuge, Subscription } from 'centrifuge';
import { getAccessToken, getCurrentUser, checkAuthStatus } from './authService';
import type { ConnectionStatus, DeliveryUpdate, ChatMessage, NotificationMessage } from '../types';
export interface CentrifugoConfig {
  url: string;
  debug?: boolean;
  maxReconnectDelay?: number;
  minReconnectDelay?: number;
  maxServerPingDelay?: number;
}
export interface ChannelSubscription {
  channel: string;
  subscription: Subscription;
  isSubscribed: boolean;
}
export interface DriverUpdate {
  driverId: string;
  location: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    timestamp: string;
  };
  status: 'available' | 'busy' | 'offline';
}
export interface OnlineUser {
  userId: string;
  name: string;
  role: string;
  status: 'online' | 'away' | 'busy';
  lastSeen: string;
}
export type { ConnectionStatus, DeliveryUpdate, ChatMessage, NotificationMessage };
export type DeliveryUpdateHandler = (data: DeliveryUpdate) => void;
export type DriverUpdateHandler = (data: DriverUpdate) => void;
export type ChatMessageHandler = (data: ChatMessage) => void;
export type NotificationHandler = (data: NotificationMessage) => void;
export type OnlineUsersHandler = (data: OnlineUser[]) => void;
export type ConnectionStatusHandler = (status: ConnectionStatus) => void;
class CentrifugoService {
  private centrifuge: Centrifuge | null = null;
  private subscriptions: Map<string, ChannelSubscription> = new Map();
  private config: CentrifugoConfig;
  private connectionStatus: ConnectionStatus = {
    state: 'disconnected',
    isConnected: false,
    reconnectAttempts: 0
  };
  private connectionStatusHandlers: Set<ConnectionStatusHandler> = new Set();
  private deliveryUpdateHandlers: Set<DeliveryUpdateHandler> = new Set();
  private driverUpdateHandlers: Set<DriverUpdateHandler> = new Set();
  private chatMessageHandlers: Set<ChatMessageHandler> = new Set();
  private notificationHandlers: Set<NotificationHandler> = new Set();
  private onlineUsersHandlers: Set<OnlineUsersHandler> = new Set();
  constructor(config: CentrifugoConfig = {
    url: 'ws://localhost:8000/connection/websocket',
    debug: false,
    maxReconnectDelay: 20000,
    minReconnectDelay: 1000,
    maxServerPingDelay: 10000
  }) {
    this.config = config;
  }
  async connect(): Promise<void> {
    if (this.centrifuge) {
      return;
    }
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available for Centrifugo connection');
    }
    const user = getCurrentUser();
    if (!user) {
      throw new Error('No user information available');
    }
    try {
      this.centrifuge = new Centrifuge(this.config.url, {
        token,
        debug: this.config.debug,
        maxReconnectDelay: this.config.maxReconnectDelay,
        minReconnectDelay: this.config.minReconnectDelay,
        maxServerPingDelay: this.config.maxServerPingDelay,
        getToken: async () => {
          const freshToken = getAccessToken();
          if (freshToken) {
            return freshToken;
          }
          const { refreshAccessToken } = await import('./authService');
          const newToken = await refreshAccessToken();
          if (newToken) {
            return newToken;
          }
          return '';
        }
      });
      this.setupConnectionListeners();
      this.centrifuge.connect();
    } catch (error) {
      this.updateConnectionStatus('disconnected', error as Error);
      throw error;
    }
  }
  disconnect(): void {
    if (this.centrifuge) {
      this.subscriptions.forEach(({ subscription }) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      this.centrifuge.disconnect();
      this.centrifuge = null;
      this.updateConnectionStatus('disconnected');
    }
  }
  subscribe(channel: string): Promise<Subscription> {
    if (!this.centrifuge) {
      throw new Error('Not connected to Centrifugo');
    }
    if (this.subscriptions.has(channel)) {
      return Promise.resolve(this.subscriptions.get(channel)!.subscription);
    }
    const subscription = this.centrifuge.newSubscription(channel);
    subscription.on('subscribed', () => {
      const channelSub = this.subscriptions.get(channel);
      if (channelSub) {
        channelSub.isSubscribed = true;
      }
    });
    subscription.on('unsubscribed', () => {
      const channelSub = this.subscriptions.get(channel);
      if (channelSub) {
        channelSub.isSubscribed = false;
      }
    });
    subscription.on('publication', (ctx: any) => {
      this.handleChannelMessage(channel, ctx.data);
    });
    subscription.on('error', () => {
    });
    this.subscriptions.set(channel, {
      channel,
      subscription,
      isSubscribed: false
    });
    subscription.subscribe();
    return Promise.resolve(subscription);
  }
  unsubscribe(channel: string): void {
    const channelSub = this.subscriptions.get(channel);
    if (channelSub) {
      channelSub.subscription.unsubscribe();
      this.subscriptions.delete(channel);
    }
  }
  async publish(channel: string, data: any): Promise<void> {
    if (!this.centrifuge) {
      throw new Error('Not connected to Centrifugo');
    }
    try {
      await this.centrifuge.publish(channel, data);
    } catch (error) {
      throw error;
    }
  }
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }
  getSubscribedChannels(): string[] {
    return Array.from(this.subscriptions.keys()).filter(channel => 
      this.subscriptions.get(channel)?.isSubscribed
    );
  }
  onConnectionStatus(handler: ConnectionStatusHandler): () => void {
    this.connectionStatusHandlers.add(handler);
    return () => this.connectionStatusHandlers.delete(handler);
  }
  onDeliveryUpdate(handler: DeliveryUpdateHandler): () => void {
    this.deliveryUpdateHandlers.add(handler);
    return () => this.deliveryUpdateHandlers.delete(handler);
  }
  onDriverUpdate(handler: DriverUpdateHandler): () => void {
    this.driverUpdateHandlers.add(handler);
    return () => this.driverUpdateHandlers.delete(handler);
  }
  onChatMessage(handler: ChatMessageHandler): () => void {
    this.chatMessageHandlers.add(handler);
    return () => this.chatMessageHandlers.delete(handler);
  }
  onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.add(handler);
    return () => this.notificationHandlers.delete(handler);
  }
  onOnlineUsers(handler: OnlineUsersHandler): () => void {
    this.onlineUsersHandlers.add(handler);
    return () => this.onlineUsersHandlers.delete(handler);
  }
  private setupConnectionListeners(): void {
    if (!this.centrifuge) return;
    this.centrifuge.on('connecting', () => {
      this.updateConnectionStatus('connecting');
    });
    this.centrifuge.on('connected', () => {
      this.updateConnectionStatus('connected');
      this.subscribeToUserChannels();
    });
    this.centrifuge.on('connecting', () => {
      this.updateConnectionStatus('connecting');
    });
    this.centrifuge.on('disconnected', () => {
      this.updateConnectionStatus('disconnected');
      setTimeout(() => {
        const authStatus = checkAuthStatus();
        if (authStatus.isAuthenticated && !this.centrifuge) {
          this.connect().catch(() => {
          });
        }
      }, 3000);
    });
    this.centrifuge.on('error', (ctx: any) => {
      this.updateConnectionStatus('disconnected', new Error(ctx.error?.message || 'Connection error'));
    });
  }
  private updateConnectionStatus(state: ConnectionStatus['state'], error?: Error): void {
    this.connectionStatus = {
      ...this.connectionStatus,
      state,
      isConnected: state === 'connected',
      reconnectAttempts: state === 'connecting' ? this.connectionStatus.reconnectAttempts + 1 : 0,
      lastError: error?.message
    };
    this.connectionStatusHandlers.forEach(handler => {
      try {
        handler(this.connectionStatus);
      } catch (err) {
      }
    });
  }
  private async subscribeToUserChannels(): Promise<void> {
    const user = getCurrentUser();
    if (!user || !user.channels) return;
    for (const channel of user.channels) {
      try {
        await this.subscribe(channel);
      } catch (error) {
      }
    }
  }
  private handleChannelMessage(channel: string, data: any): void {
    try {
      if (channel.includes('delivery')) {
        this.deliveryUpdateHandlers.forEach(handler => handler(data as DeliveryUpdate));
      } else if (channel.includes('driver')) {
        this.driverUpdateHandlers.forEach(handler => handler(data as DriverUpdate));
      } else if (channel.includes('messages')) {
        this.chatMessageHandlers.forEach(handler => handler(data as ChatMessage));
      } else if (channel.includes('notifications')) {
        this.notificationHandlers.forEach(handler => handler(data as NotificationMessage));
      } else if (channel.includes('online-users')) {
        this.onlineUsersHandlers.forEach(handler => handler(data as OnlineUser[]));
      }
    } catch (error) {
    }
  }
}
export const centrifugoService = new CentrifugoService();
export const connectToCentrifugo = () => centrifugoService.connect();
export const disconnectFromCentrifugo = () => centrifugoService.disconnect();
export default centrifugoService;
