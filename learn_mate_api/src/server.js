require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { cleanupExpiredTokens } = require('./utils/jwt');

const authRoutes = require('./routes/auth.routes');
const subjectRoutes = require('./routes/subject.routes');
const lessonRoutes = require('./routes/lesson.routes');
const quizRoutes = require('./routes/quiz.routes');
const studentRoutes = require('./routes/student.routes');
const teacherRoutes = require('./routes/teacher.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please slow down.'
  }
});

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'LearnMate South Sudan API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  
  res.json({
    success: true,
    status: 'healthy',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/subjects', apiLimiter, subjectRoutes);
app.use('/api/lessons', apiLimiter, lessonRoutes);
app.use('/api/quizzes', apiLimiter, quizRoutes);
app.use('/api/students', apiLimiter, studentRoutes);
app.use('/api/teachers', apiLimiter, teacherRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);


app.use(notFound);

app.use(errorHandler);

const startServer = async () => {
  try {
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════╗');
      console.log('║                                                   ║');
      console.log('║        LearnMate South Sudan API Server          ║');
      console.log('║                                                   ║');
      console.log('╚═══════════════════════════════════════════════════╝');
      console.log('');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
      console.log('📚 Documentation: See README.md for full API reference');
      console.log('');
    });

    setInterval(() => {
      cleanupExpiredTokens();
    }, 3600000);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('⚠️  Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught Exception:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

module.exports = app;
