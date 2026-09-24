import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../config/db.js';
import { tokenFor } from '../services/auth.js';
const google=new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export async function register(req:any,res:any){
  const {email,password,name}=req.body||{}; if(!email||!password) return res.status(400).json({error:'email and password are required'});
  const hash=await bcrypt.hash(password,10);
  try{const r=await pool.query('INSERT INTO users(email,password_hash,name) VALUES($1,$2,$3) RETURNING id,email,name,avatar_url',[email.toLowerCase(),hash,name||null]); const u=r.rows[0]; return res.status(201).json({token:tokenFor(u),user:u});}
  catch(e:any){if(e.code==='23505') return res.status(409).json({error:'Account already exists'}); return res.status(500).json({error:'Registration failed'});}
}
export async function login(req:any,res:any){const {email,password}=req.body||{}; const r=await pool.query('SELECT * FROM users WHERE email=$1',[String(email||'').toLowerCase()]); const u=r.rows[0]; if(!u?.password_hash||!(await bcrypt.compare(password,u.password_hash))) return res.status(401).json({error:'Invalid email or password'}); return res.json({token:tokenFor(u),user:u});}
export async function googleLogin(req:any,res:any){
  const credential=req.body?.credential; if(!credential) return res.status(400).json({error:'Google credential is required'});
  if(!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({error:'Google OAuth is not configured. Add GOOGLE_CLIENT_ID.'});
  try{const ticket=await google.verifyIdToken({idToken:credential,audience:process.env.GOOGLE_CLIENT_ID}); const p=ticket.getPayload(); if(!p?.email) return res.status(400).json({error:'Google account has no email'});
    let r=await pool.query('SELECT id,email,name,avatar_url FROM users WHERE google_id=$1 OR email=$2',[p.sub,p.email.toLowerCase()]); let u=r.rows[0];
    if(u){await pool.query('UPDATE users SET google_id=COALESCE(google_id,$1),name=COALESCE($2,name),avatar_url=COALESCE($3,avatar_url) WHERE id=$4',[p.sub,p.name||null,p.picture||null,u.id]);}
    else {r=await pool.query('INSERT INTO users(email,google_id,name,avatar_url) VALUES($1,$2,$3,$4) RETURNING id,email,name,avatar_url',[p.email.toLowerCase(),p.sub,p.name||null,p.picture||null]);u=r.rows[0];}
    return res.json({token:tokenFor(u),user:u});
  }catch{return res.status(401).json({error:'Invalid Google credential'});}
}
