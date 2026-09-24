import 'dotenv/config';
import { app } from './app.js';
import { initDb } from './config/db.js';
import { rehydrate } from './queue/rehydrate.js';
import { createWorker } from './queue/emailWorker.js';

const port = Number(process.env.PORT || 4000);

await initDb();

createWorker();

await rehydrate();

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});