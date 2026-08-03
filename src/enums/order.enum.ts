export enum OrderStatus{
    pending= "pending",
    completed= "completed",
    canceled= "canceled"
}
export enum OrderPaymentStatus{
    paid= "paid",
    unpaid=  "unpaid",
    pending = "pending",
    failed = "failed",
}
export enum OrderDeliveryStatus{
    orderConfirmed = "orderConfirmed",
    outForDelivery = "outForDelivery",
    delivered = "delivered",
    canceled = "canceled",
    returned = "returned",
}