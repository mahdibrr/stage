import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { deliveryRoutes } from './routes/deliveries';
import { driverRoutes } from './routes/drivers';
import { analyticsRoutes } from './routes/analytics';
import { messagingRoutes } from './routes/messaging';
import { authenticateToken } from './middleware/auth';
import { testConnection, initializeDatabase } from './config/database';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(helmet());
app.use(cors({
  origin: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(','),
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});
app.get('/health/db', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: dbStatus ? 'OK' : 'ERROR',
    database: dbStatus ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/deliveries', authenticateToken, deliveryRoutes);
app.use('/api/drivers', authenticateToken, driverRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/messages', authenticateToken, messagingRoutes);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      error: err.details[0].message
    });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry found'
    });
  }
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found` 
  });
});
const startServer = async () => {
  try {
    console.log('🔄 Initializing database...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Please check your XAMPP MySQL server.');
      process.exit(1);
    }
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error('❌ Failed to initialize database tables.');
      process.exit(1);
    }
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`🗄️  Database status at http://localhost:${PORT}/health/db`);
      console.log(`🔐 Auth endpoints:`);
      console.log(`   POST /api/auth/register - User registration`);
      console.log(`   POST /api/auth/login - User login`);
      console.log(`   POST /api/auth/refresh - Refresh token`);
      console.log(`   GET  /api/auth/me - Get current user`);
      console.log(`   POST /api/auth/logout - User logout`);
      console.log(`📡 Centrifugo integration enabled`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  process.exit(0);
});
startServer();
export default app;
