import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import type { Response, NextFunction } from 'express';
import type { AuthedRequest } from '../types/auth.js';
export async function auth(req:AuthedRequest,res:Response,next:NextFunction){
  const h=req.headers.authorization; if(!h?.startsWith('Bearer ')) return res.status(401).json({error:'Authentication required'});
  try{ const p:any=jwt.verify(h.slice(7),process.env.JWT_SECRET||'change-this-in-real-use'); const r=await pool.query('SELECT id,email,name,avatar_url FROM users WHERE id=$1',[p.sub]); if(!r.rows[0]) return res.status(401).json({error:'User not found'}); req.user=r.rows[0]; next(); }
  catch{ return res.status(401).json({error:'Invalid or expired token'}); }
}
