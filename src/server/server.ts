import chalk from 'chalk';
import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { GetUserRequest, UserType } from '@shared/interfaces/server';

// utils
const log = console.log;

// database
const users = [
  {
    id: 'typescript',
    password: '9999',
  },
  {
    id: 'winter',
    password: '8888',
  },
];

// Set .env environmental variables to process.env
dotenv.config();

const PORT = process.env.PORT || 9001;
const app = express();
app.use(bodyParser.json());

app.listen(PORT, () => {
  log(chalk.bgGreen(`Listening to http://localhost:${PORT}`));
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello 9001 server :)');
});

// + 2 and 4. Call /user api setting
// [Headers] Key: 'Authorization', Value: 'Bearer JWT_TOKEN_STRING'
// After calling /user, you could get { "id": "winter" }
// This JWT Token will be expired after 30s.
// You need to get new JWT Access Token by calling /token api.
app.get('/user', authenticateTokenMiddleware, (req: GetUserRequest, res: Response) => {
  log(chalk.cyan('call /user on 9001 server'));

  const filteredUser = users.filter((_user) => _user.id === req.user.id || '');
  if (!filteredUser.length) {
    log(chalk.bgRed('/user. There is not a user matched in this database'));
    res.sendStatus(403);
  }

  const user: UserType = filteredUser[0];
  log(chalk.red('user.id :', user.id));
  res.json({
    id: user.id,
  });
});

function authenticateTokenMiddleware(req: GetUserRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // get JWT_TOKEN_STRING string
  if (!token) {
    return res.sendStatus(401);
  }

  const secretKey: string = process.env.ACCESS_TOKEN_SECRET_KEY || '';
  jwt.verify(token, secretKey, (error: any, user: any) => {
    if (error) {
      return res.sendStatus(403);
    }

    log(chalk.green('authenticationTokenMiddleware. user :', user));
    req.user = user;

    next();
  });
}
