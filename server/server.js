require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const connectDB = require('./config/db');
const { initSocket } = require('./socket/socket');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const requestRoutes = require('./routes/request');
const chatRoutes = require('./routes/chat');
const messageRoutes = require('./routes/message');
const notificationRoutes = require('./routes/notification');
const groupRoutes = require('./routes/group');
const adminRoutes = require('./routes/admin');

// Initialize Passport config
require('./config/passport');

const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

// Initialize Socket.io
const io = initSocket(server);
app.set('io', io);

// Middleware to expose socket io object to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Security & Request Parsing Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Turn off CSP if it blocks external profile pics or assets in dev
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

// Static folder for local uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Apply rate limiter to all API endpoints
app.use('/api', apiLimiter);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/request', requestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/admin', adminRoutes);

// Base route check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'healthy', app: 'EcoChat API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
