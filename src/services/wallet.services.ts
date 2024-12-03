import Wallet from "../models/wallet.model";

export const createWallet= async(data: any)=>{
    return await Wallet.create(data);
};

export const findUserWallet = async (userId: string)=>{
    return await Wallet.findOne({userId: userId});
};

export const fundWallet = async (amount: number, userId: string)=>{

}