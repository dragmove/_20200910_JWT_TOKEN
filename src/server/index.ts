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
  res.send('Hello JWT');
});

// 1. Call /login api setting
// [Header] Key: 'Content-Type', Value: 'application/json'
// [Body] { "id": "winter", "password": "8888" }
// After calling /login, you could get { "accessToken": "JWT_TOKEN_STRING" }
app.post('/login', (req: Request, res: Response) => {
  // Authentication
  const { id, password } = req.body;

  // Find a user in database
  let filteredUser: UserType[] = users.filter((_user) => _user.id === id && _user.password === password);
  if (!filteredUser.length) {
    log(chalk.bgRed('/login. There is not a user matched in this database'));
    res.sendStatus(404);
  }

  const user: UserType = filteredUser[0];
  log(chalk.cyan('call /login. user :', user.id, user.password));

  // ACCESS_TOKEN_SECRET_KEY value is in .env file.
  const secretKey: string = process.env.ACCESS_TOKEN_SECRET_KEY || '';
  if (!secretKey) {
    throw new Error('Access token secret key is not defined.');
  }

  // create JWT Token using secret key
  const accessToken = jwt.sign(
    {
      id: user.id,
    },
    secretKey
  );
  log(chalk.red('JWT Token :', accessToken));
  res.json({ accessToken });
});

// 2. Call /user api setting
// [Headers] Key: 'Authorization', Value: 'Bearer JWT_TOKEN_STRING'
// After calling /user, you could get { "id": "winter" }
app.get('/user', authenticateTokenMiddleware, (req: GetUserRequest, res: Response) => {
  log(chalk.cyan('call /user'));

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
      return res.sendStatus(500);
    }

    log(chalk.green('authenticationTokenMiddleware. user :', user));
    req.user = user;

    next();
  });
}
