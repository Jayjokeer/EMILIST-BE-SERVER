"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCustomerAction = exports.CustomerSuspensionReason = exports.CustomerSuspensionType = void 0;
var CustomerSuspensionType;
(function (CustomerSuspensionType) {
    CustomerSuspensionType["temporary"] = "temporary";
    CustomerSuspensionType["permanent"] = "permanent";
})(CustomerSuspensionType || (exports.CustomerSuspensionType = CustomerSuspensionType = {}));
var CustomerSuspensionReason;
(function (CustomerSuspensionReason) {
    CustomerSuspensionReason["fraud"] = "Fraud";
    CustomerSuspensionReason["policyViolation"] = "Policy Violation";
    CustomerSuspensionReason["unpaidEscrow"] = "Unpaid Escrow";
    CustomerSuspensionReason["offPlatformHarassment"] = "Off-Platform Harassment";
    CustomerSuspensionReason["fakeProfileOrDocumentation"] = "Fake Profile or Documentation";
})(CustomerSuspensionReason || (exports.CustomerSuspensionReason = CustomerSuspensionReason = {}));
var AdminCustomerAction;
(function (AdminCustomerAction) {
    AdminCustomerAction["customerCreated"] = "customer.created";
    AdminCustomerAction["profileUpdated"] = "customer.profile_updated";
    AdminCustomerAction["passwordResetTriggered"] = "customer.password_reset_triggered";
    AdminCustomerAction["messageSent"] = "customer.message_sent";
    AdminCustomerAction["customerSuspended"] = "customer.suspended";
    AdminCustomerAction["customerReactivated"] = "customer.reactivated";
    AdminCustomerAction["walletCredited"] = "customer.wallet_credited";
    AdminCustomerAction["walletDebited"] = "customer.wallet_debited";
})(AdminCustomerAction || (exports.AdminCustomerAction = AdminCustomerAction = {}));
