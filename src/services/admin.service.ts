import Admin from "../models/admin.model";

export const createAdmin = async(payload: any)=>{
   return await Admin.create(payload);
}

export const getAdminByEmail = async(email:string)=>{
    return await Admin.findOne({email: email});
}

export const getAdminById = async(id: string)=>{
    return await Admin.findById({_id: id})
}

export const fetchAllAdmins = async(page: number, limit: number, search: string)=>{
  const skip = (page - 1) * limit;
  let query: any = {};
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { status: searchRegex },
    ];
  }
  const totalAdmins = await Admin.countDocuments(query);

  const admins = await Admin.find(query)
    .skip(skip)
    .limit(limit)
    return {admins, totalAdmins}
  };
