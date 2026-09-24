import 'dotenv/config'; import { initDb } from './config/db.js'; import { createWorker } from './queue/emailWorker.js'; await initDb(); createWorker(); console.log('Email worker started');
