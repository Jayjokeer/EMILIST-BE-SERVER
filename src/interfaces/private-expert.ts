export interface IExpert {
    fullName: string;
    phoneNumber: string;
    email: string;
    typeOfExpert : string;
    details: string;
    fileUrl: string;
    location: string;
    availability: [{
      time: string;
      date: Date;
    }]
}
