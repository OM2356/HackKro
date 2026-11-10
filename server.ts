import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './src/server/routes/auth.ts';
import { tasksRouter } from './src/server/routes/tasks.ts';
import { assignmentsRouter } from './src/server/routes/assignments.ts';
import { submissionsRouter } from './src/server/routes/submissions.ts';
import { evaluationsRouter } from './src/server/routes/evaluations.ts';
import { pointsRouter } from './src/server/routes/points.ts';
import { internsRouter } from './src/server/routes/interns.ts';
import { statsRouter } from './src/server/routes/stats.ts';
import { emailLogsRouter } from './src/server/routes/emailLogs.ts';
import { getDb } from './src/server/db/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Express Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      const duration = Date.now() - start;
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'HackKro Intern Task Management Portal',
    timestamp: new Date().toISOString(),
    resend_configured: Boolean(process.env.RESEND_API_KEY),
  });
});

// Mount API Routers
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/evaluations', evaluationsRouter);
app.use('/api/points', pointsRouter);
app.use('/api/interns', internsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/email', emailLogsRouter);

// Database initialization
getDb()
  .then(() => console.log('[HackKro Server] PostgreSQL Database initialized and verified.'))
  .catch((err) => console.error('[HackKro Server] Database initialization error:', err));

// Vite Middlewares (Dev) or Static Asset Serving (Production)
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[HackKro Server] Vite middlewares mounted for development.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[HackKro Server] Serving static production build from dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================================`);
    console.log(`🚀 HackKro Intern Task Management Portal Server Active`);
    console.log(`📡 URL: http://0.0.0.0:${PORT}`);
    console.log(`⚡ Mode: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`========================================================`);
  });
}

startServer().catch((err) => {
  console.error('[HackKro Server] Fatal startup error:', err);
  process.exit(1);
});
