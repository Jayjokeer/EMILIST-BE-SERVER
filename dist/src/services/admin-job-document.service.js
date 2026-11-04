"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminJobPaymentReceiptPdf = exports.buildAdminJobInvoicePdf = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const admin_job_service_1 = require("./admin-job.service");
const renderPdf = (render) => new Promise((resolve, reject) => {
    const doc = new pdfkit_1.default({ margin: 48, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    render(doc);
    doc.end();
});
const money = (currency, amount) => `${currency || "NGN"} ${Number(amount || 0).toLocaleString("en-NG")}`;
const buildAdminJobInvoicePdf = async (jobId, invoiceId) => {
    const [job, invoice] = await Promise.all([(0, admin_job_service_1.fetchAdminJobDetails)(jobId), (0, admin_job_service_1.fetchAdminJobInvoice)(jobId, invoiceId)]);
    return renderPdf((doc) => {
        doc.font("Helvetica-Bold").fontSize(20).text("Emilist Job Invoice");
        doc.moveDown().fontSize(11).text(`Invoice: ${invoice.number}`);
        doc.font("Helvetica").text(`Job: ${job.title} (${String(job._id)})`);
        doc.text(`Issued: ${invoice.issuedAt ? new Date(invoice.issuedAt).toISOString() : "-"}`);
        doc.text(`Status: ${invoice.status}`);
        doc.moveDown().font("Helvetica-Bold").text(invoice.tag);
        doc.moveDown().fontSize(16).text(`Total: ${money(invoice.currency, invoice.subtotal)}`);
        if (invoice.note)
            doc.moveDown().font("Helvetica").fontSize(10).text(`Note: ${invoice.note}`);
    });
};
exports.buildAdminJobInvoicePdf = buildAdminJobInvoicePdf;
const buildAdminJobPaymentReceiptPdf = async (jobId, paymentId) => {
    const [job, payment] = await Promise.all([(0, admin_job_service_1.fetchAdminJobDetails)(jobId), (0, admin_job_service_1.fetchAdminJobPayment)(jobId, paymentId)]);
    return renderPdf((doc) => {
        doc.font("Helvetica-Bold").fontSize(20).text("Emilist Payment Receipt");
        doc.moveDown().fontSize(11).text(`Reference: ${payment.reference || payment._id}`);
        doc.font("Helvetica").text(`Job: ${job.title} (${String(job._id)})`);
        doc.text(`Date: ${new Date(payment.dateCompleted || payment.createdAt).toISOString()}`);
        doc.text(`Status: ${payment.status}`);
        doc.text(`Payment method: ${payment.paymentMethod || "-"}`);
        doc.moveDown().font("Helvetica-Bold").fontSize(16).text(`Amount: ${money(payment.currency, payment.amount)}`);
    });
};
exports.buildAdminJobPaymentReceiptPdf = buildAdminJobPaymentReceiptPdf;
