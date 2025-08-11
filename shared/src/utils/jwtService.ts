import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
const DEFAULT_SECRET = '6gYcPF5XfAqaLYxslyRJnb0rYBxDhTCbIUeiM76q68v8nRvlQfvcVE2RBSBt3PliCPH-RZafeV2Q9JviE8Jm1Q';
const REFRESH_SECRET = '6gYcPF5XfAqaLYxslyRJnb0rYBxDhTCbIUeiM76q68v8nRvlQfvcVE2RBSBt3PliCPH-RZafeV2Q9JviE8Jm1Q-refresh';
type GenerateTokenOptions = {
  sub?: string;
  exp?: number;
  secret?: string;
  info?: Record<string, any>;
  channels?: string[];
  tokenType?: string;
};
type GenerateSubscriptionOptions = {
  client: string;
  channel: string;
  exp?: number;
  secret?: string;
  info?: Record<string, any>;
};
type User = {
  userId: string;
  info?: Record<string, any>;
  channels?: string[];
};
type TokenInfo = {
  accessTokenExp: number;
  refreshTokenExp: number;
};
type TokenPair = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
};
type DecodedToken = JWTPayload & {
  sub?: string;
  exp?: number;
  iat?: number;
  info?: Record<string, any>;
  channels?: string[];
  tokenType?: string;
  client?: string;
  channel?: string;
};
function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}
export async function generateAccessToken(
  options: GenerateTokenOptions = {}
): Promise<string> {
  const {
    sub = 'user-' + Math.random().toString(36).slice(2, 11),
    exp = Math.floor(Date.now() / 1000) + 15 * 60,
    secret = DEFAULT_SECRET,
    info = {},
    channels = [],
  } = options;
  const payload: Record<string, any> = {
    sub,
    exp,
    iat: Math.floor(Date.now() / 1000),
  };
  if (Object.keys(info).length > 0) {
    payload.info = info;
  }
  if (channels.length > 0) {
    payload.channels = channels;
  }
  try {
    const secretKey = getSecretKey(secret);
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(secretKey);
  } catch (error) {
    throw new Error('Failed to generate access token');
  }
}
export async function generateRefreshToken(
  options: Omit<GenerateTokenOptions, 'info' | 'channels'> = {}
): Promise<string> {
  const {
    sub = 'user-' + Math.random().toString(36).slice(2, 11),
    exp = Math.floor(Date.now() / 1000) + 4 * 60 * 60,
    secret = REFRESH_SECRET,
  } = options;
  const payload = {
    sub,
    exp,
    iat: Math.floor(Date.now() / 1000),
    tokenType: 'refresh',
    aud: 'centrifugo-refresh',
    iss: 'centrifugo-client',
  };
  try {
    const secretKey = getSecretKey(secret);
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(exp)
      .setSubject(sub)
      .setAudience('centrifugo-refresh')
      .setIssuer('centrifugo-client')
      .sign(secretKey);
  } catch (error) {
    throw new Error('Failed to generate refresh token');
  }
}
export async function generateTokenPair(
  user: User,
  tokenInfo: TokenInfo,
  secret: string = DEFAULT_SECRET
): Promise<TokenPair> {
  try {
    const accessToken = await generateAccessToken({
      sub: user.userId,
      secret,
      exp: tokenInfo.accessTokenExp,
      info: user.info,
      channels: user.channels,
    });
    const refreshToken = await generateRefreshToken({
      sub: user.userId,
      exp: tokenInfo.refreshTokenExp,
    });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: tokenInfo.accessTokenExp - Math.floor(Date.now() / 1000),
      refreshExpiresIn: tokenInfo.refreshTokenExp - Math.floor(Date.now() / 1000),
    };
  } catch (error) {
    throw new Error('Failed to generate tokens');
  }
}
export async function generateCentrifugoToken(
  options: GenerateTokenOptions = {}
): Promise<string> {
  return generateAccessToken(options);
}
export async function generateSubscriptionToken(
  options: GenerateSubscriptionOptions
): Promise<string> {
  const {
    client,
    channel,
    exp = Math.floor(Date.now() / 1000) + 60 * 60,
    secret = DEFAULT_SECRET,
    info = {},
  } = options;
  const payload: Record<string, any> = {
    client,
    channel,
    exp,
    iat: Math.floor(Date.now() / 1000),
    tokenType: 'subscription',
  };
  if (Object.keys(info).length > 0) {
    payload.info = info;
  }
  try {
    const secretKey = getSecretKey(secret);
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(exp)
      .sign(secretKey);
  } catch (error) {
    throw new Error('Failed to generate subscription token');
  }
}
export async function decodeToken(
  token: string,
  secret: string = DEFAULT_SECRET,
  tokenType?: string
): Promise<DecodedToken> {
  try {
    const secretToUse = tokenType === 'refresh' ? REFRESH_SECRET : secret;
    const secretKey = getSecretKey(secretToUse);
    const { payload } = await jwtVerify(token, secretKey);
    const decodedPayload = payload as DecodedToken;
    if (tokenType && decodedPayload.tokenType !== tokenType) {
      throw new Error(
        `Invalid token type. Expected: ${tokenType}, Got: ${decodedPayload.tokenType}`
      );
    }
    return decodedPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeTokenPayload(token);
    if (!payload || !payload.exp) return true;
    return payload.exp < Math.floor(Date.now() / 1000);
  } catch (error) {
    return true;
  }
}
export function decodeTokenPayload(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = decodeURIComponent(
      atob(base64Payload)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(decodedPayload);
  } catch (error) {
    return null;
  }
}
export function getTokenTimeRemaining(token: string): number {
  try {
    const payload = decodeTokenPayload(token);
    if (!payload || !payload.exp) return 0;
    const remaining = payload.exp - Math.floor(Date.now() / 1000);
    return Math.max(0, remaining);
  } catch (error) {
    return 0;
  }
}
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);
  return parts.join(' ') || '0s';
}
