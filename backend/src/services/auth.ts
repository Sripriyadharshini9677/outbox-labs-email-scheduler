import jwt from 'jsonwebtoken';
export function tokenFor(user:any){return jwt.sign({sub:user.id,email:user.email},process.env.JWT_SECRET||'change-this-in-real-use',{expiresIn:'7d'});}
