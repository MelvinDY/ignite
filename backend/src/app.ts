// src/app.ts
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './routes/auth.routes';

export const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ status: 'OK' }));

  // --- Swagger UI ---
  const openapiPath = path.join(__dirname, '..', 'openapi', 'openapi.yaml');
  const openapiDoc = YAML.parse(fs.readFileSync(openapiPath, 'utf8'));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
  // -------------------

  app.use('/api', authRoutes); // POST /api/auth/register

  return app;
};
