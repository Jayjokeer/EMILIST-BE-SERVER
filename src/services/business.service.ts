import { ExpertTypeEnum } from "../enums/business.enum";
import { NotFoundError } from "../errors/error";
import IBusiness from "../interfaces/business.interface";
import Business from "../models/business.model";
import Review from "../models/review.model";
import * as userService from "./auth.service";

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
    return  await Business.findById(businessId)
    .populate('userId', 'fullName email userName uniqueId profileImage level')
  
};
export const fetchSingleBusinessWithDetails = async (businessId: string)=>{
    const business =  await Business.findById(businessId)
    .populate('userId', 'fullName email userName uniqueId profileImage level')
    .populate('reviews', 'rating');
    if(!business){
        return null;
    }
    const totalReviews = business.reviews.length;
    const averageRating =
      totalReviews > 0
        ? business.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalReviews
        : 0;
  
    return {
      ...business.toObject(),
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(2)),
    };
};

export const fetchAllBusiness = async (
  userId: string,
  page: number,
  limit: number,
  filters: {
    startPriceRange?: [number, number];
    expertType?: ExpertTypeEnum;
    minRating?: number;
    minReviews?: number;
    location?: string;
    noticePeriod?: string;
  }
) => {
  const skip = (page - 1) * limit;

  const query: Record<string, any> = {};

  if (filters.startPriceRange) {
    query.startingPrice = {
      $gte: filters.startPriceRange[0],
      $lte: filters.startPriceRange[1],
    };
  }

  if (filters.expertType) {
    query.expertType = filters.expertType;
  }

  if (filters.location) {
    query.$or = [
      { city: { $regex: filters.location, $options: 'i' } },
      { state: { $regex: filters.location, $options: 'i' } },
      { country: { $regex: filters.location, $options: 'i' } },
    ];
  }

  if (filters.noticePeriod) {
    query.noticePeriod = filters.noticePeriod;
  }
  let user;
  if(userId){
     user = await userService.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    };  }
  

  const comparedBusinesses = user?.comparedBusinesses || []; 

  const businesses = await Business.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('reviews', 'rating');

  const totalBusinesses = await Business.countDocuments(query);

  const enhancedBusinesses = businesses
    .map((business: any) => {
      const totalReviews = business.reviews.length;
      const averageRating =
        totalReviews > 0
          ? business.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalReviews
          : 0;
      return {
        ...business.toObject(),
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(2)),
        isCompared: comparedBusinesses.some(
          (id: any) => String(id) == String(business._id)
        ),

      };
    })
    .filter((business) => {
      if (filters.minRating && business.averageRating < filters.minRating) {
        return false;
      }
      if (filters.minReviews && business.totalReviews < filters.minReviews) {
        return false;
      }
      return true;
    });

  return {
    business: enhancedBusinesses,
    totalPages: Math.ceil(totalBusinesses / limit),
    currentPage: page,
    totalBusinesses,
  };
};


export const deleteBusiness = async (businessId: string)=>{
    return await Business.findByIdAndDelete(businessId);
};

export const fetchAllUserBusinessesAdmin = async (userId: string)=>{
    return await Business.find({userId: userId})
    .sort({ createdAt: -1 })
    .populate('reviews', 'rating')
    .lean();
};
export const fetchAllComparedBusinesses = async (businessId: string[])=>{
  const businesses = await Business.find({ _id: { $in: businessId } });
  return businesses;
};