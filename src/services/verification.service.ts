import Verification from "../models/verification.model";

export const createVerification= async(data: any)=>{
    return await Verification.create(data);
};

export const updateVerification = async (id: string, data: any )=>{
    return await Verification.updateOne({_id: id},
        {
            $set: {
                'paymentStatus': data.paymentStatus
            },
        }
    )
};

export const findById = async (id: string)=>{
    return await Verification.findById(id);
};

export const fetchAllVerifications = async(page: number, limit: number )=>{
    const skip = (page - 1) * limit;

    const [verifications, total] = await Promise.all([
      Verification.find()
        .populate("businessId", "businessName")
        .populate("userId", "firstName lastName email")
        .sort({ createdAt: 1 }) 
        .skip(skip)
        .limit(limit),
      Verification.countDocuments(),
    ]);

    return {
     verifications,
     total,
     currentPage: page,
     totalPages: Math.ceil(total / limit),
     pageSize: limit,
}
};