import { ExpertTypeEnum } from "../enums/business.enum";
import { BadRequestError, NotFoundError } from "../errors/error";
import IBusiness from "../interfaces/business.interface";
import Business from "../models/business.model";
import Review from "../models/review.model";
import * as userService from "./auth.service";
import * as projectService from "../services/project.service";
import BusinessLike from "../models/businessLike.model";

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
  },
  search?: string,
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

  if (search) {
    query.$or = [];
    const businessFields = ['services', 'businessName', 'location', 'bio', 'city', 'state', 'country'];
    businessFields.forEach((field) => {
      query.$or.push({ [field]: { $regex: search, $options: 'i' } });
    });
  }

  if (filters.noticePeriod) {
    query.noticePeriod = filters.noticePeriod;
  }

  const businesses = await Business.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('reviews', 'rating');

  const totalBusinesses = await Business.countDocuments(query);

  let likedBusinessIds: string[] = [];
  let user: any;

  if (userId) {
    const likedBusinesses = await BusinessLike.find({ user: userId }).select('business').lean();
    likedBusinessIds = likedBusinesses.map((like) => like.business.toString());
    user = await userService.findUserWithoutDetailsById(userId);
  }

  const enhancedBusinesses = await Promise.all(
    businesses.map(async (business: any) => {
      const totalReviews = business.reviews.length;
      const averageRating =
        totalReviews > 0
          ? business.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalReviews
          : 0;

      const completedJobs = await projectService.completedJobsCount(String(business._id));
      return {
        ...business.toObject(),
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(2)),
        isCompared: userId ? user.comparedBusinesses.includes(String(business._id)) : false,
        completedJobs,
        liked: likedBusinessIds.includes(String(business._id)),
      };
    })
  );

  const filteredBusinesses = enhancedBusinesses.filter((business) => {
    if (filters.minRating && business.averageRating < filters.minRating) {
      return false;
    }
    if (filters.minReviews && business.totalReviews < filters.minReviews) {
      return false;
    }
    return true;
  });

  return {
    business: filteredBusinesses,
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
  const businesses = await Business.find({ _id: { $in: businessId } })
  .populate('userId', 'fullName email userName uniqueId profileImage level gender')
  .populate('reviews', 'rating')
  .lean();
  const enhancedBusinesses = businesses.map(async (business: any) => {
    const totalReviews = business.reviews.length;
    const averageRating =
      totalReviews > 0
        ? business.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalReviews
        : 0;

    const completedJobs = await projectService.completedJobsCount(String(business._id));
    return {
      ...business.toObject(),
      completedJobs,
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(2)),

    };
  })

return {
  enhancedBusinesses
}
};

export const ifLikedBusiness = async (businessId: string, userId: string)=>{
  return await BusinessLike.findOne({ business: businessId, user: userId });
};

export const createBusinessLike = async (data: any)=>{
  return await BusinessLike.create(data);
};

export const unlikeBusiness = async (businessId: string, userId: string ) =>{
    
  return await BusinessLike.findOneAndDelete({user: userId, business: businessId});
};
export const otherBusinessesByUser = async(userId: string)=>{
  return await  Business.find({userId})
  .sort({ createdAt: -1 })
  .populate('reviews', 'rating');
};


export const fetchSimilarBusinesses = async (businessId: string) => {
    const limit = 10; 

    const targetBusiness = await Business.findById(businessId);
    if (!targetBusiness) {
      throw new NotFoundError('Service not found' );
    }
    const query: Record<string, any> = {
      _id: { $ne: businessId }, 
    };

    if (targetBusiness.city || targetBusiness.state || targetBusiness.country) {
      query.$or = [
        { businessCity: targetBusiness.businessCity },
        { businessState: targetBusiness.businessState},
        { businessCountry: targetBusiness.businessCountry},
      ];
    };

    if (targetBusiness.services?.length) {
      query.services = { $in: targetBusiness.services };
    }

    const similarBusinesses = await Business.find(query)
      .limit(Number(limit))
      .populate('reviews', 'rating');

    const enhancedBusinesses = await Promise.all(
      similarBusinesses.map(async (business: any) => {
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
      })
    );
  
return enhancedBusinesses
};
export const fetchBusinessReviews = async (
  businessId: string,
  page: number,
  limit: number,
  sortBy: 'mostRelevant' | 'newest' = 'newest'
) => {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new NotFoundError('Service not found!');
  }

  const skip = (Number(page) - 1) * Number(limit);

  const sortCriteria: { [key: string]: 1 | -1 } =
  sortBy === 'mostRelevant' ? { helpfulCount: -1, createdAt: -1 } : { createdAt: -1 };

  const reviews = await Review.find({ businessId })
    .skip(skip)
    .limit(Number(limit))
    .sort(sortCriteria)
    .populate('userId', 'profileImage fullName userName uniqueId gender level')
    .lean()
    ;

  const allReviews = await Review.find({ businessId }).lean();

  const starCounts = [1, 2, 3, 4, 5].reduce((acc, star) => {
    acc[star] = allReviews.filter((review) => review.rating === star).length;
    return acc;
  }, {} as Record<number, number>);

  const totalRatings = allReviews.length;
  const averageRating =
    totalRatings > 0
      ? allReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalRatings
      : 0;
      const averageCommunicationRating =
      totalRatings > 0
        ? allReviews.reduce(
            (sum: number, review: any) => sum + review.rateCommunication,
            0
          ) / totalRatings
        : 0;
  
    const averageIsRecommended =
      totalRatings > 0
        ? (allReviews.filter((review) => review.isRecommendVendor).length /
            totalRatings) *
          100
        : 0;

  const data = {
    averageRating: parseFloat(averageRating.toFixed(2)),
    averageCommunicationRating: parseFloat(
      averageCommunicationRating.toFixed(2)
    ),
    serviceAsSeen: parseFloat(averageIsRecommended.toFixed(2)), 
    numberOfRatings: totalRatings,
    starCounts,
    reviews,
    currentPage: Number(page),
    totalPages: Math.ceil(totalRatings / Number(limit)),
  };

  return data;
};

export const markReviewHelpful = async (reviewId: string, isHelpful: boolean, userId?: string) => {


    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found.');
    }

    if (!userId) {

      review.helpfulCount! +=1;
    } else {
      const alreadyMarked = review.helpfulUsers.find(
        (entry: any) => String(entry)=== String(userId)
      );
      if (alreadyMarked) {
        throw new BadRequestError('You have already marked this review.' );
      }

      review.helpfulUsers!.push(userId);
      review.helpfulCount! +=1;
    }

    await review.save();

    return review;

};
