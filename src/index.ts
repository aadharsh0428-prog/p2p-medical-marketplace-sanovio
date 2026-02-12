import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Route imports
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import mappingRoutes from './routes/mapping';
import listingRoutes from './routes/listings';
import searchRoutes from './routes/search';
import reservationRoutes from './routes/reservations';
import dashboardRoutes from './routes/dashboard';
import recommendationRoutes from './routes/recommendations';

// Middleware
import { requireAuth } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS - Must be first
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true 
}));

// ✅ Body parsers - Must come before routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Request logger (helpful for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Body:', JSON.stringify(req.body).slice(0, 200));
  }
  next();
});

/* HEALTH CHECK - Before all routes */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

/* PUBLIC ROUTES */
app.use('/api/auth', authRoutes);

/* PROTECTED ROUTES - Require authentication */
app.use('/api/search', requireAuth, searchRoutes);
app.use('/api/upload', requireAuth, uploadRoutes);
app.use('/api/mapping', requireAuth, mappingRoutes);
app.use('/api/listings', requireAuth, listingRoutes);
app.use('/api/reservations', requireAuth, reservationRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/recommendations', requireAuth, recommendationRoutes);

/* 404 Handler */
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      'POST /api/auth/login',
      'GET /api/search',
      'POST /api/upload',
      'GET /api/dashboard',
      'GET /api/listings',
      'GET /api/mapping/suggestions/:id',
      'POST /api/reservations'
    ]
  });
});

/* Error Handler */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server Error:', err);
  
  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or missing authentication token' 
    });
  }
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid JSON in request body' 
    });
  }
  
  res.status(err.status || 500).json({ 
    success: false, 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
});

app.listen(PORT, () => {
  console.log('\n' + '═'.repeat(70));
  console.log('🏥 P2P Medical Marketplace API Server');
  console.log('═'.repeat(70));
  console.log(`🌐 Server:        http://localhost:${PORT}`);
  console.log(`📅 Started:       ${new Date().toLocaleString()}`);
  console.log(`🔧 Environment:   ${process.env.NODE_ENV || 'development'}`);
  console.log('═'.repeat(70));
  
  console.log('\n📱 APPLICATION FEATURES:\n');
  
  console.log('🏠 DASHBOARD');
  console.log('   • View inventory statistics (Total, Active, Under Review, Expiring)');
  console.log('   • Manage listings (Activate, Delete)');
  console.log('   • Upload products via Excel');
  console.log('   • AI-powered recommendations');
  console.log('   ──────────────────────────────────────────────────────────────────');
  console.log('   GET    /api/dashboard              - Get dashboard stats');
  console.log('   GET    /api/listings               - Get my listings');
  console.log('   PATCH  /api/listings/:id/activate  - Activate draft listing');
  console.log('   DELETE /api/listings/:id           - Delete listing');
  console.log('   POST   /api/upload                 - Upload Excel inventory');
  console.log('   GET    /api/recommendations        - Get AI recommendations');
  
  console.log('\n🔍 SEARCH MARKETPLACE');
  console.log('   • Search available products');
  console.log('   • View product details');
  console.log('   • Create reservations/checkout');
  console.log('   • Track orders');
  console.log('   ──────────────────────────────────────────────────────────────────');
  console.log('   GET    /api/search                 - Search products');
  console.log('   POST   /api/reservations           - Create reservation (checkout)');
  console.log('   GET    /api/reservations           - Get my reservations');
  
  console.log('\n🔐 AUTHENTICATION');
  console.log('   ──────────────────────────────────────────────────────────────────');
  console.log('   POST   /api/auth/login             - Hospital login');
  
  console.log('\n' + '═'.repeat(70));
  console.log('\n💡 QUICK TEST:\n');
  console.log('1. Login:');
  console.log(`   curl -X POST http://localhost:${PORT}/api/auth/login \\`);
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"email":"info@insel.ch","password":"hospital123"}\'');
  console.log('\n2. Access Dashboard:');
  console.log(`   curl http://localhost:${PORT}/api/dashboard \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN"');
  console.log('\n3. Search Marketplace:');
  console.log(`   curl http://localhost:${PORT}/api/search?q=gloves \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN"');
  console.log('\n' + '═'.repeat(70));
  console.log('\n✅ Server ready! Frontend should be at http://localhost:5173\n');
});

export default app;
