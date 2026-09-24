import type { Request } from 'express';
export type User = { id:number; email:string; name?:string|null; avatar_url?:string|null };
export type AuthedRequest = Request & { user?: User };
