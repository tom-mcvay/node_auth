import { Request, Response } from "express"
import bcrypt from 'bcryptjs';
import { getRepository } from "typeorm";
import { User } from "../entities/user.entity";
import { sign } from 'jsonwebtoken';

export const Register = async (req: Request, res: Response) => {
  const { first_name, last_name, email, password, password_confirm } = req.body;

  if (password !== password_confirm) return res.status(400).json({ msg: 'Passwords do not match' });

  const user = await getRepository(User).save({
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