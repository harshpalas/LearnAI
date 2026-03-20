import dotenv from 'dotenv';
dotenv.config(); // MUST BE THE FIRST LINE

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import documentRoutes from './routes/document';
import geminiRoutes from './routes/gemini';
import './config/passport';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = (process.env.CLIENT_URL || '').replace(/\/+$/, '');
const isProduction = process.env.NODE_ENV === 'production';

// Required when deployed behind Render's reverse proxy
app.set('trust proxy', 1);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnai')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.replace(/\/+$/, '');
    if (normalizedOrigin === CLIENT_URL) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/gemini', geminiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'LearnAI Backend API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('API endpoints available:');
  console.log(` - Auth: /auth`);
  console.log(` - Users: /api/user`);
  console.log(` - Documents: /api/documents`);
  console.log(` - Gemini: /api/gemini`);
});
