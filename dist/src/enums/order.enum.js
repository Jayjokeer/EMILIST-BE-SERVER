"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderPaymentStatus = exports.OrderStatus = void 0;
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["pending"] = "pending";
    OrderStatus["completed"] = "completed";
    OrderStatus["canceled"] = "canceled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var OrderPaymentStatus;
(function (OrderPaymentStatus) {
    OrderPaymentStatus["paid"] = "paid";
    OrderPaymentStatus["unpaid"] = "unpaid";
})(OrderPaymentStatus || (exports.OrderPaymentStatus = OrderPaymentStatus = {}));
