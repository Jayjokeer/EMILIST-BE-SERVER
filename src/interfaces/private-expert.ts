import { JobExpertLevel } from "../enums/jobs.enum";

export interface IExpert {
    fullName: string;
    phoneNumber: string;
    email: string;
    typeOfExpert : string;
    level: JobExpertLevel;
    details: string;
    fileUrl: string;
    location: string;
    availability: [{
      time: string;
      date: Date;
    }]
}
