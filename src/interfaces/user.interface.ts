export interface IUser {
    name: string;
    email: string;
    password: string;
    userName: string;
    uniqueId?: string;
    gender?: string;
    language?: string;
    number1?: string;
    number2?: string;
    whatsAppNo?: string;
    location?: string;
    bio?: string;
    membership?: object;
    verified?: boolean;
  }
  
export interface ICreateUser {
    name: string;
    email: string;
    password: string;
    username: string;
}