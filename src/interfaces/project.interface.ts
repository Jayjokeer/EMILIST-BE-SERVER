import { Document, Types } from 'mongoose';
import { ProjectStatusEnum } from '../enums/project.enum';

export interface IProject extends Document {
    job: Types.ObjectId;       
    artisan: Types.ObjectId;    
    creator: Types.ObjectId;    
    status: ProjectStatusEnum;  
    appliedAt: Date;            
    acceptedAt?: Date;          
    rejectedAt?: Date;          
    createdAt: Date;            
    updatedAt: Date;            
}