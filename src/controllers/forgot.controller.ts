import { Request, Response } from "express"
import { createTransport } from "nodemailer";
import { getRepository } from "typeorm";
import { Reset } from "../entities/reset.entity";
import { User } from "../entities/user.entity";
import bcrypt from 'bcryptjs';


export const ForgotPassword = async(req: Request, res: Response) => {
  const { email } = req.body;
  const token = Math.random().toString().substring(2, 12);
  
  try {
    await getRepository(Reset).save({
      email,
      token
    });
    
    const transport = createTransport({
      host: '0.0.0.0',
      port: 1025
    });
  
    const url = `http://localhost:3000/reset/${token}`;
  
    await transport.sendMail({
      from: 'tom_mcvay@live.co.uk',
      to: email,
      subject: 'Reset Password',
      html: `Click <a href="${url}">Here</a> to reset your password`
    });
    
  } catch (error) {
    console.log(error);
    res.json({ msg: 'falied' });
  }

  res.json({ msg: 'sucess', data: {} });
}

export const ResetPassword = async (req: Request, res: Response) => {
  const { token, password, password_confirm } = req.body;

  if (password !== password_confirm) return res.status(400).json({ msg: 'Passwords do not match' });

  const resetPassword = await getRepository(Reset).findOne({token});

  if (!resetPassword) {
    return res.status(400).json({ msg: 'Invalid url' });
  }

  const user = await getRepository(User).findOne({ email: resetPassword.email });

  if (!user) return res.status(404).json({ msg: 'user not found' });

  await getRepository(User).update(user.id, {
    password: await bcrypt.hash(password, 12)
  });

  res.status(200).json({ msg: 'success' });
}