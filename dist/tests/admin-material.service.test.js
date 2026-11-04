"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const admin_material_service_1 = require("../src/services/admin-material.service");
(0, node_test_1.default)("admin material pagination applies safe defaults and bounds", () => {
    strict_1.default.deepEqual((0, admin_material_service_1.adminMaterialPagination)(undefined, undefined), { page: 1, limit: 10, skip: 0 });
    strict_1.default.deepEqual((0, admin_material_service_1.adminMaterialPagination)("3", "25"), { page: 3, limit: 25, skip: 50 });
    strict_1.default.deepEqual((0, admin_material_service_1.adminMaterialPagination)("-2", "500"), { page: 1, limit: 100, skip: 0 });
});
(0, node_test_1.default)("material status is derived from moderation and stock", () => {
    strict_1.default.equal((0, admin_material_service_1.materialStockStatus)({ status: "inactive", availableQuantity: 100 }), "delisted");
    strict_1.default.equal((0, admin_material_service_1.materialStockStatus)({ status: "active", availableQuantity: 0 }), "out_of_stock");
    strict_1.default.equal((0, admin_material_service_1.materialStockStatus)({ status: "active", availableQuantity: 5 }), "low_stock");
    strict_1.default.equal((0, admin_material_service_1.materialStockStatus)({ status: "active", availableQuantity: 100 }), "listed");
    strict_1.default.equal((0, admin_material_service_1.materialStockStatus)({ status: "pending", availableQuantity: 100 }), "pending");
});
