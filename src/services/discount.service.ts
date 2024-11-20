import Discount from '../models/discount.model';

export const validateDiscountCode = async (code: string) => {
    const discount = await Discount.findOne({ code, isActive: true, expiryDate: { $gte: new Date() } });
    return discount;
};
