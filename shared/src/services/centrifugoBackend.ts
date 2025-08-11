import axios from 'axios';
import * as jose from 'jose';
const CENTRIFUGO_URL = process.env.CENTRIFUGO_URL || 'http://localhost:8000';
const CENTRIFUGO_API_KEY = process.env.CENTRIFUGO_API_KEY || 'Tw3Re2wnZaLjyxvAbAHm0lHjdvPNLLSzweve_9yuJflEhr221iwa3X77bUJ-Nh6czEQmL8CQwHzG-SZqtGIWlA';
const TOKEN_HMAC_SECRET = new TextEncoder().encode(
  process.env.CENTRIFUGO_TOKEN_HMAC_SECRET || '6gYcPF5XfAqaLYxslyRJnb0rYBxDhTCbIUeiM76q68v8nRvlQfvcVE2RBSBt3PliCPH-RZafeV2Q9JviE8Jm1Q'
);
export interface CentrifugoChannel {
  name: string;
  permissions: {
    subscribe: boolean;
    publish: boolean;
    presence: boolean;
    history: boolean;
  };
}
export class CentrifugoService {
  private apiUrl: string;
  private apiKey: string;
  constructor() {
    this.apiUrl = `${CENTRIFUGO_URL}/api`;
    this.apiKey = CENTRIFUGO_API_KEY;
  }
  async generateUserToken(userId: string, channels: CentrifugoChannel[]): Promise<string> {
    try {
      const channelsList = channels.map(ch => ch.name);
      const token = await new jose.SignJWT({
        sub: userId,
        channels: channelsList,
        info: {
          userId,
          channels: channelsList
        }
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(TOKEN_HMAC_SECRET);
      return token;
    } catch (error) {
      console.error('Error generating Centrifugo token:', error);
      throw new Error('Failed to generate Centrifugo token');
    }
  }
  async registerUserChannels(userId: string, channels: CentrifugoChannel[]): Promise<boolean> {
    try {
      for (const channel of channels) {
        await this.makeApiCall('subscribe', {
          user: userId,
          channel: channel.name
        });
      }
      return true;
    } catch (error) {
      console.error('Error registering user channels:', error);
      return false;
    }
  }
  async publishToChannel(channel: string, data: any): Promise<boolean> {
    try {
      await this.makeApiCall('publish', {
        channel,
        data
      });
      return true;
    } catch (error) {
      console.error('Error publishing to channel:', error);
      return false;
    }
  }
  async getChannelPresence(channel: string): Promise<any> {
    try {
      const response = await this.makeApiCall('presence', {
        channel
      });
      return response.result;
    } catch (error) {
      console.error('Error getting channel presence:', error);
      return null;
    }
  }
  async getChannelHistory(channel: string, limit: number = 100): Promise<any> {
    try {
      const response = await this.makeApiCall('history', {
        channel,
        limit
      });
      return response.result;
    } catch (error) {
      console.error('Error getting channel history:', error);
      return null;
    }
  }
  async disconnectUser(userId: string): Promise<boolean> {
    try {
      await this.makeApiCall('disconnect', {
        user: userId
      });
      return true;
    } catch (error) {
      console.error('Error disconnecting user:', error);
      return false;
    }
  }
  async unsubscribeUser(userId: string, channel: string): Promise<boolean> {
    try {
      await this.makeApiCall('unsubscribe', {
        user: userId,
        channel
      });
      return true;
    } catch (error) {
      console.error('Error unsubscribing user:', error);
      return false;
    }
  }
  async sendNotification(userId: string, notification: {
    type: 'delivery_update' | 'message' | 'system' | 'alert';
    title: string;
    message: string;
    data?: any;
  }): Promise<boolean> {
    try {
      const userChannel = `user:${userId}`;
      return await this.publishToChannel(userChannel, {
        ...notification,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }
  async broadcastToUsers(userIds: string[], data: any): Promise<boolean> {
    try {
      for (const userId of userIds) {
        await this.publishToChannel(`user:${userId}`, data);
      }
      return true;
    } catch (error) {
      console.error('Error broadcasting to users:', error);
      return false;
    }
  }
  private async makeApiCall(method: string, params: any): Promise<any> {
    try {
      const response = await axios.post(this.apiUrl, {
        method,
        params
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `apikey ${this.apiKey}`
        }
      });
      if (response.data.error) {
        throw new Error(response.data.error.message);
      }
      return response.data;
    } catch (error) {
      console.error(`Centrifugo API call failed for method ${method}:`, error);
      throw error;
    }
  }
  static getUserChannels(userId: string, role: string): CentrifugoChannel[] {
    const baseChannels: CentrifugoChannel[] = [
      {
        name: `user:${userId}`,
        permissions: {
          subscribe: true,
          publish: false,
          presence: false,
          history: true
        }
      },
      {
        name: 'public:announcements',
        permissions: {
          subscribe: true,
          publish: false,
          presence: false,
          history: true
        }
      }
    ];
    switch (role) {
      case 'admin':
        baseChannels.push(
          {
            name: 'admin:notifications',
            permissions: {
              subscribe: true,
              publish: true,
              presence: true,
              history: true
            }
          },
          {
            name: 'system:monitoring',
            permissions: {
              subscribe: true,
              publish: false,
              presence: false,
              history: true
            }
          }
        );
        break;
      case 'dispatcher':
        baseChannels.push(
          {
            name: 'dispatchers:channel',
            permissions: {
              subscribe: true,
              publish: true,
              presence: true,
              history: true
            }
          },
          {
            name: 'deliveries:updates',
            permissions: {
              subscribe: true,
              publish: true,
              presence: false,
              history: true
            }
          }
        );
        break;
      case 'driver':
        baseChannels.push(
          {
            name: 'drivers:channel',
            permissions: {
              subscribe: true,
              publish: true,
              presence: true,
              history: true
            }
          },
          {
            name: `driver:${userId}:deliveries`,
            permissions: {
              subscribe: true,
              publish: false,
              presence: false,
              history: true
            }
          }
        );
        break;
      case 'customer':
        baseChannels.push(
          {
            name: `customer:${userId}:deliveries`,
            permissions: {
              subscribe: true,
              publish: false,
              presence: false,
              history: true
            }
          }
        );
        break;
    }
    return baseChannels;
  }
}
export const centrifugoService = new CentrifugoService();
