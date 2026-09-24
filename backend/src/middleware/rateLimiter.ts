import rateLimit from 'express-rate-limit';
export const apiLimiter=rateLimit({windowMs:60_000,max:120,standardHeaders:true,legacyHeaders:false});
export const authLimiter=rateLimit({windowMs:15*60_000,max:30,standardHeaders:true,legacyHeaders:false});
