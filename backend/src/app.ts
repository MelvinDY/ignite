// src/app.ts
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import searchRoutes from './routes/search.routes';
import connectionsRoutes from './routes/connections.routes';

export const createApp = () => {

  const app = express();
  // Configure CORS to allow frontend origin with credentials
  app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3003', 'http://127.0.0.1:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
  }));

  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ status: 'OK' }));

  // --- Swagger UI (serve JSON to the UI) ---
  const openapiPath = path.join(__dirname, '..', 'openapi', 'openapi.yaml');
  const raw = fs.readFileSync(openapiPath, 'utf8');
  const openapiDoc = YAML.parse(raw);

  // serve the parsed doc as JSON so the UI fetches it
  app.get('/docs-json', (_req, res) => res.json(openapiDoc));

  // point Swagger UI to that JSON URL
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(undefined, { swaggerOptions: { url: '/docs-json' } })
  );
  // -----------------------------------------

  app.use('/api', authRoutes);
  app.use('/api', profileRoutes);
  app.use('/api', searchRoutes);
  app.use('/api', connectionsRoutes);

  return app;
};
