import chalk from 'chalk';
import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { GetUserRequest, UserType } from '@shared/interfaces/server';

// utils
const log = console.log;

// database
let refreshTokens: string[] = [];

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

const PORT = process.env.PORT || 3001;
const app = express();
app.use(bodyParser.json());

app.listen(PORT, () => {
  log(chalk.bgGreen(`Listening to http://localhost:${PORT}`));
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello 3001 auth server :)');
});

// + 3. Call /token api setting
// [Header] Key: 'Content-Type', Value: 'application/json'
// [Body] { "refreshToken": "JWT_REFRESH_TOKEN_STRING" }
// After calling /token, you can get new { "accessToken": "JWT_TOKEN_STRING" }
app.post('/token', (req: Request, res: Response) => {
  log(chalk.cyan('call /token on 3001 server'));

  const refreshToken: string = req.body.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  const hasRefreshToken: boolean = refreshTokens.includes(refreshToken);
  console.log('hasRefreshToken :', hasRefreshToken);
  if (!hasRefreshToken) return res.sendStatus(403);

  const secretKey: string = process.env.REFRESH_TOKEN_SECRET_KEY || '';
  jwt.verify(refreshToken, secretKey, (error, user: any) => {
    console.log('error :', error);
    if (error) return res.sendStatus(403);

    const accessToken: string = generateAccessToken({
      id: user?.id || '',
    });

    res.json({ accessToken });
  });
});

// + 5. Call /logout api setting
// [Header] Key: 'Content-Type', Value: 'application/json'
// [Body] { "refreshToken": "JWT_REFRESH_TOKEN_STRING" }
// After calling /logout, JWT Refresh Token will be expired.
app.delete('/logout', (req, res) => {
  const refreshToken: string = req.body.refreshToken;
  console.log('refreshToken :', refreshToken);
  if (!refreshToken) return res.sendStatus(401);

  refreshTokens = refreshTokens.filter((token) => token !== req.body.refreshToken);
  console.log('refreshTokens :', refreshTokens);

  res.status(200).send({
    result: 'success',
    message: 'success logout. Refresh Token you sent has been expired',
  });
});

// + 1. Call /login api setting
// [Header] Key: 'Content-Type', Value: 'application/json'
// [Body] { "id": "winter", "password": "8888" }
// After calling /login, you can get { "accessToken": "JWT_TOKEN_STRING", "refreshToken": "JWT_REFRESH_TOKEN_STRING" }
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

  const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken(user);
  refreshTokens.push(refreshToken);

  log(chalk.red('JWT access token :', accessToken));
  log(chalk.red('JWT refresh token :', refreshToken));
  res.json({ accessToken, refreshToken });
});

function generateRefreshToken(user: UserType) {
  // REFRESH_TOKEN_SECRET_KEY value is in .env file.
  const secretKey: string = process.env.REFRESH_TOKEN_SECRET_KEY || '';

  const refreshToken = jwt.sign(
    {
      id: user.id,
    },
    secretKey
  );

  return refreshToken;
}

function generateAccessToken(user: UserType) {
  // ACCESS_TOKEN_SECRET_KEY value is in .env file.
  const secretKey: string = process.env.ACCESS_TOKEN_SECRET_KEY || '';

  const accessToken = jwt.sign(
    {
      id: user.id,
    },
    secretKey,
    {
      expiresIn: '30s', // After 30 seconds, this Access Token will be expired.
    }
  );

  return accessToken;
}
