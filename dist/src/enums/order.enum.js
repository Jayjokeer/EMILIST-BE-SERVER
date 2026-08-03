"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderDeliveryStatus = exports.OrderPaymentStatus = exports.OrderStatus = void 0;
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
    OrderPaymentStatus["pending"] = "pending";
    OrderPaymentStatus["failed"] = "failed";
})(OrderPaymentStatus || (exports.OrderPaymentStatus = OrderPaymentStatus = {}));
var OrderDeliveryStatus;
(function (OrderDeliveryStatus) {
    OrderDeliveryStatus["orderConfirmed"] = "orderConfirmed";
    OrderDeliveryStatus["outForDelivery"] = "outForDelivery";
    OrderDeliveryStatus["delivered"] = "delivered";
    OrderDeliveryStatus["canceled"] = "canceled";
    OrderDeliveryStatus["returned"] = "returned";
})(OrderDeliveryStatus || (exports.OrderDeliveryStatus = OrderDeliveryStatus = {}));
