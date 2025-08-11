import { decodeJwt } from 'jose';
const API_BASE = 'http://localhost:3001/api';
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'dispatcher' | 'driver' | 'customer';
  department?: string;
  isActive: boolean;
}
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  centrifugoToken?: string;
}
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  centrifugoToken?: string;
}
const ACCESS_TOKEN_KEY = 'khedma_access_token';
const REFRESH_TOKEN_KEY = 'khedma_refresh_token';
const CENTRIFUGO_TOKEN_KEY = 'khedma_centrifugo_token';
export const storeAuthTokens = (tokens: AuthTokens): void => {
  console.log('storeAuthTokens called with:', tokens);
  console.log('ACCESS_TOKEN_KEY:', ACCESS_TOKEN_KEY);
  console.log('REFRESH_TOKEN_KEY:', REFRESH_TOKEN_KEY);
  console.log('CENTRIFUGO_TOKEN_KEY:', CENTRIFUGO_TOKEN_KEY);
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  if (tokens.centrifugoToken) {
    localStorage.setItem(CENTRIFUGO_TOKEN_KEY, tokens.centrifugoToken);
  }
  console.log('After storage - access token:', localStorage.getItem(ACCESS_TOKEN_KEY) ? 'SET' : 'NOT SET');
  console.log('After storage - refresh token:', localStorage.getItem(REFRESH_TOKEN_KEY) ? 'SET' : 'NOT SET');
  console.log('After storage - centrifugo token:', localStorage.getItem(CENTRIFUGO_TOKEN_KEY) ? 'SET' : 'NOT SET');
};
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};
export const getCentrifugoToken = (): string | null => {
  return localStorage.getItem(CENTRIFUGO_TOKEN_KEY);
};
export const clearAuthTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(CENTRIFUGO_TOKEN_KEY);
};
export const checkAuthStatus = () => {
  const token = getAccessToken();
  if (!token) {
    return { isAuthenticated: false, user: null, needsRefresh: false };
  }
  try {
    const payload = decodeJwt(token);
    const now = Date.now() / 1000;
    if (payload.exp && payload.exp < now) {
      return { isAuthenticated: false, user: null, needsRefresh: true };
    }
    return {
      isAuthenticated: true,
      user: payload.user as User,
      needsRefresh: false
    };
  } catch (error) {
    return { isAuthenticated: false, user: null, needsRefresh: false };
  }
};
export const getCurrentUser = (): User | null => {
  const token = getAccessToken();
  if (!token) {
    console.log('getCurrentUser: No access token found');
    return null;
  }
  try {
    const payload = decodeJwt(token);
    console.log('getCurrentUser: JWT payload:', payload);
    const user: User = {
      id: payload.userId as string,
      username: payload.username as string,
      email: payload.email as string,
      fullName: payload.full_name as string || payload.fullName as string || payload.username as string,
      role: payload.role as ('admin' | 'dispatcher' | 'driver' | 'customer'),
      department: payload.department as string,
      isActive: true
    };
    console.log('getCurrentUser: Constructed user:', user);
    return user;
  } catch (error) {
    console.log('getCurrentUser: Error decoding token:', error);
    return null;
  }
};
export const authenticateUser = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    console.log('Sending login request with:', { username, password: '***' });
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    console.log('Login response status:', response.status);
    if (!response.ok) {
      const error = await response.json();
      console.log('Login error response:', error);
      throw new Error(error.message || 'Login failed');
    }
    const data: AuthResponse = await response.json();
    console.log('Login response data:', data);
    storeAuthTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      centrifugoToken: data.centrifugoToken,
    });
    console.log('Tokens stored. Checking storage...');
    console.log('Access token stored:', !!localStorage.getItem('accessToken'));
    console.log('Centrifugo token stored:', !!localStorage.getItem('centrifugoToken'));
    return data;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};
export const registerUser = async (userData: {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: string;
}): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Registration failed');
    }
    const data: AuthResponse = await response.json();
    storeAuthTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      centrifugoToken: data.centrifugoToken,
    });
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};
export const refreshAccessToken = async (): Promise<AuthResponse | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      clearAuthTokens();
      return null;
    }
    const data: AuthResponse = await response.json();
    storeAuthTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      centrifugoToken: data.centrifugoToken,
    });
    return data;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearAuthTokens();
    return null;
  }
};
export const logoutUser = async (): Promise<void> => {
  const token = getAccessToken();
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  clearAuthTokens();
};
export const getDebugTokenInfo = () => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = decodeJwt(token);
    return {
      token: token.substring(0, 20) + '...',
      payload,
      expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Unknown',
    };
  } catch (error) {
    return { error: 'Invalid token' };
  }
};
