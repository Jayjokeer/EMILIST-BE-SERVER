"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllAdmins = exports.getAdminById = exports.getAdminByEmail = exports.createAdmin = void 0;
const admin_model_1 = __importDefault(require("../models/admin.model"));
const createAdmin = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield admin_model_1.default.create(payload);
});
exports.createAdmin = createAdmin;
const getAdminByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    return yield admin_model_1.default.findOne({ email: email });
});
exports.getAdminByEmail = getAdminByEmail;
const getAdminById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield admin_model_1.default.findById({ _id: id });
});
exports.getAdminById = getAdminById;
const fetchAllAdmins = (page, limit, search) => __awaiter(void 0, void 0, void 0, function* () {
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
    const totalAdmins = yield admin_model_1.default.countDocuments(query);
    const admins = yield admin_model_1.default.find(query)
        .skip(skip)
        .limit(limit);
    return { admins, totalAdmins };
});
exports.fetchAllAdmins = fetchAllAdmins;
