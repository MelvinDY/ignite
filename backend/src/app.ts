// src/app.ts
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes';

export const createApp = () => {
  const app = express();
  app.use(cors());
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

  return app;
};
