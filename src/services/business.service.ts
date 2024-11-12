import { NotFoundError } from "../errors/error";
import IBusiness from "../interfaces/business.interface";
import Business from "../models/business.model";

export const createBusiness = async (data:  IBusiness) =>{
    return await Business.create(data);
};
export const updateBusiness = async (  businessId: string, businessData: any, files: any) => {

    const business : any = await Business.findById(businessId);
    if (!business) {
        throw new Error('Business not found');
    }

    if (businessData.renderedServices) {
        businessData.renderedServices.forEach((newService: any) => {
            const existingServiceIndex = business.renderedServices.findIndex(
                (service: any) => String(service._id) == String(newService.id)
            );
            if (existingServiceIndex !== -1) {
                business.renderedServices[existingServiceIndex] = {
                    ...business.renderedServices[existingServiceIndex],
                    ...newService, 
                };
            } else {
                business.renderedServices.push(newService);
            }
        });
    }

    if (businessData.certification) {
        businessData.certification.forEach((newCert: any) => {
            const existingCertIndex = business.certification.findIndex(
                (cert: any) => String(cert._id)== String(newCert.id)
            );
            if (existingCertIndex !== -1) {
                let certificatePath;
                if(files && files['certificate']){
                    certificatePath = files['certificate'].path;
                    newCert.certificate =  certificatePath;
                }
                business.certification[existingCertIndex] = {
                    ...business.certification[existingCertIndex],
                    ...newCert,
                    certificate: newCert.certificate || business.certification[existingCertIndex].certificate,
                };
            } else {
                business.certification.push(newCert);
            }
        });
    }

    if (businessData.membership) {
        businessData.membership.forEach((newMembership: any) => {
            const existingMembershipIndex = business.membership.findIndex(
                (membership: any) => String(membership._id) == String(newMembership.id)
            );
            if (existingMembershipIndex !== -1) {
                business.membership[existingMembershipIndex] = {
                    ...business.membership[existingMembershipIndex],
                    ...newMembership,
                };
            } else {
                business.membership.push(newMembership);
            }
        });
    }

    if (businessData.insurance) {
        businessData.insurance.forEach((newInsurance: any) => {
            const existingInsuranceIndex = business.insurance.findIndex(
                (ins: any) => String(ins._id) == String(newInsurance.id)
            );
            if (existingInsuranceIndex !== -1) {
                business.insurance[existingInsuranceIndex] = {
                    ...business.insurance[existingInsuranceIndex],
                    ...newInsurance,
                };
            } else {
                business.insurance.push(newInsurance);
            }
        });
    }

    business.firstName = businessData.firstName || business.firstName;
    business.lastName = businessData.lastName || business.lastName;
    business.languages = businessData.languages || business.languages;
    business.address = businessData.address || business.address;
    business.phoneNumber = businessData.phoneNumber || business.phoneNumber;
    business.city = businessData.city || business.city;
    business.state = businessData.state || business.state;
    business.country = businessData.country || business.country;
    business.bio = businessData.bio || business.bio;

    if (files['profileImage']) {
        business.profileImage = files['profileImage'].path;
    }

    await business.save();
    return business;
};
export const fetchUserBusiness = async (userId: string)=>{
    return await Business.findOne({userId});
}
export const fetchSingleBusiness = async (businessId: string)=>{
    return await Business.findById(businessId);
}