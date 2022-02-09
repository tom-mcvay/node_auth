require('dotenv').config();

import express from 'express';
import cookieParser from 'cookie-parser';
import { createConnection } from 'typeorm';
import { routes } from './routes';
import cors from 'cors';

createConnection().then(() => {
  console.log('Connected to DB');

  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
  }));

  routes(app);

  app.listen(5001, () => console.log('API running...'));
});