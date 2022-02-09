import { Router } from "express";
import { AuthenticateUser, Login, Register } from "./controllers/auth.controller";


export const routes = (router: Router) => {
  router.post('/api/register', Register);
  router.post('/api/login', Login);
  router.get('/api/user', AuthenticateUser);
}