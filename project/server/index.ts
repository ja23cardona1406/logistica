import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Import routes
import shipmentRoutes from './routes/shipmentRoutes';
import sessionRoutes from './routes/sessionRoutes';
import processRoutes from './routes/processRoutes';
import assistantRoutes from './routes/assistantRoutes';
import alertRoutes from './routes/alertRoutes';
import exemplaryProcessRoutes from './routes/exemplaryProcessRoutes';

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Setup middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Authentication middleware
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.body.user = data.user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Set up routes
app.use('/api/shipments', authMiddleware, shipmentRoutes);
app.use('/api/sessions', authMiddleware, sessionRoutes);
app.use('/api/processes', authMiddleware, processRoutes);
app.use('/api/assistant', authMiddleware, assistantRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/exemplary-processes', authMiddleware, exemplaryProcessRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});