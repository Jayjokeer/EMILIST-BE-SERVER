import NewsLetter from "../models/newsletter.model";

export const subscribeNewsLetter = async(email: string)=>{
    return await NewsLetter.create({email});
};