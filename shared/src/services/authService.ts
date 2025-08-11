import { generateTokenPair, decodeToken, isTokenExpired, formatTimeRemaining, getTokenTimeRemaining } from '../utils/jwtService';
import type { UserInfo, MockUser, AuthResponse, TokenInfo } from '../types';
export interface DemoUser {
  username: string;
  role: string;
  name: string;
}
export interface AuthResult {
  user: Omit<MockUser, 'password'>;
  tokenInfo: {
    accessTokenExp: number;
    refreshTokenExp: number;
    issuedAt: number;
    tokenType: string;
  };
}
export type { UserInfo, MockUser, AuthResponse, TokenInfo };
let accessToken: string | null = null;
let currentUser: Omit<MockUser, 'password'> | null = null;
let tokenExpiration: number | null = null;
const MOCK_USERS: MockUser[] = [
  {
    username: 'demo',
    password: 'demo',
    userId: 'demo-user-001',
    info: {
      name: 'John Smith',
      role: 'delivery_manager',
      permissions: ['read', 'write', 'manage_deliveries'],
      email: 'john.smith@deliverypro.com',
      department: 'Operations',
      joinDate: '2024-01-15'
    },
    channels: ['public:*', 'public:deliveries', 'public:notifications', 'public:messages:demo-user-001', 'public:online-users']
  },
  {
    username: 'admin',
    password: 'admin',
    userId: 'admin-user-001',
    info: {
      name: 'Sarah Johnson',
      role: 'system_admin',
      permissions: ['read', 'write', 'admin', 'manage_users', 'view_analytics'],
      email: 'sarah.johnson@deliverypro.com',
      department: 'IT Administration',
      joinDate: '2023-08-20'
    },
    channels: ['public:*', 'public:messages:admin-user-001', 'public:online-users']
  },
  {
    username: 'dispatcher',
    password: 'dispatcher',
    userId: 'dispatcher-user-001',
    info: {
      name: 'Mike Rodriguez',
      role: 'dispatcher',
      permissions: ['read', 'write', 'assign_deliveries', 'track_drivers'],
      email: 'mike.rodriguez@deliverypro.com',
      department: 'Dispatch',
      joinDate: '2023-11-10'
    },
    channels: ['public:*', 'public:dispatch', 'public:drivers', 'public:messages:dispatcher-user-001', 'public:online-users']
  },
  {
    username: 'supervisor',
    password: 'supervisor',
    userId: 'supervisor-user-001',
    info: {
      name: 'Lisa Wong',
      role: 'operations_supervisor',
      permissions: ['read', 'write', 'supervise_operations', 'view_reports'],
      email: 'lisa.wong@deliverypro.com',
      department: 'Operations',
      joinDate: '2023-05-03'
    },
    channels: ['public:*', 'public:operations', 'public:reports', 'public:messages:supervisor-user-001', 'public:online-users']
  }
];
export async function authenticateUser(username: string, password: string): Promise<AuthResponse> {
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    const user = MOCK_USERS.find(u => 
      u.username === username && u.password === password
    );
    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }
    const { password: _, ...userData } = user;
    const now = Math.floor(Date.now() / 1000);
    const tokenInfo = {
      accessTokenExp: now + 15 * 60,
      refreshTokenExp: now + 4 * 60 * 60
    };
    const tokenPair = await generateTokenPair(
      {
        userId: user.userId,
        info: user.info,
        channels: user.channels
      },
      tokenInfo
    );
    accessToken = tokenPair.accessToken;
    currentUser = userData;
    tokenExpiration = now + (tokenPair.expiresIn || 900);
    document.cookie = `refreshToken=${tokenPair.refreshToken}; SameSite=Strict; Max-Age=${tokenPair.refreshExpiresIn || 14400}; Path=/`;
    return {
      success: true,
      user: userData,
      accessToken: tokenPair.accessToken,
      tokenType: tokenPair.tokenType,
      expiresIn: tokenPair.expiresIn,
      refreshExpiresIn: tokenPair.refreshExpiresIn
    };
  } catch (error) {
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshTokenCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('refreshToken='))
      ?.split('=')[1];
    if (!refreshTokenCookie) {
      return null;
    }
    try {
      await decodeToken(refreshTokenCookie, undefined, 'refresh');
    } catch (error) {
      document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      return null;
    }
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!currentUser) {
      return null;
    }
    const now = Math.floor(Date.now() / 1000);
    const tokenInfo = {
      accessTokenExp: now + 15 * 60,
      refreshTokenExp: now + 4 * 60 * 60
    };
    const tokenPair = await generateTokenPair(
      {
        userId: currentUser.userId,
        info: currentUser.info,
        channels: currentUser.channels
      },
      tokenInfo
    );
    accessToken = tokenPair.accessToken;
    tokenExpiration = now + (tokenPair.expiresIn || 900);
    return tokenPair.accessToken;
  } catch (error) {
    clearAuthTokens();
    return null;
  }
}
export function getUserById(userId: string): Omit<MockUser, 'password'> | null {
  const user = MOCK_USERS.find(u => u.userId === userId);
  if (user) {
    const { password: _, ...userData } = user;
    return userData;
  }
  return null;
}
export function getMockUserList(): DemoUser[] {
  return MOCK_USERS.map(user => ({
    username: user.username,
    role: user.info.role,
    name: user.info.name
  }));
}
export function hasPermission(user: Omit<MockUser, 'password'>, permission: string): boolean {
  return user && user.info && user.info.permissions && 
         user.info.permissions.includes(permission);
}
export function canAccessChannel(user: Omit<MockUser, 'password'>, channel: string): boolean {
  if (!user || !user.channels) return false;
  return user.channels.some((allowedChannel: string) => {
    if (allowedChannel === channel) return true;
    if (allowedChannel.endsWith('*')) {
      const prefix = allowedChannel.slice(0, -1);
      return channel.startsWith(prefix);
    }
    return false;
  });
}
export function logoutUser(_userId: string): boolean {
  clearAuthTokens();
  return true;
}
export function checkAuthStatus(): { 
  isAuthenticated: boolean; 
  user?: Omit<MockUser, 'password'>; 
  tokenInfo?: any 
} {
  try {
    if (!currentUser || !accessToken) {
      const refreshTokenCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('refreshToken='))
        ?.split('=')[1];
      if (refreshTokenCookie) {
        try {
          const payloadPart = refreshTokenCookie.split('.')[1];
          if (payloadPart) {
            const decoded = JSON.parse(atob(payloadPart));
            const now = Math.floor(Date.now() / 1000);
            if (decoded.exp && now < decoded.exp) {
              if (decoded.sub) {
                const user = getUserById(decoded.sub);
                if (user) {
                  currentUser = user;
                  refreshAccessToken().then(() => {
                  }).catch(() => {
                  });
                  return {
                    isAuthenticated: true,
                    user: currentUser,
                    tokenInfo: { 
                      needsRefresh: true, 
                      restoredFromCookie: true,
                      refreshTokenValid: true
                    }
                  };
                }
              }
            } else {
              document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
            }
          }
        } catch (error) {
          document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        }
      }
      return { isAuthenticated: false };
    }
    const now = Math.floor(Date.now() / 1000);
    if (!tokenExpiration || now >= tokenExpiration) {
      refreshAccessToken().then(() => {
      }).catch(() => {
        clearAuthTokens();
      });
      return {
        isAuthenticated: true,
        user: currentUser,
        tokenInfo: { needsRefresh: true, expired: true }
      };
    }
    return {
      isAuthenticated: true,
      user: currentUser,
      tokenInfo: {
        accessToken: accessToken,
        expiresIn: tokenExpiration - now,
        expiresInFormatted: formatTimeRemaining(tokenExpiration - now)
      }
    };
  } catch (error) {
    clearAuthTokens();
    return { isAuthenticated: false };
  }
}
export function storeAuthTokens(_authResponse: AuthResponse): void {
}
export function clearAuthTokens(): void {
  accessToken = null;
  currentUser = null;
  tokenExpiration = null;
  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict';
}
export function getCurrentUser(): Omit<MockUser, 'password'> | null {
  return currentUser;
}
export function getAccessToken(): string | null {
  if (!accessToken || !tokenExpiration) {
    return null;
  }
    const now = Math.floor(Date.now() / 1000);
    if (now >= tokenExpiration) {
      return null;
    }  return accessToken;
}
export function getDebugTokenInfo() {
  const refreshTokenCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('refreshToken='))
    ?.split('=')[1];
  let decodedPayload = null;
  if (accessToken) {
    try {
      const payloadPart = accessToken.split('.')[1];
      const decodedBytes = atob(payloadPart);
      decodedPayload = JSON.parse(decodedBytes);
    } catch (e) {
    }
  }
  return {
    accessToken: accessToken,
    accessTokenExpiration: tokenExpiration,
    accessTokenExpiresIn: tokenExpiration ? tokenExpiration - Math.floor(Date.now() / 1000) : null,
    refreshTokenExists: !!refreshTokenCookie,
    refreshTokenLength: refreshTokenCookie ? refreshTokenCookie.length : 0,
    isLoggedIn: !!accessToken && !!currentUser,
    currentUser: currentUser,
    allCookies: document.cookie,
    jwtParts: accessToken ? accessToken.split('.').map((part, i) => ({
      part: i === 0 ? 'header' : i === 1 ? 'payload' : 'signature',
      value: part,
      length: part.length
    })) : null,
    decodedPayload: decodedPayload,
    centrifugoSecret: '6gYcPF5XfAqaLYxslyRJnb0rYBxDhTCbIUeiM76q68v8nRvlQfvcVE2RBSBt3PliCPH-RZafeV2Q9JviE8Jm1Q'
  };
}
