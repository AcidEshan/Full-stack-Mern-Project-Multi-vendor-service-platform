import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import vendorRoutes from './routes/vendorRoutes';
import categoryRoutes from './routes/categoryRoutes';
import serviceRoutes from './routes/serviceRoutes';
import uploadRoutes from './routes/uploadRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import reviewRoutes from './routes/reviewRoutes';
import notificationRoutes from './routes/notificationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import adminToolsRoutes from './routes/adminToolsRoutes';
import contactRoutes from './routes/contactRoutes';
import couponRoutes from './routes/couponRoutes';
import payoutRoutes from './routes/payoutRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import messageRoutes from './routes/messageRoutes';
import { errorHandler } from './middleware/errorHandler';
import { initGridFS } from './utils/gridfsHelper';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
// Allow origins from environment plus Render frontend domains
const allowedOrigins = (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
  .concat([
    'https://full-stack-mern-project-multi-vendor-0jiy.onrender.com',
    'https://full-stack-mern-project-multi-vendor.onrender.com'
  ]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, mobile apps)
    if (!origin) return callback(null, true);
    if ((allowedOrigins || []).indexOf(origin) !== -1) return callback(null, true);
    // Otherwise, block the request — keeping behaviour strict
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Handle preflight requests for CORS
app.options('*', cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev')); // Request logging

// Health check route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Practicum API is running',
    version: process.env.API_VERSION || 'v1',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Practicum API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// Swagger JSON
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
const apiVersion = process.env.API_VERSION || 'v1';
app.use(`/api/${apiVersion}/auth`, authRoutes);
app.use(`/api/${apiVersion}/users`, userRoutes);
app.use(`/api/${apiVersion}/vendors`, vendorRoutes);
app.use(`/api/${apiVersion}/categories`, categoryRoutes);
app.use(`/api/${apiVersion}/services`, serviceRoutes);
app.use(`/api/${apiVersion}/orders`, orderRoutes);
app.use(`/api/${apiVersion}/payments`, paymentRoutes);
app.use(`/api/${apiVersion}/reviews`, reviewRoutes);
app.use(`/api/${apiVersion}/notifications`, notificationRoutes);
app.use(`/api/${apiVersion}/analytics`, analyticsRoutes);
app.use(`/api/${apiVersion}/admin`, adminToolsRoutes);
app.use(`/api/${apiVersion}/contact`, contactRoutes);
app.use(`/api/${apiVersion}/upload`, uploadRoutes);
app.use(`/api/${apiVersion}/files`, uploadRoutes); // Serve files from GridFS
app.use(`/api/${apiVersion}/coupons`, couponRoutes);
app.use(`/api/${apiVersion}/payouts`, payoutRoutes);
app.use(`/api/${apiVersion}/invoices`, invoiceRoutes);
app.use(`/api/${apiVersion}/favorites`, favoriteRoutes);
app.use(`/api/${apiVersion}/messages`, messageRoutes);

// 404 Handler
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested route does not exist'
    }
  });
});

// Error Handler (must be last)
app.use(errorHandler);

// Database Connection
mongoose.connect(process.env.MONGODB_URI!, {
  dbName: process.env.DB_NAME || 'practicum_db'
})
.then(() => {
  console.log('✓ MongoDB connected successfully');
  console.log(`✓ Database: ${mongoose.connection.db.databaseName}`);
  
  // Initialize GridFS
  try {
    initGridFS();
    console.log('✓ GridFS initialized successfully');
  } catch (error) {
    console.error('✗ GridFS initialization error:', error);
  }
  
  // Start server
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ API URL: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
    console.log(`✓ API Documentation: http://localhost:${PORT}/api-docs`);
  });
})
.catch((error: Error) => {
  console.error('✗ MongoDB connection error:', error.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  mongoose.connection.close();
  process.exit(0);
});

export default app;
