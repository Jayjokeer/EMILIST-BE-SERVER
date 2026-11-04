"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminPaymentPdf = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const admin_payment_service_1 = require("./admin-payment.service");
const buildAdminPaymentPdf = async (transactionId) => {
    const payment = await (0, admin_payment_service_1.fetchAdminPayment)(transactionId);
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ margin: 48, size: "A4" });
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        doc.font("Helvetica-Bold").fontSize(20).text("Emilist Transaction Receipt");
        doc.moveDown().font("Helvetica").fontSize(11);
        doc.text(`Transaction ID: ${payment.transactionId}`);
        doc.text(`Date: ${new Date(payment.date).toISOString()}`);
        doc.text(`Direction: ${payment.direction}`);
        doc.text(`Status: ${payment.status}`);
        doc.text(`Counterparty: ${payment.counterparty || "-"}`);
        doc.text(`Payment method: ${payment.paymentMethod || "-"}`);
        doc.text(`Description: ${payment.description || "-"}`);
        doc.moveDown().font("Helvetica-Bold").fontSize(17);
        doc.text(`Amount: ${payment.currency} ${Number(payment.amount || 0).toLocaleString("en-NG")}`);
        doc.end();
    });
};
exports.buildAdminPaymentPdf = buildAdminPaymentPdf;
