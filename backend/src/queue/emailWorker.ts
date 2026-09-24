import { Worker } from 'bullmq';
import { QUEUE_NAME } from './emailQueue.js';
import { redis } from '../config/redis.js';
import { pool } from '../config/db.js';
import { sendMail } from '../services/mailer.js';
const concurrency=Number(process.env.WORKER_CONCURRENCY||5);
function sleep(ms:number){return new Promise(r=>setTimeout(r,ms));}
async function throttle(userId:number,delayMs:number,limit:number){
  if(delayMs>0){const key=`send:last:${userId}`; const last=Number(await redis.get(key)||0); const wait=Math.max(0,last+delayMs-Date.now()); if(wait>0) await sleep(wait);}
  const hourKey=`send:hour:${userId}:${new Date().toISOString().slice(0,13)}`;
  while(true){const n=await redis.incr(hourKey); if(n===1) await redis.expire(hourKey,3700); if(n<=limit) break; await redis.decr(hourKey); const now=Date.now(); const next=new Date(); next.setUTCMinutes(0,0,0); next.setUTCHours(next.getUTCHours()+1); await sleep(Math.max(1000,next.getTime()-now));}
  if(delayMs>0) await redis.set(`send:last:${userId}`,String(Date.now()));
}
export function createWorker(){const w=new Worker(QUEUE_NAME,async job=>{
  const r=await pool.query('SELECT * FROM emails WHERE id=$1',[job.data.emailId]); const row=r.rows[0]; if(!row||['sent','cancelled'].includes(row.status)) return {skipped:true};
  await throttle(Number(row.user_id),Number(row.delay_ms),Number(row.hourly_limit));
  await pool.query("UPDATE emails SET status='sending',attempts=attempts+1 WHERE id=$1",[row.id]);
  try{const preview=await sendMail(row.to_address,row.subject,row.body); await pool.query("UPDATE emails SET status='sent',sent_at=NOW(),preview_url=$1,last_error=NULL WHERE id=$2",[preview,row.id]); return {preview};}
  catch(e:any){await pool.query("UPDATE emails SET status=CASE WHEN attempts>=3 THEN 'failed' ELSE 'scheduled' END,last_error=$1 WHERE id=$2",[e.message,row.id]); throw e;}
},{connection:redis,concurrency});
  w.on('completed',j=>console.log(`[worker] sent ${j.data.emailId}`)); w.on('failed',(j,e)=>console.error(`[worker] failed ${j?.data?.emailId}`,e.message)); return w;}
