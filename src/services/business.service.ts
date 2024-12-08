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
            const existingCert = business.certification.find(
                (cert: any) => String(cert._id) === String(newCert.id)
            );

            if (existingCert) {
                if (files && files['certificate'] && files['certificate'].path) {
                    existingCert.certificate = files['certificate'].path;
                }
                existingCert.issuingOrganisation = newCert.issuingOrganisation || existingCert.issuingOrganisation;
                existingCert.verificationNumber = newCert.verificationNumber || existingCert.verificationNumber;
                existingCert.issuingDate = newCert.issuingDate || existingCert.issuingDate;
                existingCert.expiringDate = newCert.expiringDate || existingCert.expiringDate;
                existingCert.isCertificateExpire = newCert.isCertificateExpire || existingCert.isCertificateExpire;
            } else {
                const certificatePath = files?.['certificate'][0]?.path;
                newCert.certificate= certificatePath
                business.certification.push({
                    ...newCert,
                });
            }
        });
    }
    

    if (businessData.membership) {
        businessData.membership.forEach((newMembership: any) => {
            const existingMembership = business.membership.find(
                (membership: any) => String(membership._id) === String(newMembership.id)
            );
            if (existingMembership ) {
                existingMembership.organisation = newMembership.organisation || existingMembership.organisation;
                existingMembership.positionHeld = newMembership.positionHeld || existingMembership.positionHeld;
                existingMembership.startDate = newMembership.startDate || existingMembership.startDate;
                existingMembership.endDate = newMembership.endDate || existingMembership.endDate;
                existingMembership.isMembershipExpire = newMembership.isMembershipExpire || existingMembership.isMembershipExpire;


            } else {
                business.membership.push(newMembership);
            }
        });
    }

    if (businessData.insurance) {
        businessData.insurance.forEach((newInsurance: any) => {
            const existingInsurance = business.insurance.find(
                (ins: any) => String(ins._id) == String(newInsurance.id)
            );
            if (existingInsurance ) {
                existingInsurance.issuingOrganisation = newInsurance.issuingOrganisation || existingInsurance.issuingOrganisation;
                existingInsurance.coverage = newInsurance.coverage|| existingInsurance.coverage;
                existingInsurance.description = newInsurance.description || existingInsurance.description;

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
    business.businessName = businessData.businessName || business.businessName;
    business.yearFounded = businessData.yearFounded || business.yearFounded;
    business.numberOfEmployee = businessData.numberOfEmployee || business.numberOfEmployee;
    business.businessAddress = businessData.businessAddress || business.businessAddress;
    business.businessCity = businessData.businessCity || business.businessCity;
    business.businessState = businessData.businessState || business.businessState;
    business.businessCountry = businessData.businessCountry || business.businessCountry;
    business.startingPrice = businessData.startingPrice || business.startingPrice;
    business.noticePeriod = businessData.noticePeriod || business.noticePeriod;
    business.businessDescription = businessData.businessDescription || business.businessDescription;
    business.currency = businessData.currency || business.currency;

    if (files['profileImage']) {
        business.profileImage = files['profileImage'][0].path;
    }
    if (files['businessImages'] && files['businessImages'].length > 0) {
        const newBusinessImages = files['businessImages'].map((file: any) => ({
            imageUrl: file.path,
        }));
        business.businessImages.push(...newBusinessImages);
    }
    await business.save();
    return business;
};
export const fetchUserBusiness = async (userId: string)=>{
    return await Business.findOne({userId});
};
export const fetchSingleBusiness = async (businessId: string)=>{
    return await Business.findById(businessId).populate('userId', 'fullName email userName uniqueId profileImage level');
};
export const fetchAllBusiness = async (page:number, limit: number)=>{
    const skip = (page - 1) * limit;

    const business = await Business.find()
    .sort({ createdAt: -1 }) 
    .skip(skip)
    .limit(limit);
    
    const totalBusinesses = await Business.countDocuments();
    return {
        business,
        totalPages: Math.ceil( totalBusinesses / limit),
        currentPage: page,
        totalBusinesses,
      };
};

export const deleteBusiness = async (businessId: string)=>{
    return await Business.findByIdAndDelete(businessId);
};