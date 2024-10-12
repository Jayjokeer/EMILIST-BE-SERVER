import { ISignUser } from "../interfaces/user.interface";


declare global {
  namespace Express {
    interface Request {
      user?: ISignUser;
    }
  }
}