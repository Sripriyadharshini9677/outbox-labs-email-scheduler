import { Router } from 'express'; import { register,login,googleLogin } from '../controllers/authController.js'; import { authLimiter } from '../middleware/rateLimiter.js';
export const authRouter=Router(); authRouter.use(authLimiter); authRouter.post('/register',register); authRouter.post('/login',login); authRouter.post('/google',googleLogin);
