import { Router, Request, Response } from 'express';
import * as jose from 'jose';
import { UserModel } from '../models/User';
import { registerSchema, loginSchema } from '../validation/schemas';
import { centrifugoService } from '../services/centrifugoBackend';
const router = Router();
const secret = new TextEncoder().encode(process.env.JWT_SECRET || '6gYcPF5XfAqaLYxslyRJnb0rYBxDhTCbIUeiM76q68v8nRvlQfvcVE2RBSBt3PliCPH-RZafeV2Q9JviE8Jm1Q');
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    const user = await UserModel.create(value);
    if (!user) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
    }
    const accessToken = await new jose.SignJWT({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(process.env.JWT_EXPIRES_IN || '24h')
      .sign(secret);
    const refreshToken = await new jose.SignJWT({
      userId: user.id,
      type: 'refresh'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(process.env.JWT_REFRESH_EXPIRES_IN || '7d')
      .sign(secret);
    const centrifugoToken = await UserModel.getCentrifugoToken(user.id);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
      accessToken,
      refreshToken,
      centrifugoToken,
      tokenType: 'Bearer',
      expiresIn: 86400,
      refreshExpiresIn: 604800
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
router.post('/login', async (req: Request, res: Response) => {
  try {
    console.log('Login request body:', req.body);
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      console.log('Login validation error:', error.details[0].message);
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    const user = await UserModel.authenticate(value);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
    const accessToken = await new jose.SignJWT({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(process.env.JWT_EXPIRES_IN || '24h')
      .sign(secret);
    const refreshToken = await new jose.SignJWT({
      userId: user.id,
      type: 'refresh'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(process.env.JWT_REFRESH_EXPIRES_IN || '7d')
      .sign(secret);
    const centrifugoToken = await UserModel.getCentrifugoToken(user.id);
    await centrifugoService.sendNotification(user.id, {
      type: 'system',
      title: 'Login Successful',
      message: `Welcome back, ${user.full_name}!`,
      data: { loginTime: new Date().toISOString() }
    });
    res.json({
      success: true,
      user,
      accessToken,
      refreshToken,
      centrifugoToken,
      tokenType: 'Bearer',
      expiresIn: 86400,
      refreshExpiresIn: 604800
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required'
      });
    }
    const { payload } = await jose.jwtVerify(refreshToken, secret);
    if (payload.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
    const user = await UserModel.findById(payload.userId as string);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }
    const accessToken = await new jose.SignJWT({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(process.env.JWT_EXPIRES_IN || '24h')
      .sign(secret);
    res.json({
      success: true,
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 86400
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }
    const { payload } = await jose.jwtVerify(token, secret);
    const user = await UserModel.findById(payload.userId as string);
    if (!user || !user.is_active) {
      return res.status(404).json({
        success: false,
        error: 'User not found or inactive'
      });
    }
    const centrifugoToken = await UserModel.getCentrifugoToken(user.id);
    res.json({
      success: true,
      user,
      centrifugoToken
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const { payload } = await jose.jwtVerify(token, secret);
        await centrifugoService.disconnectUser(payload.userId as string);
      } catch (error) {
      }
    }
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
export { router as authRoutes };
