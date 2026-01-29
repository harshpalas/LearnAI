import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import documentRoutes from './routes/document';
import './config/passport';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
  
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnai')
  .then(() => console.log(' MongoDB Connected'))
  .catch(err => console.error(' MongoDB Connection Error:', err));

app.use(cors({
  origin: process.env.CLIENT_URL,
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
  secure: true,        
  httpOnly: true,
  sameSite: 'none',   
  maxAge: 24 * 60 * 60 * 1000
}
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/documents', documentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'LearnAI Backend API is running!' });
});

app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});

