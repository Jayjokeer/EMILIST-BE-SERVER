"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllAdmins = exports.getAdminById = exports.getAdminByEmail = exports.createAdmin = void 0;
const admin_model_1 = __importDefault(require("../models/admin.model"));
const createAdmin = async (payload) => {
    return await admin_model_1.default.create(payload);
};
exports.createAdmin = createAdmin;
const getAdminByEmail = async (email) => {
    return await admin_model_1.default.findOne({ email: email });
};
exports.getAdminByEmail = getAdminByEmail;
const getAdminById = async (id) => {
    return await admin_model_1.default.findById({ _id: id });
};
exports.getAdminById = getAdminById;
const fetchAllAdmins = async (page, limit, search) => {
    const skip = (page - 1) * limit;
    let query = {};
    if (search && search.trim() !== '') {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
            { fullName: searchRegex },
            { email: searchRegex },
            { status: searchRegex },
        ];
    }
    const totalAdmins = await admin_model_1.default.countDocuments(query);
    const admins = await admin_model_1.default.find(query)
        .skip(skip)
        .limit(limit);
    return { admins, totalAdmins };
};
exports.fetchAllAdmins = fetchAllAdmins;
