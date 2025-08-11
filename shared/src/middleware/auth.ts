import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
const secret = new TextEncoder().encode('6gYcPF5XfAqaLYxslyRJnb0rYBxDhTCbIUeiM76q68v8nRvlQfvcVE2RBSBt3PliCPH-RZafeV2Q9JviE8Jm1Q');
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
    role: string;
  };
}
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    req.user = payload as any;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};
