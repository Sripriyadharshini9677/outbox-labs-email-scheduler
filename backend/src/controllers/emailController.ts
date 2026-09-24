import { randomUUID } from 'crypto';
import { pool } from '../config/db.js';
import { enqueueEmail,cancelEmailJob } from '../queue/emailQueue.js';
function emailsFromCsv(text:string){return [...new Set(text.split(/\r?\n|,|;/).map(s=>s.trim().replace(/^['"]|['"]$/g,'')).filter(s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)))];}
export async function schedule(req:any,res:any){
  const {subject,body,scheduledAt,delayMs,hourlyLimit}=req.body||{}; const file=req.file as Express.Multer.File|undefined; let recipients:string[]=Array.isArray(req.body?.recipients)?req.body.recipients:[];
  if(file) recipients=emailsFromCsv(file.buffer.toString('utf8')); else if(typeof req.body?.recipients==='string') recipients=emailsFromCsv(req.body.recipients); else if(req.body?.to) recipients=[req.body.to];
  if(!subject||!body||!scheduledAt||!recipients.length) return res.status(400).json({error:'subject, body, scheduledAt and at least one recipient are required'});
  const when=new Date(scheduledAt); if(Number.isNaN(when.getTime())) return res.status(400).json({error:'scheduledAt must be valid'}); if(when.getTime()<Date.now()) return res.status(400).json({error:'scheduledAt must be in the future'});
  const delay=Math.max(0,Number(delayMs??process.env.EMAIL_DELAY_MS??2000)); const limit=Math.max(1,Number(hourlyLimit??process.env.MAX_EMAILS_PER_HOUR??200)); const campaign=randomUUID();
  const client=await pool.connect(); const rows:any[]=[]; try{await client.query('BEGIN'); for(let i=0;i<recipients.length;i++){const r=await client.query(`INSERT INTO emails(user_id,campaign_id,sequence_no,to_address,subject,body,scheduled_at,delay_ms,hourly_limit) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[req.user.id,campaign,i,recipients[i],subject,body,new Date(when.getTime()+i*delay),delay,limit]); rows.push(r.rows[0]);} await client.query('COMMIT');}catch(e){await client.query('ROLLBACK'); throw e;}finally{client.release();}
  for(const row of rows) await enqueueEmail(row); return res.status(201).json({campaignId:campaign,count:rows.length,emails:rows});
}
export async function list(req:any,res:any){const status=req.query.status; const q=status?'SELECT * FROM emails WHERE user_id=$1 AND status=$2 ORDER BY scheduled_at DESC':'SELECT * FROM emails WHERE user_id=$1 ORDER BY scheduled_at DESC'; const r=await pool.query(q,status?[req.user.id,status]:[req.user.id]); return res.json(r.rows);}
export async function cancel(req:any,res:any){const r=await pool.query("SELECT * FROM emails WHERE id=$1 AND user_id=$2",[req.params.id,req.user.id]); const row=r.rows[0]; if(!row) return res.status(404).json({error:'Email not found'}); if(row.status!=='scheduled') return res.status(400).json({error:`Cannot cancel ${row.status} email`}); await cancelEmailJob(Number(row.id)); await pool.query("UPDATE emails SET status='cancelled' WHERE id=$1",[row.id]); return res.json({ok:true});}
