// server/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

import shipmentRoutes from './routes/shipmentRoutes';
import sessionRoutes from './routes/sessionRoutes';
import processRoutes from './routes/processRoutes';
import assistantRoutes from './routes/assistantRoutes';
import alertRoutes from './routes/alertRoutes';
import exemplaryProcessRoutes from './routes/exemplaryProcessRoutes';

/* ESM: __dirname/__filename */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* Carga .env (ajusta la ruta si tu .env está en otro sitio) */
const ENV_PATH = path.resolve(__dirname, '../.env');
dotenv.config({ path: ENV_PATH });

/* Helper */
function requireEnv(name: string, alt?: string): string {
  const val = process.env[name] || (alt ? process.env[alt] : undefined);
  if (!val) {
    console.error(
      `❌ Missing env var: ${name}${alt ? ` (también intenté ${alt})` : ''}. ` +
      `Cargué .env desde: ${ENV_PATH}`
    );
    process.exit(1);
  }
  return val;
}

const app = express();
const PORT = Number(process.env.SERVER_PORT) || 3001;

/* CORS */
const ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

/* Supabase server client con SERVICE ROLE (NO usar anon key aquí) */
/* 👇 Fallback: si no hay SUPABASE_URL, usa VITE_SUPABASE_URL del mismo .env */
const SUPABASE_URL = requireEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/* Auth middleware */
const authMiddleware: express.RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.error('[AUTH] getUser error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    (req as any).user = data.user;
    if (typeof req.body === 'object' && req.body !== null) {
      (req.body as any).user = data.user; // compat con rutas existentes
    }

    next();
  } catch (err) {
    console.error('[AUTH] middleware exception:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/* Health check */
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    allowedOrigins: ORIGINS,
    envLoadedFrom: ENV_PATH,
    hasSUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    hasVITE_SUPABASE_URL: Boolean(process.env.VITE_SUPABASE_URL),
    hasSERVICE_ROLE: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
});

/* Rutas protegidas */
app.use('/api/shipments', authMiddleware, shipmentRoutes);
app.use('/api/sessions', authMiddleware, sessionRoutes);
app.use('/api/processes', authMiddleware, processRoutes);
app.use('/api/assistant', authMiddleware, assistantRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/exemplary-processes', authMiddleware, exemplaryProcessRoutes);

/* Arranque */
app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});
