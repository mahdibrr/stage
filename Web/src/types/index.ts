export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'dispatcher' | 'driver' | 'customer';
  department?: string;
  isActive: boolean;
}
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
export interface RealtimeMessage {
  type: 'delivery' | 'chat' | 'notification';
  data: DeliveryUpdate | ChatMessage | NotificationMessage;
  timestamp: Date;
}
