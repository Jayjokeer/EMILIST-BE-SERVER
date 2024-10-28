import { Document, Types } from 'mongoose';
import { ProjectStatusEnum } from '../enums/project.enum';

export interface IProject extends Document {
    job: string;       
    user: string;    
    creator: string;    
    status?: ProjectStatusEnum;  
    appliedAt?: Date;            
    acceptedAt?: Date;          
    rejectedAt?: Date;                   
}