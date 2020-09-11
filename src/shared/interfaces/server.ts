import { Request } from 'express';

export interface GetUserRequest extends Request {
  user?: any;
}

export interface UserType {
  id: string;
  password: string;
}
