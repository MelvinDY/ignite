// src/server.ts
import 'dotenv/config';
import { createApp } from './app';

const PORT = Number(process.env.PORT || 5000);
const app = createApp();

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
