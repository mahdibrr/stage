import { getAccessToken, refreshAccessToken } from './authService';
interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  skipAuth?: boolean;
}
interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
}
interface Delivery {
  id: string;
  customerId: string;
  driverId?: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
  pickupAddress: string;
  deliveryAddress: string;
  scheduledTime: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  items: DeliveryItem[];
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}
interface DeliveryItem {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}
interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleId: string;
  status: 'available' | 'busy' | 'offline';
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
}
interface Location {
  lat: number;
  lng: number;
  timestamp?: string;
}
interface DeliveryStats {
  totalDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
}
interface PerformanceMetrics {
  totalRevenue: number;
  totalDistance: number;
  fuelEfficiency: number;
  customerSatisfaction: number;
  driverUtilization: number;
}
interface RouteOptimization {
  optimizedRoutes: Route[];
  totalDistance: number;
  estimatedTime: number;
  fuelSavings: number;
}
interface Route {
  driverId: string;
  deliveries: string[];
  estimatedTime: number;
  totalDistance: number;
}
interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
  unreadCount: number;
  type: 'direct' | 'group';
  name?: string;
}
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'location';
  attachments?: Attachment[];
  timestamp: string;
  readBy: string[];
}
interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}
interface OnlineUser {
  id: string;
  name: string;
  status: 'online' | 'away' | 'busy';
  lastSeen: string;
}
type TokenExpiredCallback = () => Promise<void>;
class ApiClient {
  private baseURL: string;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string | null> | null = null;
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
  }
  async makeRequest(endpoint: string, options: RequestOptions = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    if (options.skipAuth) {
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    }
    let token = getAccessToken();
    if (!token) {
      token = await this.handleTokenRefresh();
      if (!token) {
        throw new Error('No access token available');
      }
    }
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (response.status === 401) {
      const newToken = await this.handleTokenRefresh();
      if (!newToken) {
        throw new Error('Token refresh failed');
      }
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`,
          ...options.headers,
        },
      });
    }
    return response;
  }
  private async handleTokenRefresh(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }
    this.isRefreshing = true;
    this.refreshPromise = refreshAccessToken();
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } catch (error) {
      return null;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }
  async get<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.makeRequest(endpoint, {
      method: 'GET',
      ...options
    });
    if (!response.ok) {
      throw new Error(`GET ${endpoint} failed: ${response.statusText}`);
    }
    return response.json();
  }
  async post<T = any>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
    if (!response.ok) {
      throw new Error(`POST ${endpoint} failed: ${response.statusText}`);
    }
    return response.json();
  }
  async put<T = any>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
    if (!response.ok) {
      throw new Error(`PUT ${endpoint} failed: ${response.statusText}`);
    }
    return response.json();
  }
  async delete<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.makeRequest(endpoint, {
      method: 'DELETE',
      ...options
    });
    if (!response.ok) {
      throw new Error(`DELETE ${endpoint} failed: ${response.statusText}`);
    }
    return response.json();
  }
}
export const apiClient = new ApiClient();
export const deliveryApi = {
  getDeliveries: (): Promise<Delivery[]> => apiClient.get<Delivery[]>('/deliveries'),
  getDelivery: (id: string): Promise<Delivery> => apiClient.get<Delivery>(`/deliveries/${id}`),
  createDelivery: (delivery: Omit<Delivery, 'id'>): Promise<Delivery> => 
    apiClient.post<Delivery>('/deliveries', delivery),
  updateDelivery: (id: string, delivery: Partial<Delivery>): Promise<Delivery> => 
    apiClient.put<Delivery>(`/deliveries/${id}`, delivery),
  deleteDelivery: (id: string): Promise<{ success: boolean }> => 
    apiClient.delete(`/deliveries/${id}`),
  updateDeliveryStatus: (id: string, status: Delivery['status']): Promise<Delivery> => 
    apiClient.put<Delivery>(`/deliveries/${id}/status`, { status }),
  getDeliveryTracking: (id: string): Promise<Location[]> => 
    apiClient.get<Location[]>(`/deliveries/${id}/tracking`)
};
export const driverApi = {
  getDrivers: (): Promise<Driver[]> => apiClient.get<Driver[]>('/drivers'),
  getDriver: (id: string): Promise<Driver> => apiClient.get<Driver>(`/drivers/${id}`),
  updateDriverLocation: (id: string, location: Location): Promise<{ success: boolean }> => 
    apiClient.put(`/drivers/${id}/location`, location),
  getDriverDeliveries: (id: string): Promise<Delivery[]> => 
    apiClient.get<Delivery[]>(`/drivers/${id}/deliveries`)
};
export const analyticsApi = {
  getDeliveryStats: (): Promise<DeliveryStats> => 
    apiClient.get<DeliveryStats>('/analytics/deliveries'),
  getPerformanceMetrics: (): Promise<PerformanceMetrics> => 
    apiClient.get<PerformanceMetrics>('/analytics/performance'),
  getRouteOptimization: (): Promise<RouteOptimization> => 
    apiClient.get<RouteOptimization>('/analytics/routes')
};
export const messagingApi = {
  getConversations: (): Promise<Conversation[]> => 
    apiClient.get<Conversation[]>('/messages/conversations'),
  getMessages: (conversationId: string): Promise<Message[]> => 
    apiClient.get<Message[]>(`/messages/conversations/${conversationId}`),
  sendMessage: (conversationId: string, message: Omit<Message, 'id' | 'conversationId' | 'senderId' | 'timestamp' | 'readBy'>): Promise<Message> => 
    apiClient.post<Message>(`/messages/conversations/${conversationId}`, {
      content: message.content,
      type: message.type || 'text',
      attachments: message.attachments || []
    }),
  createConversation: (participants: string[], type: 'direct' | 'group' = 'direct', name?: string): Promise<Conversation> => 
    apiClient.post<Conversation>('/messages/conversations', {
      participants,
      type,
      ...(name && { name })
    }),
  markAsRead: (conversationId: string, messageId: string): Promise<{ success: boolean }> => 
    apiClient.put(`/messages/conversations/${conversationId}/read`, {
      messageId
    }),
  getOnlineUsers: (): Promise<OnlineUser[]> => 
    apiClient.get<OnlineUser[]>('/messages/online-users')
};
export type {
  ApiResponse,
  Delivery,
  DeliveryItem,
  Driver,
  Location,
  DeliveryStats,
  PerformanceMetrics,
  RouteOptimization,
  Route,
  Conversation,
  Message,
  Attachment,
  OnlineUser,
  TokenExpiredCallback
};
