import { ICreateUser } from "../interfaces/user.interface";
import Users from "../models/users.model";

export const findUserByEmail = async (email: string) => {
    return await Users.findOne({email: email});
  };
export const finduserById = async (id: string)=>{
    return await Users.findById(id);
}
export const createUser = async (data:  ICreateUser) =>{
    return await Users.create(data);
}