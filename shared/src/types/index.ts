export interface UserInfo {
  name: string;
  email: string;
  role: string;
  department: string;
  permissions: string[];
  joinDate: string;
}
export interface MockUser {
  username: string;
  password: string;
  userId: string;
  info: UserInfo;
  channels: string[];
}
export interface AuthResponse {
  success: boolean;
  user?: Omit<MockUser, 'password'>;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
  error?: string;
}
export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  user: Omit<MockUser, 'password'>;
  expiresAt: number;
  refreshExpiresAt: number;
}
export interface ConnectionStatus {
  state: 'disconnected' | 'connecting' | 'connected';
  isConnected: boolean;
  reconnectAttempts: number;
  lastError?: string;
}
export interface DeliveryUpdate {
  deliveryId: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  location?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  estimatedArrival?: string;
  driverId?: string;
  message?: string;
}
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'location';
  timestamp: string;
  attachments?: any[];
}
export interface NotificationMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  userId?: string;
  actionUrl?: string;
}
export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiresAuth: boolean;
}
export interface DeliveryApiRequest {
  deliveryId?: string;
  driverId?: string;
  status?: string;
  location?: {
    lat: number;
    lng: number;
  };
}
export interface DriverApiRequest {
  driverId?: string;
  location?: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  };
  status?: 'available' | 'busy' | 'offline';
}
