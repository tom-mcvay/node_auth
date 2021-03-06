import { Request, Response } from "express"
import bcrypt from 'bcryptjs';
import { getRepository } from "typeorm";
import { User } from "../entities/user.entity";
import { sign, verify } from 'jsonwebtoken';

export const Register = async (req: Request, res: Response) => {
  const { first_name, last_name, email, password, password_confirm } = req.body;

  if (password !== password_confirm) return res.status(400).json({ msg: 'Passwords do not match' });

  const { password: any, ...user } = await getRepository(User).save({
    first_name, 
    last_name, 
    email, 
    password: await bcrypt.hash(password, 12)
  });

  res.json({ msg: "success", data: user });
};

export const Login = async (req: Request, res: Response) => {
  const user = await getRepository(User).findOne({ email: req.body.email });

  if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

  if (!await bcrypt.compare(req.body.password, user.password)) {
    return res.status(400).json({ msg: 'Invalid credentials' });
  }

  const accessToken = sign({
    id: user.id
  }, process.env.ACCESS_SECRET || '', { expiresIn: '30s' });

  const refreshToken = sign({
    id: user.id
  }, process.env.REFRESH_SECRET || '', { expiresIn: '1d' });

  res.cookie('access_token', accessToken, { httpOnly: true, maxAge: 24*60*60*1000 });
  res.cookie('refresh_token', refreshToken, { httpOnly: true, maxAge: 7 * (24*60*60*1000) });

  return res.status(200).json({ msg: 'success', data: user });
}

export const AuthenticateUser = async (req: Request, res: Response) => {
  // Add cookie parse to parse cookies
  try {
    const cookie = req.cookies['access_token'];
    // Get the user
    const payload: any = verify(cookie, process.env.ACCESS_SECRET || '');
    // Check valid payload
    if (!payload) return res.status(401).send({ msg: 'Unathenticated' });
  
    const user = await getRepository(User).findOne(payload.id);
  
    if (!user) {
      return res.status(401).json({ msg: 'Unauthenticated' });
    }
  
    res.status(200).json({ msg: 'success', data: { id: user.id, email: user.email }});
    
  } catch (error) {
    console.log(error)
    return res.status(401).json({ msg: 'Unauthenticated' });
  }
};

export const Refresh = (req: Request, res: Response) => {
  try {
    console.log(`Refreshing token`);
    const cookie = req.cookies['refresh_token'];
  
    const payload: any = verify(cookie, process.env.REFRESH_SECRET || '');
  
    // Check valid payload
    if (!payload) return res.status(401).send({ msg: 'Unathenticated' });

    // Create new access token
    const accessToken = sign({
      // Take id from refresh token payload
      id: payload.id
    }, process.env.ACCESS_SECRET || '', { expiresIn: '30s' });
  
    // Set access token as a cookie
    res.cookie('access_token', accessToken, { httpOnly: true, maxAge: 24*60*60*1000 });

    res.json({ msg: 'success', data: [] });

  } catch (error) {
    console.log(error)
    return res.status(401).json({ msg: 'Unauthenticated' });
  }
} 

export const Logout = (req: Request, res: Response) => {
  res.cookie('access_token', 0, { maxAge: 0 });
  res.cookie('refresh_token', 0, { maxAge: 0 });

  res.json({ msg: 'success' });
}