import { pool } from '../config/db.js';
import { enqueueEmail } from './emailQueue.js';
export async function rehydrate(){const r=await pool.query("SELECT * FROM emails WHERE status='scheduled' ORDER BY scheduled_at"); for(const row of r.rows){try{await enqueueEmail(row);}catch(e){console.error('[rehydrate]',row.id,e);}} console.log(`[rehydrate] queued ${r.rowCount} scheduled email(s)`);}
