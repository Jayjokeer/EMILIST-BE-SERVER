"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationEnum = exports.UserRolesEnum = exports.UserStatus = void 0;
var UserStatus;
(function (UserStatus) {
    UserStatus["active"] = "Active";
    UserStatus["suspended"] = "Suspended";
    UserStatus["deactivated"] = "Deactivated";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var UserRolesEnum;
(function (UserRolesEnum) {
    UserRolesEnum["user"] = "user";
    UserRolesEnum["admin"] = "admin";
})(UserRolesEnum || (exports.UserRolesEnum = UserRolesEnum = {}));
var VerificationEnum;
(function (VerificationEnum) {
    VerificationEnum["user"] = "user";
    VerificationEnum["business"] = "business";
    VerificationEnum["certificate"] = "certificate";
})(VerificationEnum || (exports.VerificationEnum = VerificationEnum = {}));
