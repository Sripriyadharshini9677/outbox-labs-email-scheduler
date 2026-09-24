import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';
export const QUEUE_NAME='scheduled-emails';
export const emailQueue=new Queue(QUEUE_NAME,{connection:redis});
export async function enqueueEmail(row:any){const delay=Math.max(0,new Date(row.scheduled_at).getTime()-Date.now()); await emailQueue.add('send-email',{emailId:Number(row.id)},{jobId:`email-${row.id}`,delay,attempts:3,backoff:{type:'exponential',delay:5000},removeOnComplete:500,removeOnFail:500});}
export async function cancelEmailJob(id:number){const job=await emailQueue.getJob(String(id)); if(job){const s=await job.getState(); if(['waiting','delayed'].includes(s)) await job.remove();}}
